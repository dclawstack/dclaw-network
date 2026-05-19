"""
Statistical anomaly detection service.
Runs as a background asyncio task every 5 minutes.
Per device per metric: computes a rolling 7-day baseline (mean + stddev).
Z-score > 3.0 triggers an anomaly Alert.
"""
import asyncio
import logging
import math
from datetime import timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import engine
from app.core.utils import utc_now
from app.models.alert import Alert, AlertSeverity, AlertStatus
from app.models.metric import MetricSample, MetricType

logger = logging.getLogger(__name__)

POLL_INTERVAL = 300  # 5 minutes
Z_THRESHOLD = 3.0
BASELINE_DAYS = 7
MIN_SAMPLES = 10  # need enough data for a reliable baseline


async def _compute_baseline(
    session: AsyncSession, device_id, metric_type: MetricType
) -> tuple[float, float] | None:
    """Return (mean, stddev) from the last 7 days for a device+metric, or None."""
    cutoff = utc_now() - timedelta(days=BASELINE_DAYS)
    result = await session.execute(
        select(func.avg(MetricSample.value), func.stddev_pop(MetricSample.value))
        .where(
            MetricSample.device_id == device_id,
            MetricSample.metric_type == metric_type,
            MetricSample.sampled_at >= cutoff,
        )
    )
    row = result.one()
    mean, stddev = row[0], row[1]
    if mean is None or stddev is None or stddev == 0:
        return None
    return float(mean), float(stddev)


async def _count_recent_samples(
    session: AsyncSession, device_id, metric_type: MetricType
) -> int:
    cutoff = utc_now() - timedelta(days=BASELINE_DAYS)
    result = await session.execute(
        select(func.count())
        .select_from(MetricSample)
        .where(
            MetricSample.device_id == device_id,
            MetricSample.metric_type == metric_type,
            MetricSample.sampled_at >= cutoff,
        )
    )
    return result.scalar() or 0


async def _open_anomaly_exists(
    session: AsyncSession, device_id, metric_type: MetricType
) -> bool:
    title_prefix = f"Anomaly detected: {metric_type.value}"
    result = await session.execute(
        select(Alert).where(
            Alert.device_id == device_id,
            Alert.status == AlertStatus.open,
            Alert.title.startswith(title_prefix),
        )
    )
    return result.scalar_one_or_none() is not None


async def _run_anomaly_checks() -> None:
    window = utc_now() - timedelta(minutes=10)
    async with AsyncSession(engine, expire_on_commit=False) as session:
        # Get all (device_id, metric_type) pairs with recent samples
        result = await session.execute(
            select(MetricSample.device_id, MetricSample.metric_type, MetricSample.value)
            .where(MetricSample.sampled_at >= window)
            .distinct(MetricSample.device_id, MetricSample.metric_type)
        )
        recent = result.all()

        for device_id, metric_type, latest_value in recent:
            n = await _count_recent_samples(session, device_id, metric_type)
            if n < MIN_SAMPLES:
                continue

            baseline = await _compute_baseline(session, device_id, metric_type)
            if baseline is None:
                continue

            mean, stddev = baseline
            z_score = abs(latest_value - mean) / stddev

            if z_score < Z_THRESHOLD:
                continue

            if await _open_anomaly_exists(session, device_id, metric_type):
                continue

            alert = Alert(
                device_id=device_id,
                severity=AlertSeverity.warning,
                title=f"Anomaly detected: {metric_type.value} = {latest_value:.1f}",
                description=(
                    f"Z-score of {z_score:.2f} (threshold {Z_THRESHOLD}) indicates "
                    f"{metric_type.value} is {latest_value:.2f}, which is "
                    f"{abs(latest_value - mean):.2f} units from the 7-day baseline mean "
                    f"of {mean:.2f} (stddev {stddev:.2f})."
                ),
            )
            session.add(alert)
            logger.info(
                "Anomaly alert: device=%s metric=%s value=%.2f z=%.2f",
                device_id, metric_type.value, latest_value, z_score,
            )

        await session.commit()


async def run_anomaly_detector() -> None:
    """Long-running background task — call from FastAPI lifespan."""
    logger.info("Anomaly detector started (poll interval: %ds)", POLL_INTERVAL)
    while True:
        try:
            await _run_anomaly_checks()
        except Exception:
            logger.exception("Anomaly detector error")
        await asyncio.sleep(POLL_INTERVAL)

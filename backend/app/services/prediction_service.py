"""
Outage prediction service using Exponential Weighted Moving Average (EWMA).
Runs as a background asyncio task every 10 minutes.
For each device, computes EWMA trend on latency_ms and packet_loss_pct over the
last 2 hours. If the trend slope implies the value will double within 30 minutes,
creates a predictive warning Alert.
"""
import asyncio
import logging
from datetime import timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import engine
from app.core.utils import utc_now
from app.models.alert import Alert, AlertSeverity, AlertStatus
from app.models.metric import MetricSample, MetricType

logger = logging.getLogger(__name__)

POLL_INTERVAL = 600   # 10 minutes
EWMA_ALPHA = 0.3      # smoothing factor
WINDOW_HOURS = 2
MIN_POINTS = 5        # need at least 5 samples to compute a meaningful trend
PREDICTION_MINUTES = 30


def _compute_ewma_slope(values: list[float]) -> float:
    """
    Compute EWMA and return the slope (per-sample change) of the smoothed series.
    Uses simple linear regression on the EWMA-smoothed values.
    """
    if len(values) < 2:
        return 0.0

    # Build EWMA series
    ewma = [values[0]]
    for v in values[1:]:
        ewma.append(EWMA_ALPHA * v + (1 - EWMA_ALPHA) * ewma[-1])

    # Linear regression slope on EWMA series
    n = len(ewma)
    xs = list(range(n))
    x_mean = (n - 1) / 2
    y_mean = sum(ewma) / n
    numerator = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, ewma))
    denominator = sum((x - x_mean) ** 2 for x in xs)
    return numerator / denominator if denominator else 0.0


async def _open_prediction_exists(session: AsyncSession, device_id, metric_type: MetricType) -> bool:
    title_prefix = f"Predicted degradation: {metric_type.value}"
    result = await session.execute(
        select(Alert).where(
            Alert.device_id == device_id,
            Alert.status == AlertStatus.open,
            Alert.title.startswith(title_prefix),
        )
    )
    return result.scalar_one_or_none() is not None


async def _run_predictions() -> None:
    cutoff = utc_now() - timedelta(hours=WINDOW_HOURS)
    async with AsyncSession(engine, expire_on_commit=False) as session:
        # Get distinct devices that have recent latency or packet_loss data
        result = await session.execute(
            select(MetricSample.device_id)
            .where(
                MetricSample.sampled_at >= cutoff,
                MetricSample.metric_type.in_([MetricType.latency_ms, MetricType.packet_loss_pct]),
            )
            .distinct()
        )
        device_ids = [row[0] for row in result.all()]

        for device_id in device_ids:
            for metric_type in [MetricType.latency_ms, MetricType.packet_loss_pct]:
                samples_result = await session.execute(
                    select(MetricSample.value)
                    .where(
                        MetricSample.device_id == device_id,
                        MetricSample.metric_type == metric_type,
                        MetricSample.sampled_at >= cutoff,
                    )
                    .order_by(MetricSample.sampled_at.asc())
                )
                values = [row[0] for row in samples_result.all()]

                if len(values) < MIN_POINTS:
                    continue

                slope = _compute_ewma_slope(values)
                current = values[-1]

                if current <= 0 or slope <= 0:
                    continue

                # Estimate when value will double: time_to_double = current / slope (in samples)
                samples_to_double = current / slope
                # Assume samples are roughly every 60s (alert_engine poll interval)
                minutes_to_double = samples_to_double * 1.0  # ~1 min per sample

                if minutes_to_double > PREDICTION_MINUTES:
                    continue

                if await _open_prediction_exists(session, device_id, metric_type):
                    continue

                alert = Alert(
                    device_id=device_id,
                    severity=AlertSeverity.warning,
                    title=f"Predicted degradation: {metric_type.value} in ~{int(minutes_to_double)}min",
                    description=(
                        f"EWMA trend analysis shows {metric_type.value} is rising at "
                        f"{slope:.3f} per sample. At the current value of {current:.2f}, "
                        f"it is projected to double within ~{int(minutes_to_double)} minutes. "
                        f"Recommend investigating device connectivity and upstream links."
                    ),
                )
                session.add(alert)
                logger.info(
                    "Prediction alert: device=%s metric=%s slope=%.3f eta=%dmin",
                    device_id, metric_type.value, slope, int(minutes_to_double),
                )

        await session.commit()


async def run_prediction_service() -> None:
    """Long-running background task — call from FastAPI lifespan."""
    logger.info("Prediction service started (poll interval: %ds)", POLL_INTERVAL)
    while True:
        try:
            await _run_predictions()
        except Exception:
            logger.exception("Prediction service error")
        await asyncio.sleep(POLL_INTERVAL)

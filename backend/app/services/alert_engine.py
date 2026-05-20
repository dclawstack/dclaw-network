"""
Threshold-based alert engine.
Runs as a background asyncio task started in app lifespan.
Polls recent MetricSamples and auto-creates Alerts when thresholds are exceeded.
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
from app.models.device import Device

logger = logging.getLogger(__name__)

THRESHOLDS: dict[MetricType, tuple[float, float]] = {
    MetricType.latency_ms:       (200.0, 500.0),   # warning, critical
    MetricType.packet_loss_pct:  (2.0,   10.0),
    MetricType.cpu_pct:          (80.0,  95.0),
    MetricType.memory_pct:       (85.0,  95.0),
}

POLL_INTERVAL = 60  # seconds


async def _check_open_alert_exists(session: AsyncSession, device_id, metric_type: MetricType) -> bool:
    """Return True if an open alert for this device+metric already exists."""
    title_prefix = f"Threshold breach: {metric_type.value}"
    result = await session.execute(
        select(Alert).where(
            Alert.device_id == device_id,
            Alert.status == AlertStatus.open,
            Alert.title.startswith(title_prefix),
        )
    )
    return result.scalar_one_or_none() is not None


async def _run_checks() -> None:
    cutoff = utc_now() - timedelta(minutes=5)
    async with AsyncSession(engine, expire_on_commit=False) as session:
        result = await session.execute(
            select(MetricSample).where(
                MetricSample.sampled_at >= cutoff,
                MetricSample.metric_type.in_(list(THRESHOLDS.keys())),
            )
        )
        samples = result.scalars().all()

        for sample in samples:
            thresholds = THRESHOLDS.get(sample.metric_type)
            if not thresholds:
                continue
            warn_thresh, crit_thresh = thresholds

            if sample.value >= crit_thresh:
                severity = AlertSeverity.critical
            elif sample.value >= warn_thresh:
                severity = AlertSeverity.warning
            else:
                continue

            if await _check_open_alert_exists(session, sample.device_id, sample.metric_type):
                continue

            dev_result = await session.execute(
                select(Device).where(Device.id == sample.device_id)
            )
            device = dev_result.scalar_one_or_none()
            hostname = device.hostname if device else "unknown"

            alert = Alert(
                device_id=sample.device_id,
                severity=severity,
                title=f"Threshold breach: {sample.metric_type.value} = {sample.value:.1f}",
                description=(
                    f"{sample.metric_type.value} reached {sample.value:.2f} "
                    f"(threshold: {'critical' if severity == AlertSeverity.critical else 'warning'} "
                    f"= {crit_thresh if severity == AlertSeverity.critical else warn_thresh})"
                ),
            )
            session.add(alert)
            logger.info("Alert created: device=%s metric=%s value=%.2f", sample.device_id, sample.metric_type, sample.value)

            if severity == AlertSeverity.critical:
                from app.services.webhook_service import notify_alert
                from app.core.event_bus import publish_alert
                await asyncio.to_thread(notify_alert, alert, hostname)
                await publish_alert({
                    "type": "alert",
                    "severity": severity.value,
                    "title": alert.title,
                    "device_id": str(sample.device_id),
                    "hostname": hostname,
                })

        await session.commit()


async def run_alert_engine() -> None:
    """Long-running background task — call from FastAPI lifespan."""
    logger.info("Alert engine started (poll interval: %ds)", POLL_INTERVAL)
    while True:
        try:
            await _run_checks()
        except Exception:
            logger.exception("Alert engine error")
        await asyncio.sleep(POLL_INTERVAL)

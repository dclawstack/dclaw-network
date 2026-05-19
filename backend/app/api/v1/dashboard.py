from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.device import DeviceStatus
from app.repositories.device_repo import DeviceRepository
from app.repositories.alert_repo import AlertRepository
from app.repositories.metric_repo import MetricRepository
from app.schemas.dashboard import DashboardStats

router = APIRouter()


@router.get("/", response_model=DashboardStats)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    device_repo = DeviceRepository(db)
    alert_repo = AlertRepository(db)
    metric_repo = MetricRepository(db)

    total_devices = await device_repo.count()
    status_counts = await device_repo.count_by_status()
    open_alerts = await alert_repo.count_open()
    critical_alerts = await alert_repo.count_critical_open()
    avg_latency_ms = await metric_repo.avg_latency_last_hour()

    return DashboardStats(
        total_devices=total_devices,
        online_count=status_counts.get(DeviceStatus.online.value, 0),
        offline_count=status_counts.get(DeviceStatus.offline.value, 0),
        degraded_count=status_counts.get(DeviceStatus.degraded.value, 0),
        unknown_count=status_counts.get(DeviceStatus.unknown.value, 0),
        open_alerts=open_alerts,
        critical_alerts=critical_alerts,
        avg_latency_ms=avg_latency_ms,
    )

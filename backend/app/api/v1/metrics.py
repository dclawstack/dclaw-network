import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.metric import MetricSample, MetricType
from app.repositories.device_repo import DeviceRepository
from app.repositories.metric_repo import MetricRepository
from app.schemas.metric import MetricSampleCreate, MetricSampleRead
from app.core.utils import utc_now

router = APIRouter()


async def _require_device(device_id: uuid.UUID, db: AsyncSession) -> None:
    if not await DeviceRepository(db).get_by_id(device_id):
        raise HTTPException(status_code=404, detail="Device not found")


@router.post("/", response_model=MetricSampleRead, status_code=201)
async def ingest_metric(payload: MetricSampleCreate, db: AsyncSession = Depends(get_db)):
    await _require_device(payload.device_id, db)
    repo = MetricRepository(db)
    sample = MetricSample(
        device_id=payload.device_id,
        interface_id=payload.interface_id,
        metric_type=payload.metric_type,
        value=payload.value,
        sampled_at=payload.sampled_at or utc_now(),
    )
    return await repo.create(sample)


@router.post("/bulk", status_code=204)
async def ingest_metrics_bulk(
    payload: list[MetricSampleCreate], db: AsyncSession = Depends(get_db)
):
    if not payload:
        return
    device_ids = {s.device_id for s in payload}
    for device_id in device_ids:
        await _require_device(device_id, db)
    repo = MetricRepository(db)
    samples = [
        MetricSample(
            device_id=s.device_id,
            interface_id=s.interface_id,
            metric_type=s.metric_type,
            value=s.value,
            sampled_at=s.sampled_at or utc_now(),
        )
        for s in payload
    ]
    await repo.bulk_create(samples)


@router.get("/", response_model=list[MetricSampleRead])
async def query_metrics(
    device_id: uuid.UUID | None = Query(None),
    metric_type: MetricType | None = Query(None),
    since: datetime | None = Query(None),
    until: datetime | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    repo = MetricRepository(db)
    return await repo.query_range(
        device_id=device_id,
        metric_type=metric_type,
        since=since,
        until=until,
        limit=limit,
    )

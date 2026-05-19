import uuid
from datetime import datetime
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.metric import MetricSample, MetricType
from app.repositories.base_repo import BaseRepository
from app.core.utils import utc_now


class MetricRepository(BaseRepository[MetricSample]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, MetricSample)

    async def query_range(
        self,
        device_id: uuid.UUID | None = None,
        metric_type: MetricType | None = None,
        since: datetime | None = None,
        until: datetime | None = None,
        limit: int = 200,
    ) -> list[MetricSample]:
        stmt = select(MetricSample)
        if device_id:
            stmt = stmt.where(MetricSample.device_id == device_id)
        if metric_type:
            stmt = stmt.where(MetricSample.metric_type == metric_type)
        if since:
            stmt = stmt.where(MetricSample.sampled_at >= since)
        if until:
            stmt = stmt.where(MetricSample.sampled_at <= until)
        stmt = stmt.order_by(MetricSample.sampled_at.desc()).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def avg_latency_last_hour(self) -> float | None:
        from datetime import timedelta
        cutoff = utc_now() - timedelta(hours=1)
        result = await self.db.execute(
            select(func.avg(MetricSample.value)).where(
                MetricSample.metric_type == MetricType.latency_ms,
                MetricSample.sampled_at >= cutoff,
            )
        )
        return result.scalar()

    async def bulk_create(self, samples: list[MetricSample]) -> None:
        self.db.add_all(samples)
        await self.db.commit()

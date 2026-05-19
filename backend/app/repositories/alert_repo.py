import uuid
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.alert import Alert, AlertStatus, AlertSeverity
from app.repositories.base_repo import BaseRepository


class AlertRepository(BaseRepository[Alert]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Alert)

    async def list_filtered(
        self,
        status: AlertStatus | None = None,
        severity: AlertSeverity | None = None,
        device_id: uuid.UUID | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Alert]:
        query = select(Alert)
        if device_id:
            query = query.where(Alert.device_id == device_id)
        if status:
            query = query.where(Alert.status == status)
        if severity:
            query = query.where(Alert.severity == severity)
        query = query.order_by(Alert.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def list_open(self) -> list[Alert]:
        return await self.list_filtered(status=AlertStatus.open)

    async def list_by_device(self, device_id: uuid.UUID) -> list[Alert]:
        return await self.list_filtered(device_id=device_id)

    async def count_open(self) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(Alert).where(Alert.status == AlertStatus.open)
        )
        return result.scalar() or 0

    async def count_critical_open(self) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(Alert).where(
                Alert.status == AlertStatus.open,
                Alert.severity == AlertSeverity.critical,
            )
        )
        return result.scalar() or 0

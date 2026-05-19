import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.alert import Alert, AlertStatus, AlertSeverity
from app.repositories.base_repo import BaseRepository


class AlertRepository(BaseRepository[Alert]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Alert)

    async def list_open(self) -> list[Alert]:
        result = await self.db.execute(
            select(Alert)
            .where(Alert.status == AlertStatus.open)
            .order_by(Alert.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_by_device(self, device_id: uuid.UUID) -> list[Alert]:
        result = await self.db.execute(
            select(Alert)
            .where(Alert.device_id == device_id)
            .order_by(Alert.created_at.desc())
        )
        return list(result.scalars().all())

    async def count_open(self) -> int:
        result = await self.db.execute(
            select(Alert).where(Alert.status == AlertStatus.open)
        )
        return len(result.scalars().all())

    async def count_critical_open(self) -> int:
        result = await self.db.execute(
            select(Alert).where(
                Alert.status == AlertStatus.open,
                Alert.severity == AlertSeverity.critical,
            )
        )
        return len(result.scalars().all())

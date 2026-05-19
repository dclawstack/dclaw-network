import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.network_config import NetworkConfig
from app.repositories.base_repo import BaseRepository


class ConfigRepository(BaseRepository[NetworkConfig]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, NetworkConfig)

    async def list_by_device(self, device_id: uuid.UUID) -> list[NetworkConfig]:
        result = await self.db.execute(
            select(NetworkConfig)
            .where(NetworkConfig.device_id == device_id)
            .order_by(NetworkConfig.captured_at.desc())
        )
        return list(result.scalars().all())

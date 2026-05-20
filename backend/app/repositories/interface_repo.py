import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.interface import Interface
from app.repositories.base_repo import BaseRepository


class InterfaceRepository(BaseRepository[Interface]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Interface)

    async def list_by_device(self, device_id: uuid.UUID) -> list[Interface]:
        result = await self.db.execute(
            select(Interface).where(Interface.device_id == device_id)
        )
        return list(result.scalars().all())

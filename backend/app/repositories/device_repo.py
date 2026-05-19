from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.device import Device, DeviceStatus, DeviceType
from app.repositories.base_repo import BaseRepository


class DeviceRepository(BaseRepository[Device]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Device)

    async def filter_by_status(self, status: DeviceStatus) -> list[Device]:
        result = await self.db.execute(select(Device).where(Device.status == status))
        return list(result.scalars().all())

    async def filter_by_type(self, device_type: DeviceType) -> list[Device]:
        result = await self.db.execute(select(Device).where(Device.device_type == device_type))
        return list(result.scalars().all())

    async def search(self, q: str) -> list[Device]:
        pattern = f"%{q}%"
        result = await self.db.execute(
            select(Device).where(
                Device.hostname.ilike(pattern) | Device.ip_address.ilike(pattern)
            )
        )
        return list(result.scalars().all())

    async def count_by_status(self) -> dict[str, int]:
        result = await self.db.execute(
            select(Device.status, func.count()).group_by(Device.status)
        )
        raw = {row[0]: row[1] for row in result.all()}
        return {status.value: raw.get(status, 0) for status in DeviceStatus}

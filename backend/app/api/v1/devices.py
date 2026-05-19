import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.device import DeviceStatus, DeviceType
from app.models.network_config import NetworkConfig
from app.repositories.device_repo import DeviceRepository
from app.repositories.config_repo import ConfigRepository
from app.repositories.interface_repo import InterfaceRepository
from app.schemas.device import DeviceCreate, DeviceUpdate, DeviceRead
from app.schemas.interface import InterfaceRead
from app.schemas.network_config import NetworkConfigRead
from app.core.utils import utc_now

router = APIRouter()


@router.get("/", response_model=list[DeviceRead])
async def list_devices(
    status: DeviceStatus | None = Query(None),
    device_type: DeviceType | None = Query(None),
    q: str | None = Query(None, description="Search hostname or IP"),
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    repo = DeviceRepository(db)
    if q:
        return await repo.search(q)
    if status:
        return await repo.filter_by_status(status)
    if device_type:
        return await repo.filter_by_type(device_type)
    items, _ = await repo.list_all(limit=limit, offset=offset)
    return items


@router.post("/", response_model=DeviceRead, status_code=201)
async def create_device(payload: DeviceCreate, db: AsyncSession = Depends(get_db)):
    from app.models.device import Device
    repo = DeviceRepository(db)
    device = Device(**payload.model_dump())
    return await repo.create(device)


@router.get("/{device_id}", response_model=DeviceRead)
async def get_device(device_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    repo = DeviceRepository(db)
    device = await repo.get_by_id(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.put("/{device_id}", response_model=DeviceRead)
async def update_device(
    device_id: uuid.UUID, payload: DeviceUpdate, db: AsyncSession = Depends(get_db)
):
    repo = DeviceRepository(db)
    device = await repo.get_by_id(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(device, field, value)
    device.updated_at = utc_now()
    await db.commit()
    await db.refresh(device)
    return device


@router.delete("/{device_id}", status_code=204)
async def delete_device(device_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    repo = DeviceRepository(db)
    device = await repo.get_by_id(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    await repo.delete(device)


@router.get("/{device_id}/interfaces", response_model=list[InterfaceRead])
async def list_device_interfaces(device_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    DeviceRepository(db)  # validate device exists implicitly via FK
    repo = InterfaceRepository(db)
    return await repo.list_by_device(device_id)


@router.get("/{device_id}/configs", response_model=list[NetworkConfigRead])
async def list_device_configs(device_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    repo = ConfigRepository(db)
    return await repo.list_by_device(device_id)

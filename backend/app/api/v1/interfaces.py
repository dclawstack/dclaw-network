import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.interface import Interface
from app.repositories.interface_repo import InterfaceRepository
from app.repositories.device_repo import DeviceRepository
from app.schemas.interface import InterfaceCreate, InterfaceUpdate, InterfaceRead
from app.core.utils import utc_now

router = APIRouter()


@router.post("/devices/{device_id}/interfaces", response_model=InterfaceRead, status_code=201)
async def create_interface(
    device_id: uuid.UUID, payload: InterfaceCreate, db: AsyncSession = Depends(get_db)
):
    device_repo = DeviceRepository(db)
    if not await device_repo.get_by_id(device_id):
        raise HTTPException(status_code=404, detail="Device not found")
    iface = Interface(device_id=device_id, **payload.model_dump())
    repo = InterfaceRepository(db)
    return await repo.create(iface)


@router.get("/devices/{device_id}/interfaces/{interface_id}", response_model=InterfaceRead)
async def get_interface(
    device_id: uuid.UUID, interface_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    repo = InterfaceRepository(db)
    iface = await repo.get_by_id(interface_id)
    if not iface or iface.device_id != device_id:
        raise HTTPException(status_code=404, detail="Interface not found")
    return iface


@router.put("/devices/{device_id}/interfaces/{interface_id}", response_model=InterfaceRead)
async def update_interface(
    device_id: uuid.UUID,
    interface_id: uuid.UUID,
    payload: InterfaceUpdate,
    db: AsyncSession = Depends(get_db),
):
    repo = InterfaceRepository(db)
    iface = await repo.get_by_id(interface_id)
    if not iface or iface.device_id != device_id:
        raise HTTPException(status_code=404, detail="Interface not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(iface, field, value)
    iface.updated_at = utc_now()
    await db.commit()
    await db.refresh(iface)
    return iface


@router.delete("/devices/{device_id}/interfaces/{interface_id}", status_code=204)
async def delete_interface(
    device_id: uuid.UUID, interface_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    repo = InterfaceRepository(db)
    iface = await repo.get_by_id(interface_id)
    if not iface or iface.device_id != device_id:
        raise HTTPException(status_code=404, detail="Interface not found")
    await repo.delete(iface)

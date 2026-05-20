import asyncio
import hashlib
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.network_config import NetworkConfig
from app.repositories.config_repo import ConfigRepository
from app.repositories.device_repo import DeviceRepository
from app.schemas.network_config import NetworkConfigCreate, NetworkConfigRead
from app.services.compliance_service import run_compliance_check
from app.core.utils import utc_now

router = APIRouter()


@router.get("", response_model=list[NetworkConfigRead])
async def list_configs(db: AsyncSession = Depends(get_db)):
    repo = ConfigRepository(db)
    items, _ = await repo.list_all(limit=100)
    return items


@router.post("", response_model=NetworkConfigRead, status_code=201)
async def capture_config(payload: NetworkConfigCreate, db: AsyncSession = Depends(get_db)):
    device_repo = DeviceRepository(db)
    if not await device_repo.get_by_id(payload.device_id):
        raise HTTPException(status_code=404, detail="Device not found")
    config_hash = hashlib.sha256(payload.config_text.encode()).hexdigest()
    config = NetworkConfig(
        device_id=payload.device_id,
        config_text=payload.config_text,
        config_hash=config_hash,
        captured_at=utc_now(),
        notes=payload.notes,
    )
    repo = ConfigRepository(db)
    saved = await repo.create(config)
    # Fire-and-forget: compliance check runs async, config returned immediately
    asyncio.create_task(run_compliance_check(saved.id, saved.config_text))
    return saved


@router.get("/{config_id}", response_model=NetworkConfigRead)
async def get_config(config_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    repo = ConfigRepository(db)
    config = await repo.get_by_id(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    return config

import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.interface import InterfaceStatus


class InterfaceCreate(BaseModel):
    name: str
    description: str | None = None
    ip_address: str | None = None
    mac_address: str | None = None
    speed_mbps: int | None = None
    status: InterfaceStatus = InterfaceStatus.unknown


class InterfaceUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    ip_address: str | None = None
    mac_address: str | None = None
    speed_mbps: int | None = None
    status: InterfaceStatus | None = None


class InterfaceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    device_id: uuid.UUID
    name: str
    description: str | None
    ip_address: str | None
    mac_address: str | None
    speed_mbps: int | None
    status: InterfaceStatus
    created_at: datetime
    updated_at: datetime

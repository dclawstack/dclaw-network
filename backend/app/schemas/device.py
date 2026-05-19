import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.device import DeviceType, DeviceStatus


class DeviceCreate(BaseModel):
    hostname: str
    ip_address: str
    device_type: DeviceType = DeviceType.other
    vendor: str | None = None
    model: str | None = None
    location: str | None = None
    status: DeviceStatus = DeviceStatus.unknown


class DeviceUpdate(BaseModel):
    hostname: str | None = None
    ip_address: str | None = None
    device_type: DeviceType | None = None
    vendor: str | None = None
    model: str | None = None
    location: str | None = None
    status: DeviceStatus | None = None
    last_seen: datetime | None = None


class DeviceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    hostname: str
    ip_address: str
    device_type: DeviceType
    vendor: str | None
    model: str | None
    location: str | None
    status: DeviceStatus
    last_seen: datetime | None
    created_at: datetime
    updated_at: datetime

import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.alert import AlertSeverity, AlertStatus


class AlertCreate(BaseModel):
    device_id: uuid.UUID
    severity: AlertSeverity
    title: str
    description: str | None = None


class AlertUpdate(BaseModel):
    severity: AlertSeverity | None = None
    title: str | None = None
    description: str | None = None
    status: AlertStatus | None = None


class AlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    device_id: uuid.UUID
    severity: AlertSeverity
    title: str
    description: str | None
    status: AlertStatus
    acknowledged_at: datetime | None
    resolved_at: datetime | None
    created_at: datetime
    updated_at: datetime

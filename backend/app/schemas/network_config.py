import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NetworkConfigCreate(BaseModel):
    device_id: uuid.UUID
    config_text: str
    notes: str | None = None


class NetworkConfigRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    device_id: uuid.UUID
    config_text: str
    config_hash: str
    captured_at: datetime
    notes: str | None
    compliance_notes: str | None
    created_at: datetime

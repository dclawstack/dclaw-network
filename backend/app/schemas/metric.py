import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.metric import MetricType


class MetricSampleCreate(BaseModel):
    device_id: uuid.UUID
    interface_id: uuid.UUID | None = None
    metric_type: MetricType
    value: float
    sampled_at: datetime | None = None


class MetricSampleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    device_id: uuid.UUID
    interface_id: uuid.UUID | None
    metric_type: MetricType
    value: float
    sampled_at: datetime
    created_at: datetime


class MetricQuery(BaseModel):
    device_id: uuid.UUID | None = None
    metric_type: MetricType | None = None
    since: datetime | None = None
    until: datetime | None = None
    limit: int = 200

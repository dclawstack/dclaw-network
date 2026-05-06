from pydantic import BaseModel
from datetime import datetime
from typing import List

class NetworkReport(BaseModel):
    id: str
    segment: str
    uptime_percent: float
    bandwidth_utilization: float
    latency_ms: float
    optimization_suggestions: list[str]
    created_at: datetime

class ReportCreate(BaseModel):
    segment: str

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_devices: int
    online_count: int
    offline_count: int
    degraded_count: int
    unknown_count: int
    open_alerts: int
    critical_alerts: int
    avg_latency_ms: float | None

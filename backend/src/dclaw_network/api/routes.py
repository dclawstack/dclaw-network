from fastapi import APIRouter
from datetime import datetime
from uuid import uuid4
import random
from dclaw_network.models import NetworkReport, ReportCreate

router = APIRouter()

@router.post("/reports", response_model=NetworkReport)
async def create_item(payload: ReportCreate):
    return NetworkReport(
        id=str(uuid4()),
        segment=payload.segment,
        uptime_percent=round(random.uniform(99.0, 99.99), 2),
        bandwidth_utilization=round(random.uniform(30, 90), 1),
        latency_ms=round(random.uniform(5, 50), 1),
        optimization_suggestions=["Add CDN node"],
        created_at=datetime.utcnow(),
    )

@router.get("/reports/{report_id}/topology")
async def get_item(report_id: str):
    return {"report_id": report_id, "topology": "Star topology with 3 core switches and 12 edge nodes"}

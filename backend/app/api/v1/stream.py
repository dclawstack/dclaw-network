"""
Server-Sent Events stream for real-time alert notifications.
GET /api/v1/stream/alerts
Clients connect with EventSource; new critical alerts are pushed as SSE events.
"""
import asyncio
import logging
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.core.event_bus import get_alert_queue, format_sse

logger = logging.getLogger(__name__)
router = APIRouter()

KEEPALIVE_INTERVAL = 15  # seconds


@router.get("/alerts")
async def stream_alerts():
    """SSE endpoint — streams critical alert events to connected clients."""

    async def generator():
        q = get_alert_queue()
        yield ": connected\n\n"  # initial comment to establish connection
        while True:
            try:
                payload = await asyncio.wait_for(q.get(), timeout=KEEPALIVE_INTERVAL)
                yield format_sse(payload)
            except asyncio.TimeoutError:
                yield ": keepalive\n\n"  # prevent proxy/browser timeout

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

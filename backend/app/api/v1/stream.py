"""
Server-Sent Events stream for real-time alert notifications.
GET /api/v1/stream/alerts
Each connected client gets its own queue via the event_bus broadcaster.
"""
import asyncio
import logging
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.core.event_bus import subscribe, unsubscribe, format_sse

logger = logging.getLogger(__name__)
router = APIRouter()

KEEPALIVE_INTERVAL = 15  # seconds


@router.get("/alerts")
async def stream_alerts():
    """SSE endpoint — each client gets its own queue; all receive every event."""
    q = subscribe()

    async def generator():
        try:
            yield ": connected\n\n"
            while True:
                try:
                    payload = await asyncio.wait_for(q.get(), timeout=KEEPALIVE_INTERVAL)
                    yield format_sse(payload)
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            unsubscribe(q)

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

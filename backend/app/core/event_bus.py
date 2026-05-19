"""
Shared in-process event bus for real-time notifications.
Uses a module-level asyncio.Queue so both the alert engine (background task)
and the SSE stream endpoint can share events without circular imports.
"""
import asyncio
import json
from typing import Any

_alert_queue: asyncio.Queue | None = None


def get_alert_queue() -> asyncio.Queue:
    global _alert_queue
    if _alert_queue is None:
        _alert_queue = asyncio.Queue(maxsize=256)
    return _alert_queue


async def publish_alert(payload: dict[str, Any]) -> None:
    q = get_alert_queue()
    try:
        q.put_nowait(payload)
    except asyncio.QueueFull:
        # Drop oldest, add newest — never block the alert engine
        try:
            q.get_nowait()
        except asyncio.QueueEmpty:
            pass
        q.put_nowait(payload)


def format_sse(data: dict[str, Any]) -> str:
    return f"data: {json.dumps(data)}\n\n"

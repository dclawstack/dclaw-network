"""
Shared in-process event bus for real-time notifications.
Uses a broadcaster pattern: publish_alert fans out to every active SSE client queue.
"""
import asyncio
import json
from typing import Any

# Set of per-client queues; SSE connections register/deregister their own queue
_subscribers: set[asyncio.Queue] = set()


def subscribe() -> asyncio.Queue:
    """Register a new SSE client and return its dedicated queue."""
    q: asyncio.Queue = asyncio.Queue(maxsize=64)
    _subscribers.add(q)
    return q


def unsubscribe(q: asyncio.Queue) -> None:
    """Deregister a client queue when the SSE connection closes."""
    _subscribers.discard(q)


async def publish_alert(payload: dict[str, Any]) -> None:
    """Fan out payload to every connected SSE client. Drops oldest if a client queue is full."""
    for q in list(_subscribers):
        try:
            q.put_nowait(payload)
        except asyncio.QueueFull:
            # Drop oldest event for this slow client, then add newest
            try:
                q.get_nowait()
            except asyncio.QueueEmpty:
                pass
            try:
                q.put_nowait(payload)
            except asyncio.QueueFull:
                pass


def format_sse(data: dict[str, Any]) -> str:
    return f"data: {json.dumps(data)}\n\n"

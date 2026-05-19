"""Tests for the SSE stream endpoint and event bus."""
import asyncio
import pytest

from app.core.event_bus import get_alert_queue, publish_alert, format_sse


@pytest.mark.asyncio
async def test_event_bus_publish_and_receive(setup_db):
    """publish_alert puts a payload on the queue; get_alert_queue retrieves it."""
    q = get_alert_queue()
    # Drain any leftover events from other tests
    while not q.empty():
        q.get_nowait()

    payload = {"type": "alert", "severity": "critical", "title": "Queue test"}
    await publish_alert(payload)
    received = q.get_nowait()
    assert received == payload


@pytest.mark.asyncio
async def test_event_bus_full_queue_drops_oldest(setup_db):
    """When queue is full, oldest event is dropped to make room for newest."""
    from app.core import event_bus
    original = event_bus._alert_queue
    event_bus._alert_queue = asyncio.Queue(maxsize=2)

    try:
        await publish_alert({"id": 1})
        await publish_alert({"id": 2})
        await publish_alert({"id": 3})  # should drop id=1

        q = event_bus._alert_queue
        items = []
        while not q.empty():
            items.append(q.get_nowait())

        assert len(items) == 2
        assert all(item["id"] in (2, 3) for item in items)
    finally:
        event_bus._alert_queue = original


def test_format_sse_encoding():
    """format_sse should produce valid SSE data lines."""
    result = format_sse({"key": "value"})
    assert result.startswith("data: ")
    assert result.endswith("\n\n")
    assert '"key": "value"' in result


@pytest.mark.asyncio
async def test_stream_endpoint_exists(client):
    """GET /api/v1/stream/alerts route is registered (check via openapi schema)."""
    response = await client.get("/openapi.json")
    assert response.status_code == 200
    paths = response.json().get("paths", {})
    assert "/api/v1/stream/alerts" in paths

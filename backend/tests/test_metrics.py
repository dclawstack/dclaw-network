import pytest
import pytest_asyncio


@pytest_asyncio.fixture
async def device_id(client):
    r = await client.post("/api/v1/devices/", json={"hostname": "metric-dev", "ip_address": "10.8.8.1"})
    return r.json()["id"]


@pytest.mark.asyncio
async def test_ingest_metric(client, device_id):
    response = await client.post("/api/v1/metrics/", json={
        "device_id": device_id,
        "metric_type": "latency_ms",
        "value": 42.5,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["metric_type"] == "latency_ms"
    assert data["value"] == 42.5


@pytest.mark.asyncio
async def test_query_metrics_by_device(client, device_id):
    await client.post("/api/v1/metrics/", json={"device_id": device_id, "metric_type": "cpu_pct", "value": 55.0})
    await client.post("/api/v1/metrics/", json={"device_id": device_id, "metric_type": "cpu_pct", "value": 60.0})
    response = await client.get(f"/api/v1/metrics/?device_id={device_id}&metric_type=cpu_pct")
    assert response.status_code == 200
    assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_bulk_ingest(client, device_id):
    payload = [
        {"device_id": device_id, "metric_type": "latency_ms", "value": v}
        for v in [10.0, 20.0, 30.0]
    ]
    response = await client.post("/api/v1/metrics/bulk", json=payload)
    assert response.status_code == 204
    result = await client.get(f"/api/v1/metrics/?device_id={device_id}&metric_type=latency_ms")
    assert len(result.json()) == 3


@pytest.mark.asyncio
async def test_query_metrics_empty(client, device_id):
    response = await client.get(f"/api/v1/metrics/?device_id={device_id}")
    assert response.status_code == 200
    assert response.json() == []

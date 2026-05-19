import pytest


@pytest.mark.asyncio
async def test_dashboard_empty(client):
    response = await client.get("/api/v1/dashboard/")
    assert response.status_code == 200
    data = response.json()
    assert data["total_devices"] == 0
    assert data["open_alerts"] == 0
    assert data["avg_latency_ms"] is None


@pytest.mark.asyncio
async def test_dashboard_with_data(client):
    d1 = (await client.post("/api/v1/devices/", json={"hostname": "d1", "ip_address": "1.1.1.1", "status": "online"})).json()
    d2 = (await client.post("/api/v1/devices/", json={"hostname": "d2", "ip_address": "1.1.1.2", "status": "offline"})).json()

    await client.post("/api/v1/alerts/", json={"device_id": d1["id"], "severity": "critical", "title": "Down"})
    await client.post("/api/v1/alerts/", json={"device_id": d2["id"], "severity": "warning", "title": "Slow"})

    await client.post("/api/v1/metrics/", json={"device_id": d1["id"], "metric_type": "latency_ms", "value": 100.0})
    await client.post("/api/v1/metrics/", json={"device_id": d2["id"], "metric_type": "latency_ms", "value": 200.0})

    response = await client.get("/api/v1/dashboard/")
    assert response.status_code == 200
    data = response.json()
    assert data["total_devices"] == 2
    assert data["online_count"] == 1
    assert data["offline_count"] == 1
    assert data["open_alerts"] == 2
    assert data["critical_alerts"] == 1
    assert data["avg_latency_ms"] == pytest.approx(150.0, rel=1e-2)

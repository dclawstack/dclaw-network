import pytest


@pytest.fixture
async def device_id(client):
    r = await client.post("/api/v1/devices/", json={"hostname": "alert-dev", "ip_address": "10.7.7.1"})
    return r.json()["id"]


@pytest.mark.asyncio
async def test_create_alert(client, device_id):
    response = await client.post("/api/v1/alerts/", json={
        "device_id": device_id,
        "severity": "critical",
        "title": "High latency detected",
        "description": "Latency exceeded 500ms threshold",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["severity"] == "critical"
    assert data["status"] == "open"
    assert data["acknowledged_at"] is None


@pytest.mark.asyncio
async def test_list_alerts(client, device_id):
    await client.post("/api/v1/alerts/", json={"device_id": device_id, "severity": "warning", "title": "Alert A"})
    await client.post("/api/v1/alerts/", json={"device_id": device_id, "severity": "info", "title": "Alert B"})
    response = await client.get("/api/v1/alerts/")
    assert response.status_code == 200
    assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_acknowledge_alert(client, device_id):
    create = await client.post("/api/v1/alerts/", json={
        "device_id": device_id, "severity": "critical", "title": "Packet loss"
    })
    alert_id = create.json()["id"]
    response = await client.put(f"/api/v1/alerts/{alert_id}", json={"status": "acknowledged"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "acknowledged"
    assert data["acknowledged_at"] is not None


@pytest.mark.asyncio
async def test_resolve_alert(client, device_id):
    create = await client.post("/api/v1/alerts/", json={
        "device_id": device_id, "severity": "warning", "title": "CPU spike"
    })
    alert_id = create.json()["id"]
    response = await client.put(f"/api/v1/alerts/{alert_id}", json={"status": "resolved"})
    assert response.status_code == 200
    assert response.json()["status"] == "resolved"
    assert response.json()["resolved_at"] is not None


@pytest.mark.asyncio
async def test_delete_alert(client, device_id):
    create = await client.post("/api/v1/alerts/", json={
        "device_id": device_id, "severity": "info", "title": "Test"
    })
    alert_id = create.json()["id"]
    response = await client.delete(f"/api/v1/alerts/{alert_id}")
    assert response.status_code == 204
    get = await client.get(f"/api/v1/alerts/{alert_id}")
    assert get.status_code == 404


@pytest.mark.asyncio
async def test_filter_alerts_by_device(client, device_id):
    other = await client.post("/api/v1/devices/", json={"hostname": "other-dev", "ip_address": "10.7.7.2"})
    other_id = other.json()["id"]
    await client.post("/api/v1/alerts/", json={"device_id": device_id, "severity": "warning", "title": "Mine"})
    await client.post("/api/v1/alerts/", json={"device_id": other_id, "severity": "info", "title": "Theirs"})
    response = await client.get(f"/api/v1/alerts/?device_id={device_id}")
    assert response.status_code == 200
    assert all(a["device_id"] == device_id for a in response.json())

import pytest


@pytest.mark.asyncio
async def test_create_device(client):
    response = await client.post("/api/v1/devices/", json={
        "hostname": "router-01",
        "ip_address": "192.168.1.1",
        "device_type": "router",
        "vendor": "Cisco",
        "status": "online",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["hostname"] == "router-01"
    assert data["ip_address"] == "192.168.1.1"
    assert data["status"] == "online"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_devices(client):
    await client.post("/api/v1/devices/", json={"hostname": "sw-01", "ip_address": "10.0.0.1"})
    await client.post("/api/v1/devices/", json={"hostname": "sw-02", "ip_address": "10.0.0.2"})
    response = await client.get("/api/v1/devices/")
    assert response.status_code == 200
    assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_get_device(client):
    create = await client.post("/api/v1/devices/", json={"hostname": "fw-01", "ip_address": "10.1.1.1"})
    device_id = create.json()["id"]
    response = await client.get(f"/api/v1/devices/{device_id}")
    assert response.status_code == 200
    assert response.json()["id"] == device_id


@pytest.mark.asyncio
async def test_get_device_not_found(client):
    response = await client.get("/api/v1/devices/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_device(client):
    create = await client.post("/api/v1/devices/", json={"hostname": "ap-01", "ip_address": "172.16.0.1"})
    device_id = create.json()["id"]
    response = await client.put(f"/api/v1/devices/{device_id}", json={"status": "online", "vendor": "Ubiquiti"})
    assert response.status_code == 200
    assert response.json()["status"] == "online"
    assert response.json()["vendor"] == "Ubiquiti"


@pytest.mark.asyncio
async def test_delete_device(client):
    create = await client.post("/api/v1/devices/", json={"hostname": "srv-01", "ip_address": "10.2.0.1"})
    device_id = create.json()["id"]
    response = await client.delete(f"/api/v1/devices/{device_id}")
    assert response.status_code == 204
    get = await client.get(f"/api/v1/devices/{device_id}")
    assert get.status_code == 404


@pytest.mark.asyncio
async def test_search_devices(client):
    await client.post("/api/v1/devices/", json={"hostname": "core-router", "ip_address": "192.168.0.1"})
    await client.post("/api/v1/devices/", json={"hostname": "edge-switch", "ip_address": "192.168.0.2"})
    response = await client.get("/api/v1/devices/?q=core")
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert results[0]["hostname"] == "core-router"


@pytest.mark.asyncio
async def test_filter_devices_by_status(client):
    await client.post("/api/v1/devices/", json={"hostname": "online-dev", "ip_address": "10.0.1.1", "status": "online"})
    await client.post("/api/v1/devices/", json={"hostname": "offline-dev", "ip_address": "10.0.1.2", "status": "offline"})
    response = await client.get("/api/v1/devices/?status=online")
    assert response.status_code == 200
    results = response.json()
    assert all(d["status"] == "online" for d in results)

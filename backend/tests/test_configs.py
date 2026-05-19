import pytest


@pytest.fixture
async def device_id(client):
    r = await client.post("/api/v1/devices/", json={"hostname": "cfg-dev", "ip_address": "10.6.6.1"})
    return r.json()["id"]


@pytest.mark.asyncio
async def test_capture_config(client, device_id):
    response = await client.post("/api/v1/configs/", json={
        "device_id": device_id,
        "config_text": "interface GigabitEthernet0/0\n ip address 10.6.6.1 255.255.255.0",
        "notes": "Initial capture",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["device_id"] == device_id
    assert data["config_hash"] != ""
    assert len(data["config_hash"]) == 64  # SHA-256 hex


@pytest.mark.asyncio
async def test_list_configs_by_device(client, device_id):
    await client.post("/api/v1/configs/", json={"device_id": device_id, "config_text": "config v1"})
    await client.post("/api/v1/configs/", json={"device_id": device_id, "config_text": "config v2"})
    response = await client.get(f"/api/v1/devices/{device_id}/configs")
    assert response.status_code == 200
    assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_get_config(client, device_id):
    create = await client.post("/api/v1/configs/", json={"device_id": device_id, "config_text": "cfg"})
    config_id = create.json()["id"]
    response = await client.get(f"/api/v1/configs/{config_id}")
    assert response.status_code == 200
    assert response.json()["id"] == config_id


@pytest.mark.asyncio
async def test_config_device_not_found(client):
    response = await client.post("/api/v1/configs/", json={
        "device_id": "00000000-0000-0000-0000-000000000000",
        "config_text": "cfg",
    })
    assert response.status_code == 404

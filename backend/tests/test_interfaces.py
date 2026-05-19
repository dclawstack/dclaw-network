import pytest
import pytest_asyncio


@pytest_asyncio.fixture
async def device_id(client):
    r = await client.post("/api/v1/devices/", json={"hostname": "sw-test", "ip_address": "10.9.9.1"})
    return r.json()["id"]


@pytest.mark.asyncio
async def test_create_interface(client, device_id):
    response = await client.post(f"/api/v1/devices/{device_id}/interfaces", json={
        "name": "GigabitEthernet0/0",
        "ip_address": "10.9.9.1",
        "speed_mbps": 1000,
        "status": "up",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "GigabitEthernet0/0"
    assert data["device_id"] == device_id


@pytest.mark.asyncio
async def test_list_device_interfaces(client, device_id):
    await client.post(f"/api/v1/devices/{device_id}/interfaces", json={"name": "eth0", "status": "up"})
    await client.post(f"/api/v1/devices/{device_id}/interfaces", json={"name": "eth1", "status": "down"})
    response = await client.get(f"/api/v1/devices/{device_id}/interfaces")
    assert response.status_code == 200
    assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_update_interface(client, device_id):
    create = await client.post(f"/api/v1/devices/{device_id}/interfaces", json={"name": "eth2", "status": "unknown"})
    iface_id = create.json()["id"]
    response = await client.put(f"/api/v1/devices/{device_id}/interfaces/{iface_id}", json={"status": "up"})
    assert response.status_code == 200
    assert response.json()["status"] == "up"


@pytest.mark.asyncio
async def test_delete_interface(client, device_id):
    create = await client.post(f"/api/v1/devices/{device_id}/interfaces", json={"name": "eth3"})
    iface_id = create.json()["id"]
    response = await client.delete(f"/api/v1/devices/{device_id}/interfaces/{iface_id}")
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_create_interface_device_not_found(client):
    response = await client.post(
        "/api/v1/devices/00000000-0000-0000-0000-000000000000/interfaces",
        json={"name": "eth0"},
    )
    assert response.status_code == 404

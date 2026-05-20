"""Tests for config compliance service integration."""
import pytest
import pytest_asyncio


@pytest_asyncio.fixture
async def device_id(client):
    r = await client.post("/api/v1/devices/", json={"hostname": "comp-dev", "ip_address": "10.50.0.1"})
    return r.json()["id"]


@pytest.mark.asyncio
async def test_capture_config_returns_immediately(client, device_id):
    """POST /configs/ should return 201 immediately even if LLM is unavailable."""
    response = await client.post("/api/v1/configs/", json={
        "device_id": device_id,
        "config_text": "interface GigabitEthernet0\n ip address 10.50.0.1 255.255.255.0",
        "notes": "compliance test",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["device_id"] == device_id
    # compliance_notes may be null initially (LLM runs async)
    assert "compliance_notes" in data


@pytest.mark.asyncio
async def test_capture_config_with_telnet(client, device_id):
    """Config with telnet should still save successfully."""
    response = await client.post("/api/v1/configs/", json={
        "device_id": device_id,
        "config_text": "line vty 0 4\n transport input telnet\n password cisco",
    })
    assert response.status_code == 201
    assert response.json()["config_hash"] != ""

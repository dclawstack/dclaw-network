"""
Seed / clear demo data.
POST  /api/v1/seed  — populate with realistic sample data
DELETE /api/v1/seed — wipe all devices (cascades to metrics/alerts/configs/interfaces)
"""
import hashlib
import random
from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.utils import utc_now
from app.models.alert import Alert, AlertSeverity, AlertStatus
from app.models.device import Device, DeviceStatus, DeviceType
from app.models.interface import Interface, InterfaceStatus
from app.models.metric import MetricSample, MetricType
from app.models.network_config import NetworkConfig

router = APIRouter()

# ── Seed payload ─────────────────────────────────────────────────────────────

_DEVICES = [
    dict(hostname="core-rtr-01", ip_address="10.0.0.1", device_type=DeviceType.router,
         vendor="Cisco", model="ASR 1001-X", location="DC-1 Main", status=DeviceStatus.online),
    dict(hostname="core-sw-01", ip_address="10.0.0.2", device_type=DeviceType.switch,
         vendor="Arista", model="7280CR3", location="DC-1 Core", status=DeviceStatus.online),
    dict(hostname="edge-fw-01", ip_address="203.0.113.1", device_type=DeviceType.firewall,
         vendor="Palo Alto", model="PA-5250", location="DC-1 Edge", status=DeviceStatus.online),
    dict(hostname="dist-sw-03", ip_address="10.10.1.3", device_type=DeviceType.switch,
         vendor="Cisco", model="Catalyst 9300", location="Floor-3", status=DeviceStatus.degraded),
    dict(hostname="app-srv-07", ip_address="10.20.7.7", device_type=DeviceType.server,
         vendor="Dell", model="PowerEdge R750", location="DC-2 Rack-7", status=DeviceStatus.online),
    dict(hostname="wifi-ap-12", ip_address="10.30.0.12", device_type=DeviceType.ap,
         vendor="Ubiquiti", model="UniFi U6 Pro", location="Office-Floor2", status=DeviceStatus.offline),
    dict(hostname="edge-rtr-03", ip_address="203.0.113.50", device_type=DeviceType.router,
         vendor="Juniper", model="MX204", location="DC-2 Edge", status=DeviceStatus.degraded),
]

_INTERFACES = {
    "core-rtr-01": [
        dict(name="GigabitEthernet0/0/0", ip_address="10.0.0.1", mac_address="00:1A:2B:3C:4D:01",
             speed_mbps=1000, status=InterfaceStatus.up, description="LAN uplink"),
        dict(name="GigabitEthernet0/0/1", ip_address="172.16.0.1", mac_address="00:1A:2B:3C:4D:02",
             speed_mbps=1000, status=InterfaceStatus.up, description="WAN link"),
        dict(name="GigabitEthernet0/0/2", ip_address=None, mac_address="00:1A:2B:3C:4D:03",
             speed_mbps=1000, status=InterfaceStatus.down, description="Backup link"),
    ],
    "core-sw-01": [
        dict(name="Ethernet1/1", ip_address="10.0.0.10", mac_address="00:1A:2B:3C:5D:01",
             speed_mbps=10000, status=InterfaceStatus.up, description="Uplink to core-rtr-01"),
        dict(name="Ethernet1/2", ip_address="10.0.1.1", mac_address="00:1A:2B:3C:5D:02",
             speed_mbps=10000, status=InterfaceStatus.up, description="Distribution layer"),
    ],
    "edge-fw-01": [
        dict(name="ethernet1/1", ip_address="203.0.113.1", mac_address="00:1A:2B:3C:6D:01",
             speed_mbps=10000, status=InterfaceStatus.up, description="Untrust zone"),
        dict(name="ethernet1/2", ip_address="10.0.0.254", mac_address="00:1A:2B:3C:6D:02",
             speed_mbps=10000, status=InterfaceStatus.up, description="Trust zone"),
    ],
    "dist-sw-03": [
        dict(name="GigabitEthernet1/0/1", ip_address="10.10.1.3", mac_address="00:1A:2B:3C:7D:01",
             speed_mbps=1000, status=InterfaceStatus.up, description="Uplink"),
        dict(name="GigabitEthernet1/0/24", ip_address=None, mac_address="00:1A:2B:3C:7D:02",
             speed_mbps=1000, status=InterfaceStatus.down, description="Access port (flapping)"),
    ],
    "app-srv-07": [
        dict(name="ens3", ip_address="10.20.7.7", mac_address="00:1A:2B:3C:8D:01",
             speed_mbps=10000, status=InterfaceStatus.up, description="Primary NIC"),
        dict(name="ens4", ip_address="10.20.7.8", mac_address="00:1A:2B:3C:8D:02",
             speed_mbps=10000, status=InterfaceStatus.up, description="Storage NIC"),
    ],
    "edge-rtr-03": [
        dict(name="ge-0/0/0", ip_address="203.0.113.50", mac_address="00:1A:2B:3C:9D:01",
             speed_mbps=1000, status=InterfaceStatus.up, description="Internet uplink"),
        dict(name="ge-0/0/1", ip_address="10.0.2.1", mac_address="00:1A:2B:3C:9D:02",
             speed_mbps=1000, status=InterfaceStatus.up, description="LAN"),
    ],
}

_METRICS = {
    # (base_value, stddev) per metric per device — realistic ranges
    "core-rtr-01":  {MetricType.latency_ms: (4.2, 0.8),   MetricType.packet_loss_pct: (0.01, 0.01), MetricType.cpu_pct: (22.0, 4.0),  MetricType.memory_pct: (41.0, 3.0),  MetricType.throughput_mbps: (380.0, 30.0)},
    "core-sw-01":   {MetricType.latency_ms: (1.8, 0.3),   MetricType.packet_loss_pct: (0.0,  0.0),  MetricType.cpu_pct: (15.0, 3.0),  MetricType.memory_pct: (33.0, 2.0),  MetricType.throughput_mbps: (720.0, 60.0)},
    "edge-fw-01":   {MetricType.latency_ms: (6.1, 1.2),   MetricType.packet_loss_pct: (0.05, 0.02), MetricType.cpu_pct: (48.0, 8.0),  MetricType.memory_pct: (67.0, 4.0),  MetricType.throughput_mbps: (510.0, 50.0)},
    "dist-sw-03":   {MetricType.latency_ms: (24.5, 12.0), MetricType.packet_loss_pct: (1.8,  1.2),  MetricType.cpu_pct: (71.0, 9.0),  MetricType.memory_pct: (82.0, 5.0),  MetricType.throughput_mbps: (190.0, 40.0)},
    "app-srv-07":   {MetricType.latency_ms: (2.1, 0.4),   MetricType.packet_loss_pct: (0.0,  0.0),  MetricType.cpu_pct: (88.0, 6.0),  MetricType.memory_pct: (74.0, 3.0),  MetricType.throughput_mbps: (850.0, 70.0)},
    "edge-rtr-03":  {MetricType.latency_ms: (187.0, 90.0),MetricType.packet_loss_pct: (5.4,  3.5),  MetricType.cpu_pct: (61.0, 12.0), MetricType.memory_pct: (55.0, 6.0),  MetricType.throughput_mbps: (95.0, 25.0)},
}

_CONFIGS = {
    "core-rtr-01": (
        "hostname core-rtr-01\n"
        "!\n"
        "interface GigabitEthernet0/0/0\n"
        " ip address 10.0.0.1 255.255.255.0\n"
        " no shutdown\n"
        "!\n"
        "interface GigabitEthernet0/0/1\n"
        " ip address 172.16.0.1 255.255.255.252\n"
        " no shutdown\n"
        "!\n"
        "ip route 0.0.0.0 0.0.0.0 172.16.0.2\n"
        "!\n"
        "logging host 10.0.0.100\n"
        "service password-encryption\n"
    ),
    "edge-fw-01": (
        "set deviceconfig system hostname edge-fw-01\n"
        "set network interface ethernet ethernet1/1 layer3 ip 203.0.113.1/30\n"
        "set network interface ethernet ethernet1/2 layer3 ip 10.0.0.254/24\n"
        "set zone untrust network layer3 ethernet1/1\n"
        "set zone trust network layer3 ethernet1/2\n"
        "set rulebase security rules allow-outbound from trust to untrust\n"
        "set rulebase security rules allow-outbound action allow\n"
        "set deviceconfig system ntp-servers primary 10.0.0.1\n"
        "set deviceconfig system syslog 10.0.0.100\n"
    ),
}

# ── Route handlers ────────────────────────────────────────────────────────────

@router.post("", status_code=201)
async def seed_data(db: AsyncSession = Depends(get_db)):
    """Create realistic sample devices, interfaces, metrics, alerts, and configs."""
    now = utc_now()
    rng = random.Random(42)

    # ── Devices ──────────────────────────────────────────────────────────────
    devices: dict[str, Device] = {}
    for d in _DEVICES:
        device = Device(
            **d,
            last_seen=now if d["status"] != DeviceStatus.offline else None,
        )
        db.add(device)
        await db.flush()
        devices[d["hostname"]] = device

    # ── Interfaces ───────────────────────────────────────────────────────────
    for hostname, ifaces in _INTERFACES.items():
        dev = devices[hostname]
        for iface in ifaces:
            db.add(Interface(device_id=dev.id, **iface))

    await db.flush()

    # ── Metrics (30 samples per metric per device, 5-min intervals) ──────────
    for hostname, metric_config in _METRICS.items():
        dev = devices[hostname]
        for metric_type, (base, std) in metric_config.items():
            for i in range(30):
                sampled_at = now - timedelta(minutes=5 * (30 - i))
                value = max(0.0, base + rng.gauss(0, std))
                db.add(MetricSample(
                    device_id=dev.id,
                    metric_type=metric_type,
                    value=round(value, 2),
                    sampled_at=sampled_at,
                ))

    await db.flush()

    # ── Alerts ───────────────────────────────────────────────────────────────
    alert_defs = [
        dict(device="edge-rtr-03", severity=AlertSeverity.critical, status=AlertStatus.open,
             title="Anomaly detected: latency_ms spiked to 847.3 ms",
             description="Z-score 4.8σ above 7-day baseline. EWMA trend predicts continued rise."),
        dict(device="dist-sw-03", severity=AlertSeverity.warning, status=AlertStatus.open,
             title="Predicted degradation: packet_loss_pct in ~18 min",
             description="EWMA trend on packet_loss_pct is on track to double within 18 minutes."),
        dict(device="app-srv-07", severity=AlertSeverity.warning, status=AlertStatus.acknowledged,
             title="CPU threshold exceeded: 89.4%",
             description="cpu_pct has been above 85% for 3 consecutive samples."),
        dict(device="wifi-ap-12", severity=AlertSeverity.critical, status=AlertStatus.open,
             title="Device offline: wifi-ap-12 unreachable",
             description="No response to health checks for 10 minutes. Last seen 10.30.0.12."),
        dict(device="core-rtr-01", severity=AlertSeverity.info, status=AlertStatus.resolved,
             title="Config change detected on core-rtr-01",
             description="Config hash changed. New snapshot captured and logged."),
        dict(device="edge-fw-01", severity=AlertSeverity.warning, status=AlertStatus.open,
             title="Memory usage elevated: 67.2%",
             description="memory_pct trending upward over last 2 hours."),
        dict(device="dist-sw-03", severity=AlertSeverity.critical, status=AlertStatus.open,
             title="Interface GigabitEthernet1/0/24 flapping",
             description="Link state changed 8 times in the last 15 minutes."),
    ]
    for i, a in enumerate(alert_defs):
        dev = devices[a["device"]]
        alert = Alert(
            device_id=dev.id,
            severity=a["severity"],
            title=a["title"],
            description=a["description"],
            status=a["status"],
            acknowledged_at=now - timedelta(hours=1) if a["status"] in (AlertStatus.acknowledged, AlertStatus.resolved) else None,
            resolved_at=now - timedelta(minutes=30) if a["status"] == AlertStatus.resolved else None,
        )
        db.add(alert)

    await db.flush()

    # ── Configs ───────────────────────────────────────────────────────────────
    for hostname, config_text in _CONFIGS.items():
        dev = devices[hostname]
        config_hash = hashlib.sha256(config_text.encode()).hexdigest()
        db.add(NetworkConfig(
            device_id=dev.id,
            config_text=config_text,
            config_hash=config_hash,
            captured_at=now - timedelta(hours=2),
            notes="Auto-captured during seed",
            compliance_notes=None,
        ))
        # Second (older) snapshot for core-rtr-01 to enable diff view
        if hostname == "core-rtr-01":
            old_text = config_text.replace("service password-encryption\n", "")
            old_hash = hashlib.sha256(old_text.encode()).hexdigest()
            db.add(NetworkConfig(
                device_id=dev.id,
                config_text=old_text,
                config_hash=old_hash,
                captured_at=now - timedelta(hours=24),
                notes="Previous snapshot",
                compliance_notes="Missing: service password-encryption",
            ))

    await db.commit()

    device_count = len(_DEVICES)
    iface_count = sum(len(v) for v in _INTERFACES.values())
    metric_count = sum(len(v) * 30 for v in _METRICS.values())
    return {
        "seeded": True,
        "devices": device_count,
        "interfaces": iface_count,
        "metric_samples": metric_count,
        "alerts": len(alert_defs),
        "configs": sum(2 if h == "core-rtr-01" else 1 for h in _CONFIGS),
    }


@router.delete("", status_code=200)
async def clear_data(db: AsyncSession = Depends(get_db)):
    """Delete all devices (cascades to all child records)."""
    await db.execute(delete(Device))
    await db.commit()
    return {"cleared": True}

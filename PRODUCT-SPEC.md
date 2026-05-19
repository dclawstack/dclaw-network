# PRODUCT-SPEC: DClaw Network

## Overview

**App Name:** DClaw Network
**Domain:** Network Monitoring & IT Operations
**Target User:** IT operations teams, network engineers, NOC staff

## Core Entities

### Device
```
Device
├── id: UUID (PK)
├── hostname: str (required, unique)
├── ip_address: str (required)
├── device_type: enum ["router", "switch", "firewall", "server", "ap", "other"] (required)
├── vendor: str (optional)
├── model: str (optional)
├── location: str (optional)
├── status: enum ["online", "offline", "degraded", "unknown"] (default: "unknown")
├── last_seen: datetime (optional)
├── created_at: datetime
└── updated_at: datetime
```

### Interface
```
Interface
├── id: UUID (PK)
├── device_id: UUID (FK → Device, ondelete=CASCADE)
├── name: str (required)
├── description: str (optional)
├── ip_address: str (optional)
├── mac_address: str (optional)
├── speed_mbps: int (optional)
├── status: enum ["up", "down", "unknown"] (default: "unknown")
├── created_at: datetime
└── updated_at: datetime
```

### MetricSample
```
MetricSample
├── id: UUID (PK)
├── device_id: UUID (FK → Device, ondelete=CASCADE)
├── interface_id: UUID (FK → Interface, ondelete=SET NULL, optional)
├── metric_type: enum ["latency_ms", "packet_loss_pct", "throughput_mbps", "cpu_pct", "memory_pct"] (required)
├── value: float (required)
├── sampled_at: datetime (required)
└── created_at: datetime
```

### Alert
```
Alert
├── id: UUID (PK)
├── device_id: UUID (FK → Device, ondelete=CASCADE)
├── severity: enum ["critical", "warning", "info"] (required)
├── title: str (required)
├── description: str (optional)
├── status: enum ["open", "acknowledged", "resolved"] (default: "open")
├── acknowledged_at: datetime (optional)
├── resolved_at: datetime (optional)
├── created_at: datetime
└── updated_at: datetime
```

### NetworkConfig
```
NetworkConfig
├── id: UUID (PK)
├── device_id: UUID (FK → Device, ondelete=CASCADE)
├── config_text: str (required)
├── config_hash: str (required)
├── captured_at: datetime (required)
├── notes: str (optional)
└── created_at: datetime
```

## User Stories / Screens

### Screen 1: Dashboard
- Summary cards: total devices, online/offline/degraded counts, open alerts, avg latency
- Active alerts feed (critical first)
- Device status distribution chart
- Recent metric trends

### Screen 2: Devices
- Table view with pagination, search by hostname/IP/location
- Status filter (online/offline/degraded/unknown)
- Type filter (router/switch/firewall/server/ap)
- "Add Device" modal/form

### Screen 3: Device Detail
- Device info card with edit/delete
- Interface list with status indicators
- Recent metrics charts (latency, packet loss, throughput)
- Active alerts for device
- Config history timeline

### Screen 4: Alerts
- Table view sorted by severity and created_at
- Filter by severity (critical/warning/info) and status (open/acknowledged/resolved)
- Acknowledge / resolve actions
- Alert detail with root-cause notes

### Screen 5: Performance
- Multi-device metric comparison charts
- Time range selector (1h, 6h, 24h, 7d)
- Top N worst performers by metric type
- Baseline deviation indicators (AI-driven)

### Screen 6: Configuration
- Per-device config history list
- Diff view between two config snapshots
- Compliance status badge (AI-checked)
- Capture new config button

## AI Features

- **Anomaly detection:** Time-series analysis to detect abnormal latency or packet loss patterns
- **Outage prediction:** Predict likely outages 30 min ahead based on degrading metric trends
- **Root-cause analysis:** LLM-powered explanation of alert clusters
- **Config compliance:** AI comparison of device configs against policy templates

## API Endpoints (v1.0)

```
GET    /api/v1/devices                        → List devices
POST   /api/v1/devices                        → Create device
GET    /api/v1/devices/{id}                   → Get device
PUT    /api/v1/devices/{id}                   → Update device
DELETE /api/v1/devices/{id}                   → Delete device
GET    /api/v1/devices/{id}/interfaces        → List interfaces for device
POST   /api/v1/devices/{id}/interfaces        → Create interface
GET    /api/v1/metrics                        → List metric samples (query by device/type/range)
POST   /api/v1/metrics                        → Ingest metric sample
GET    /api/v1/alerts                         → List alerts
POST   /api/v1/alerts                         → Create alert
GET    /api/v1/alerts/{id}                    → Get alert
PUT    /api/v1/alerts/{id}                    → Update alert (acknowledge/resolve)
DELETE /api/v1/alerts/{id}                    → Delete alert
GET    /api/v1/configs                        → List configs (query by device)
POST   /api/v1/configs                        → Capture config snapshot
GET    /api/v1/configs/{id}                   → Get config
GET    /api/v1/dashboard                      → Dashboard summary stats
GET    /health                                → Health check
```

## Non-Functional Requirements

- Backend tests: 70%+ coverage
- Frontend: Responsive, Tailwind + pre-built shadcn-compatible UI components
- Docker: All services start with `docker compose up -d`
- No mock data — everything persisted to PostgreSQL
- Health endpoint at `/health` returning `{"status": "ok"}`

# DClaw Network — v1.2 Feature Roadmap

> 📘 **REVISED PRD v2.3 available:** See `REVISED-PRD.md` for complete gap analysis and full feature descriptions.
> **For coding agents:** Pick features by complexity tier, implement fully, and tick the checkbox.
> **Do NOT change the basic stack.** See `AGENTS.md` for architecture lock.

---

## Pre-Flight Checklist — Do This First

- [ ] `frontend/package-lock.json` is committed after any `npm install` / dependency change
- [ ] `frontend/next-env.d.ts` exists and is committed (required for Next.js TypeScript builds)
- [ ] `frontend/.gitignore` excludes `node_modules/` and `.next/`
- [ ] `docker-compose.yml` healthchecks use `python urllib.request.urlopen()` (backend) and `wget -q --spider` (frontend)
- [ ] `frontend/Dockerfile` declares `ARG NEXT_PUBLIC_API_URL` before `RUN npm run build`
- [x] `alembic revision --autogenerate` run after every model change
- [x] `pytest -v` passes before every commit

---

## Complexity 0 — Foundation (Quick Wins)

These are non-negotiable. Nothing else ships until all of these are done.

### 0.1 Domain Models
**Files:** `backend/app/models/device.py`, `interface.py`, `metric.py`, `alert.py`, `network_config.py`
Rules: `Base` from `app.models.base`, `Mapped[]`, `mapped_column()`, `default=uuid.uuid4`,
`utc_now` from `app.core.utils`, `lazy="selectin"`, `ondelete="CASCADE"` on all child FKs.
- [x] `Device` — hostname, ip_address, device_type enum, vendor, model, location, status enum, last_seen
- [x] `Interface` — FK→Device CASCADE, name, ip_address, mac_address, speed_mbps, status enum
- [x] `MetricSample` — FK→Device CASCADE, FK→Interface SET NULL (optional), metric_type enum, value, sampled_at
- [x] `Alert` — FK→Device CASCADE, severity enum, title, description, status enum, acknowledged_at, resolved_at
- [x] `NetworkConfig` — FK→Device CASCADE, config_text, config_hash, captured_at, notes, compliance_notes

### 0.2 Alembic Initial Migration
**File:** `backend/alembic/versions/001_initial_schema.py`
- [x] Migration creates all 5 tables with enums and indexes
- [x] Migration verified (`alembic upgrade head` runs clean)

### 0.3 Pydantic v2 Schemas
**Files:** `backend/app/schemas/device.py`, `interface.py`, `metric.py`, `alert.py`, `network_config.py`, `dashboard.py`
All use `model_config = ConfigDict(from_attributes=True)`.
- [x] `DeviceCreate`, `DeviceUpdate`, `DeviceRead`
- [x] `InterfaceCreate`, `InterfaceUpdate`, `InterfaceRead`
- [x] `MetricSampleCreate`, `MetricSampleRead`, `MetricQuery` (device_id, metric_type, since, until)
- [x] `AlertCreate`, `AlertUpdate`, `AlertRead`
- [x] `NetworkConfigCreate`, `NetworkConfigRead`
- [x] `DashboardStats` (total_devices, online_count, offline_count, degraded_count, open_alerts, critical_alerts, avg_latency_ms)

### 0.4 Repository Classes
**Files:** `backend/app/repositories/device_repo.py`, `interface_repo.py`, `metric_repo.py`, `alert_repo.py`, `config_repo.py`
All extend `BaseRepository` from `base_repo.py`.
- [x] `DeviceRepository` — `filter_by_status()`, `filter_by_type()`, `search(q)` (hostname/IP ILIKE)
- [x] `InterfaceRepository` — `list_by_device(device_id)`
- [x] `MetricRepository` — `query_range(device_id, type, since, until)`, `latest_per_device(device_ids, type)`, `avg_latency_last_hour()`
- [x] `AlertRepository` — `list_open()`, `list_by_device(device_id)`, `count_by_status()`
- [x] `ConfigRepository` — `list_by_device(device_id)` ordered by captured_at desc

### 0.5 API v1 Routers
**Files:** `backend/app/api/v1/devices.py`, `interfaces.py`, `metrics.py`, `alerts.py`, `configs.py`, `dashboard.py`
- [x] `GET/POST /api/v1/devices`, `GET/PUT/DELETE /api/v1/devices/{id}`
- [x] `GET/POST /api/v1/devices/{device_id}/interfaces`, `GET/PUT/DELETE /api/v1/devices/{device_id}/interfaces/{id}`
- [x] `POST /api/v1/metrics` (ingest), `GET /api/v1/metrics` (query by device/type/range)
- [x] `GET/POST /api/v1/alerts`, `GET/PUT/DELETE /api/v1/alerts/{id}` (PUT handles acknowledge/resolve)
- [x] `GET/POST /api/v1/configs`, `GET /api/v1/devices/{device_id}/configs`
- [x] `GET /api/v1/dashboard` → `DashboardStats`

### 0.6 Wire Routers in main.py
**File:** `backend/app/api/main.py`
- [x] All v1 routers included with correct prefixes

### 0.7 Backend Tests
**Files:** `backend/tests/test_devices.py`, `test_interfaces.py`, `test_metrics.py`, `test_alerts.py`, `test_configs.py`, `test_dashboard.py`
Pattern: `@pytest.mark.asyncio`, `AsyncClient` + `ASGITransport`, `conftest.py` client fixture.
- [x] Device CRUD lifecycle + search/filter tests (8 tests)
- [x] Interface CRUD under device (5 tests)
- [x] Metric ingest + range query + bulk ingest (4 tests)
- [x] Alert CRUD + acknowledge/resolve transitions (6 tests)
- [x] Config capture + list by device (4 tests)
- [x] Dashboard stats correctness (2 tests)
- [x] **30/30 tests passing** ✅

### 0.8 DPanel Manifest
**File:** `frontend/public/dclaw-manifest.json`
- [x] `{ "app_id": "network", "name": "DClaw Network", "backend_port": 8044, "frontend_port": 3044, "db": "dclaw_network", "version": "0.1.0" }`

### 0.9 Frontend API Client
**File:** `frontend/src/lib/api.ts`
- [x] TypeScript interfaces for all entities
- [x] Typed fetch functions for every endpoint

### 0.10 Dashboard Page
**File:** `frontend/src/app/page.tsx`
- [x] Real stats from `GET /api/v1/dashboard` (device counts, open alerts, avg latency)
- [x] Recent critical alerts feed
- [x] Uses pre-built Card, Badge, Table components

### 0.11 Devices List Page
**File:** `frontend/src/app/devices/page.tsx`
- [x] Table with search (hostname/IP) and filter chips (status, type)
- [x] "Add Device" Dialog form
- [x] Delete with confirmation

### 0.12 Alerts Page
**File:** `frontend/src/app/alerts/page.tsx`
- [x] Table sorted by severity + created_at
- [x] Acknowledge / Resolve action buttons
- [x] Filter by severity and status

---

## Complexity 1 — Core Differentiators

### 1.1 Threshold Alert Engine
**File:** `backend/app/services/alert_engine.py`
- [x] Background task polling MetricSamples every 60s
- [x] Auto-creates Alerts: latency_ms>200→warning, >500→critical; packet_loss>2%→warning, >10%→critical; cpu_pct>80%→warning, >95%→critical; memory_pct>85%→warning, >95%→critical
- [x] Deduplicates: skips if open alert for same device+metric already exists

### 1.2 Bulk Metric Ingest
**File:** `backend/app/api/v1/metrics.py`
- [x] `POST /api/v1/metrics/bulk` — list of MetricSampleCreate, inserted via `session.add_all()`

### 1.3 Server-Sent Events (Real-time Alerts)
**File:** `backend/app/api/v1/stream.py`
- [ ] `GET /api/v1/stream/alerts` — SSE stream, fires on new critical alerts
- [ ] Frontend `EventSource` subscriber in AppLayout

### 1.4 Device Detail Page
**File:** `frontend/src/app/devices/[id]/page.tsx`
- [x] Device info card (edit/delete)
- [x] Interfaces table
- [x] Last-1h metric sparklines (latency, packet loss, CPU)
- [x] Active alerts list with acknowledge/resolve
- [x] Config history timeline

### 1.5 Performance Page
**File:** `frontend/src/app/performance/page.tsx`
- [x] Multi-device metric comparison
- [x] Time-range selector: 1h / 6h / 24h / 7d
- [x] Top-N worst performers table

### 1.6 Configuration Page
**File:** `frontend/src/app/configs/page.tsx`
- [x] Config history per device
- [x] Text diff viewer between two snapshots

### 1.7 Navigation Layout
**File:** `frontend/src/components/AppLayout.tsx`
- [x] Sidebar: Dashboard, Devices, Alerts, Performance, Configurations (in root `layout.tsx`)
- [x] Wraps all pages via root `layout.tsx`
- [ ] Active route highlighting (current: static links only)

### 1.8 Slack / Webhook Integration
**File:** `backend/app/services/webhook_service.py`
- [x] POST to `SLACK_WEBHOOK_URL` env var on critical alert creation
- [x] `SLACK_WEBHOOK_URL` in `config.py`

---

## Complexity 2 — AI & Advanced Features

> **YC S25/W26 Mandate:** Every DClaw app MUST have a working AI Copilot.

### 2.1 AI Network Copilot
**Files:** `backend/app/api/v1/copilot.py`, `frontend/src/components/CopilotWidget.tsx`
- [x] `POST /api/v1/copilot/chat` — context-aware LLM chat (Ollama primary, OpenRouter fallback)
- [x] Builds context from last 1h metrics + active alerts for referenced device
- [x] Streaming response (text/event-stream)
- [x] Floating chat widget on every page (bottom-right, Dialog)
- [x] **Demo query**: "Which devices had packet loss > 5% last hour?"

### 2.2 Statistical Anomaly Detection
**File:** `backend/app/services/anomaly_service.py`
- [ ] Rolling 7-day baseline (mean + stddev) per device per metric
- [ ] Z-score > 3.0 triggers anomaly alert
- [ ] Runs as background task (every 5 min)

### 2.3 LLM Root-Cause Analysis
**File:** `backend/app/services/rca_service.py`
- [x] On alert creation: send last 30min metrics + alert history to LLM
- [x] "Explain root cause in 2-3 sentences. Suggest one remediation step."
- [x] Stores result in `Alert.description`
- [x] **YC "wow" moment**: alert description auto-populated in plain English

### 2.4 Outage Prediction
**File:** `backend/app/services/prediction_service.py`
- [ ] EWMA trend on latency_ms + packet_loss_pct over last 2h per device
- [ ] If latency trend doubles in 30min → create predictive Alert (warning)
- [ ] Title: "Predicted degradation in ~30 min"
- [ ] **Demo narrative**: "AI detected degradation 28 min before outage"

### 2.5 Config Compliance AI
**File:** `backend/app/services/compliance_service.py`
- [ ] On config capture: send config_text to LLM
- [ ] Checks: open telnet, weak/default creds, missing logging, unused ACLs
- [ ] Stores result in `NetworkConfig.compliance_notes`

### 2.6 Topology Graph
**File:** `frontend/src/app/topology/page.tsx`
- [ ] Device nodes colored by status (online=green, degraded=yellow, offline=red)
- [ ] Edges from Interface→shared subnet inference
- [ ] Uses `@xyflow/react` (React Flow)

---

## Implementation Priority Order

1. ✅ 0.1 → 0.2 → 0.3 → 0.4 → 0.5 → 0.6 (backend stack, in dependency order)
2. ✅ 0.7 (tests — verify backend before frontend)
3. ✅ 0.8 + 0.9 + 0.10 + 0.11 + 0.12 (manifest + frontend basics)
4. ✅ 1.7 → 1.4 → 1.5 → 1.6 → 1.1 → 1.2 → 1.8 (layout first, then rich pages, then services)
5. ✅ 2.3 → 2.1 (RCA first since it enhances alerts, then Copilot)
6. ⬜ 1.3 → 2.2 → 2.4 → 2.5 → 2.6 (SSE stream, anomaly detection, outage prediction, compliance AI, topology)

---

## Status Summary (as of v1.2)

| Tier | Items | Done | Pending |
|------|-------|------|---------|
| Complexity 0 | 12 | **12** ✅ | 0 |
| Complexity 1 | 8 | **6** | 2 (SSE stream, active route highlighting) |
| Complexity 2 | 6 | **2** | 4 (anomaly, prediction, compliance, topology) |
| **Total** | **26** | **20** | **6** |

# DClaw Network

> **Network monitoring, topology mapping, and AI-driven anomaly detection for enterprise IT teams.**

DClaw Network is a vertical SaaS application built on the DClaw Stack. It provides AI-powered network monitoring, configuration management, performance analytics, and topology visualization for IT operations teams.

## Tech Stack

- **Backend:** FastAPI + SQLAlchemy 2.0 + asyncpg (Port `8044`)
- **Frontend:** Next.js 14 + Tailwind CSS + pre-built UI components (Port `3044`)
- **Database:** PostgreSQL (`dclaw_network`)
- **Infra:** Docker + Helm + Alembic migrations + GitHub Actions CI

## Quick Start

```bash
cp .env.example .env
docker compose up -d
```

Backend: http://localhost:8044  
Frontend: http://localhost:3044  
API docs: http://localhost:8044/docs

## Implemented Features

### v1 — Shipped ✅

| Feature | Files |
|---------|-------|
| Domain models (Device, Interface, MetricSample, Alert, NetworkConfig) | `backend/app/models/` |
| Alembic migration (`001_initial_schema.py`) | `backend/alembic/versions/` |
| Full CRUD API: devices, interfaces, metrics, alerts, configs | `backend/app/api/v1/` |
| Dashboard stats endpoint (`GET /api/v1/dashboard`) | `backend/app/api/v1/dashboard.py` |
| Bulk metric ingest (`POST /api/v1/metrics/bulk`) | `backend/app/api/v1/metrics.py` |
| Threshold alert engine (background task, auto-creates alerts) | `backend/app/services/alert_engine.py` |
| LLM root-cause analysis on alert creation | `backend/app/services/rca_service.py` |
| Slack/webhook integration on critical alerts | `backend/app/services/webhook_service.py` |
| AI Network Copilot (Ollama streaming + OpenRouter fallback) | `backend/app/api/v1/copilot.py` |
| Dashboard, Devices, Alerts, Performance, Configs pages | `frontend/src/app/` |
| Device detail page with sparklines, interfaces, alerts | `frontend/src/app/devices/[id]/` |
| Floating AI chat widget | `frontend/src/components/CopilotWidget.tsx` |
| 30 backend tests (all passing) | `backend/tests/` |

### Planned — Next Sprint

- SSE real-time alert stream (`GET /api/v1/stream/alerts`)
- Statistical anomaly detection (Z-score baseline)
- Outage prediction (EWMA trend analysis)
- Config compliance AI review
- Topology graph (React Flow)

## Documentation

| Doc | Purpose |
|-----|---------|
| `AGENTS.md` | Architecture guide and development workflow (read first) |
| `REVISED-PRD.md` | Product roadmap and feature specifications |
| `PLAN-v1.2.md` | Current feature backlog |
| `PRODUCT-SPEC.md` | Domain models and API contracts |
| `docs/` | Getting started, guides, reference |

## Critical Rules for Agents

### DO NOT install shadcn CLI
Pre-built UI components are in `frontend/src/components/ui/`. Installing `shadcn` v4 or `@base-ui/react` will break the Tailwind v3 build.

### DO NOT change the Postgres test port
`backend/tests/conftest.py` uses `127.0.0.1:5432`. GitHub Actions CI maps the Postgres service to port 5432. The host is `127.0.0.1` (not `localhost`) to avoid IPv6 resolution issues. Changing the port breaks CI.

### DO NOT delete `.github/workflows/ci.yml`
Required for GitHub Actions to run tests on every push.

### DO NOT upgrade pytest-asyncio
Keep `pytest-asyncio==0.24.0` pinned in `requirements.txt`. v1.3.0 breaks fixture scoping.

## Port Registry

| App | Backend Port | Frontend Port | Database |
|-----|-------------|---------------|----------|
| dclaw-chat | 8090 | 3000 | dclaw_chat |
| dclaw-med | 8092 | 3004 | dclaw_med |
| dclaw-learn | 8093 | 3003 | dclaw_learn |
| dclaw-code | 8094 | 3005 | dclaw_code |
| dclaw-legal | 8099 | 3013 | dclaw_legal |
| **dclaw-network** | **8044** | **3044** | **dclaw_network** |
| dclaw-crm | 8095 | 3006 | dclaw_crm |
| dclaw-finance | 8096 | 3007 | dclaw_finance |
| dclaw-hr | 8097 | 3008 | dclaw_hr |
| dclaw-inventory | 8098 | 3009 | dclaw_inventory |
| dclaw-project | 8100 | 3010 | dclaw_project |
| dclaw-support | 8101 | 3014 | dclaw_support |
| dclaw-marketing | 8102 | 3015 | dclaw_marketing |
| dclaw-real-estate | 8103 | 3016 | dclaw_real_estate |
| dclaw-sales | 8104 | 3017 | dclaw_sales |
| dclaw-recruit | 8105 | 3018 | dclaw_recruit |
| dclaw-vendor | 8106 | 3019 | dclaw_vendor |
| dclaw-doc | 8107 | 3020 | dclaw_doc |
| dclaw-calendar | 8108 | 3021 | dclaw_calendar |

> **Rule:** New apps take the next available port. Update this table when assigning.

## What You Should NOT Change

- `app/models/base.py` — `DeclarativeBase` pattern
- `app/core/database.py` — Engine/session factory
- `docker-compose.yml` healthcheck commands
- `frontend/Dockerfile` `ARG NEXT_PUBLIC_API_URL` pattern
- `tests/conftest.py` — Test DB override pattern (keep `localhost:5432`)
- `frontend/src/components/ui/*.tsx` — Pre-built UI components (use as-is)
- `requirements.txt` — Keep `pytest-asyncio==0.24.0` pinned
- `.github/workflows/ci.yml` — Do not delete

## Contributors

| Name | Email |
|------|-------|
| Rajendra Machani | 01.r.machani@gmail.com |

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.api.routes import health
from app.api.v1 import devices, interfaces, metrics, alerts, configs, dashboard, copilot
from app.services.alert_engine import run_alert_engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    engine_task = asyncio.create_task(run_alert_engine())
    yield
    engine_task.cancel()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3044", "http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router,      prefix="/health",           tags=["health"])
app.include_router(devices.router,     prefix="/api/v1/devices",   tags=["devices"])
app.include_router(interfaces.router,  prefix="/api/v1",           tags=["interfaces"])
app.include_router(metrics.router,     prefix="/api/v1/metrics",   tags=["metrics"])
app.include_router(alerts.router,      prefix="/api/v1/alerts",    tags=["alerts"])
app.include_router(configs.router,     prefix="/api/v1/configs",   tags=["configs"])
app.include_router(dashboard.router,   prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(copilot.router,     prefix="/api/v1/copilot",   tags=["copilot"])

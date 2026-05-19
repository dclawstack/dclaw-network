from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.api.routes import health
from app.api.v1 import devices, interfaces, metrics, alerts, configs, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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

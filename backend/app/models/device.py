import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean
from app.models.base import Base
from app.core.utils import utc_now

if TYPE_CHECKING:
    from app.models.interface import Interface
    from app.models.alert import Alert
    from app.models.metric import MetricSample
    from app.models.network_config import NetworkConfig


class DeviceType(str, Enum):
    router = "router"
    switch = "switch"
    firewall = "firewall"
    server = "server"
    ap = "ap"
    other = "other"


class DeviceStatus(str, Enum):
    online = "online"
    offline = "offline"
    degraded = "degraded"
    unknown = "unknown"


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    hostname: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)
    device_type: Mapped[DeviceType] = mapped_column(default=DeviceType.other)
    vendor: Mapped[str | None] = mapped_column(String(128), nullable=True)
    model: Mapped[str | None] = mapped_column(String(128), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[DeviceStatus] = mapped_column(default=DeviceStatus.unknown)
    last_seen: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(default=utc_now, onupdate=utc_now)

    interfaces: Mapped[list["Interface"]] = relationship(
        back_populates="device", lazy="selectin", cascade="all, delete-orphan"
    )
    alerts: Mapped[list["Alert"]] = relationship(
        back_populates="device", lazy="selectin", cascade="all, delete-orphan"
    )
    metrics: Mapped[list["MetricSample"]] = relationship(
        back_populates="device", lazy="selectin", cascade="all, delete-orphan"
    )
    configs: Mapped[list["NetworkConfig"]] = relationship(
        back_populates="device", lazy="selectin", cascade="all, delete-orphan"
    )

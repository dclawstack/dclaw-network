import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey
from app.models.base import Base
from app.core.utils import utc_now

if TYPE_CHECKING:
    from app.models.device import Device
    from app.models.metric import MetricSample


class InterfaceStatus(str, Enum):
    up = "up"
    down = "down"
    unknown = "unknown"


class Interface(Base):
    __tablename__ = "interfaces"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    device_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("devices.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    mac_address: Mapped[str | None] = mapped_column(String(17), nullable=True)
    speed_mbps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[InterfaceStatus] = mapped_column(default=InterfaceStatus.unknown)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(default=utc_now, onupdate=utc_now)

    device: Mapped["Device"] = relationship(back_populates="interfaces", lazy="selectin")
    metrics: Mapped[list["MetricSample"]] = relationship(
        back_populates="interface", lazy="selectin", passive_deletes=True
    )

import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Float, ForeignKey
from app.models.base import Base
from app.core.utils import utc_now

if TYPE_CHECKING:
    from app.models.device import Device
    from app.models.interface import Interface


class MetricType(str, Enum):
    latency_ms = "latency_ms"
    packet_loss_pct = "packet_loss_pct"
    throughput_mbps = "throughput_mbps"
    cpu_pct = "cpu_pct"
    memory_pct = "memory_pct"


class MetricSample(Base):
    __tablename__ = "metric_samples"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    device_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("devices.id", ondelete="CASCADE"), nullable=False
    )
    interface_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("interfaces.id", ondelete="SET NULL"), nullable=True
    )
    metric_type: Mapped[MetricType] = mapped_column(nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    sampled_at: Mapped[datetime] = mapped_column(nullable=False, default=utc_now)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)

    device: Mapped["Device"] = relationship(back_populates="metrics", lazy="selectin")
    interface: Mapped["Interface | None"] = relationship(
        back_populates="metrics", lazy="selectin"
    )

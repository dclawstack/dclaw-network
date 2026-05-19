import uuid
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, ForeignKey
from app.models.base import Base
from app.core.utils import utc_now

if TYPE_CHECKING:
    from app.models.device import Device


class NetworkConfig(Base):
    __tablename__ = "network_configs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    device_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("devices.id", ondelete="CASCADE"), nullable=False
    )
    config_text: Mapped[str] = mapped_column(Text, nullable=False)
    config_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    captured_at: Mapped[datetime] = mapped_column(nullable=False, default=utc_now)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    compliance_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)

    device: Mapped["Device"] = relationship(back_populates="configs", lazy="selectin")

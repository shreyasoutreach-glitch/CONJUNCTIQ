from datetime import datetime, timezone
from sqlalchemy import DateTime, Float, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base


class ConjunctionEvent(Base):
    __tablename__ = "conjunction_events"
    event_id: Mapped[str] = mapped_column(String, primary_key=True)
    primary_object_id: Mapped[str] = mapped_column(String, nullable=False)
    secondary_object_id: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class EventUpdate(Base):
    __tablename__ = "event_updates"
    __table_args__ = (UniqueConstraint("event_id", "update_number", name="uq_event_update"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    update_number: Mapped[int] = mapped_column(Integer, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    time_of_closest_approach: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    miss_distance_km: Mapped[float | None] = mapped_column(Float)
    collision_probability: Mapped[float | None] = mapped_column(Float)
    relative_velocity_km_s: Mapped[float | None] = mapped_column(Float)
    radial_uncertainty_km: Mapped[float | None] = mapped_column(Float)
    along_track_uncertainty_km: Mapped[float | None] = mapped_column(Float)
    cross_track_uncertainty_km: Mapped[float | None] = mapped_column(Float)
    data_source: Mapped[str | None] = mapped_column(String)
    object_metadata: Mapped[dict] = mapped_column(JSON, default=dict)


class SimulationRun(Base):
    __tablename__ = "simulation_runs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[str] = mapped_column(String, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    inputs: Mapped[dict] = mapped_column(JSON)
    result: Mapped[dict] = mapped_column(JSON)


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String, unique=True)
    content: Mapped[str] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String, default="ConjunctIQ trusted prototype corpus")

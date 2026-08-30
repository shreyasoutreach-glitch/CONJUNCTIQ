from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field

class UpdateInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    event_id: str = Field(min_length=1); primary_object_id: str = Field(min_length=1); secondary_object_id: str = Field(min_length=1)
    timestamp: datetime; time_of_closest_approach: datetime; update_number: int = Field(ge=0)
    miss_distance_km: float | None = Field(default=None, ge=0); collision_probability: float | None = Field(default=None, ge=0, le=1)
    relative_velocity_km_s: float | None = Field(default=None, ge=0); radial_uncertainty_km: float | None = Field(default=None, ge=0)
    along_track_uncertainty_km: float | None = Field(default=None, ge=0); cross_track_uncertainty_km: float | None = Field(default=None, ge=0)
    data_source: str | None = None; object_metadata: dict[str, Any] = Field(default_factory=dict)

class IngestRequest(BaseModel): updates: list[UpdateInput] = Field(min_length=1)
class EvidenceItem(BaseModel):
    factor: str; value: float | str | None; unit: str | None = None; baseline: float | str | None = None
    comparison: str; importance: Literal["low", "medium", "high"]; explanation: str
class Assessment(BaseModel):
    score: int = Field(ge=0, le=100); classification: Literal["LOW", "MONITOR", "HIGH ATTENTION", "CRITICAL ATTENTION"]
    disclaimer: str; factors: list[dict[str, Any]]
class SimulationRequest(BaseModel):
    radial_uncertainty_km: float | None = Field(default=None, ge=0); along_track_uncertainty_km: float | None = Field(default=None, ge=0); cross_track_uncertainty_km: float | None = Field(default=None, ge=0)
class BriefingRequest(BaseModel): audience: Literal["operator", "analyst", "public"] = "operator"
class ChatRequest(BaseModel): question: str = Field(min_length=1, max_length=2000)

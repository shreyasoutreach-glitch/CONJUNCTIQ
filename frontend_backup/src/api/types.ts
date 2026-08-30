// API response types — mirrors the backend Pydantic schemas

export interface Factor {
  factor: string;
  points: number;
  explanation: string;
  observed_value?: number | string | null;
  threshold?: string | null;
  importance: string;
}

export interface Assessment {
  score: number;
  classification: string;
  disclaimer: string;
  factors: Factor[];
}

export interface EventListItem {
  event: {
    event_id: string;
    primary_object_id: string;
    secondary_object_id: string;
    latest_update: number;
    tca: string;
    miss_distance_km: number | null;
    collision_probability: number | null;
    update_count: number;
    data_source: string | null;
  };
  assessment: Assessment;
}

export interface EvidenceItem {
  factor: string;
  observed_value: string;
  threshold: string;
  importance: string;
  explanation: string;
  points: number;
}

export interface ChangeItem {
  field: string;
  previous: number | string | null;
  current: number | string | null;
  direction: string;
  significance: string;
}

export interface ChangeAnalysis {
  status: string;
  changes: ChangeItem[];
}

export interface NextObservation {
  priority: string;
  information_gap: string;
  suggestion: string;
  decision_value: string;
  disclaimer: string;
}

export interface SimulationResult {
  simulation: boolean;
  before: Assessment;
  after: Assessment;
  changed_factors: string[];
  disclaimer: string;
}

export interface BriefingResult {
  status: string;
  provider?: string;
  audience?: string;
  content?: string;
  observed_facts: string;
  calculated_assessment: string;
  interpretation: string;
  uncertainty: string;
  grounding: string[];
  question?: string;
  answer?: string;
  ai_error?: string;
}

export interface ChatResult {
  status: string;
  question: string;
  answer: string;
  observed_facts: string;
  calculated_assessment: string;
  interpretation: string;
  uncertainty: string;
  grounding: string[];
}

export interface SystemStatus {
  system: string;
  service: string;
  version: string;
  demo_mode: boolean;
  llm_provider: string;
  total_events: number;
  critical_events: number;
  database: string;
}

export interface Summary {
  total_events: number;
  critical_events: number;
  high_attention_events: number;
  escalating_events: number;
  monitor_events: number;
  low_events: number;
}

export interface KnowledgeDoc {
  id: number;
  title: string;
  content: string;
  source: string;
}

export interface NasaApproach {
  des: string;
  name: string;
  date: string;
  dist: number | null;
  dist_min: number | null;
  dist_max: number | null;
  v_rel: number | null;
  h: number | null;
  diameter: number | null;
  source: string;
}

export interface NasaResponse {
  status: string;
  source: string;
  approaches: NasaApproach[];
  count: number;
}

export interface EventDetail {
  event: {
    event_id: string;
    primary_object_id: string;
    secondary_object_id: string;
    created_at: string;
  };
  latest_update: {
    update_number: number;
    timestamp: string;
    time_of_closest_approach: string;
    miss_distance_km: number | null;
    collision_probability: number | null;
    relative_velocity_km_s: number | null;
    radial_uncertainty_km: number | null;
    along_track_uncertainty_km: number | null;
    cross_track_uncertainty_km: number | null;
    data_source: string | null;
    object_metadata: Record<string, unknown>;
  };
  assessment: Assessment;
  update_history: Array<{
    update_number: number;
    timestamp: string;
    time_of_closest_approach: string;
    miss_distance_km: number | null;
    collision_probability: number | null;
    relative_velocity_km_s: number | null;
    radial_uncertainty_km: number | null;
    along_track_uncertainty_km: number | null;
    cross_track_uncertainty_km: number | null;
  }>;
}

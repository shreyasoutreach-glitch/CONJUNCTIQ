// API response types — mirrors the actual backend Pydantic schemas

export interface Factor {
  factor: string;
  points: number;
  explanation: string;
  observed?: number | string | null;
  reference?: number | string | null;
  direction?: string;
  // Legacy fields (kept for safety)
  observed_value?: number | string | null;
  threshold?: string | null;
  importance?: string;
}

export interface Assessment {
  score: number;
  classification: string;
  disclaimer: string;
  factors: Factor[];
}

// The backend /api/events item shape:
// { event: UpdateInput, assessment: Assessment }
// UpdateInput has time_of_closest_approach (not tca), plus full orbital fields
export interface EventListItem {
  event: {
    event_id: string;
    primary_object_id: string;
    secondary_object_id: string;
    timestamp: string;
    time_of_closest_approach: string;
    update_number: number;
    miss_distance_km: number | null;
    collision_probability: number | null;
    relative_velocity_km_s: number | null;
    radial_uncertainty_km: number | null;
    along_track_uncertainty_km: number | null;
    cross_track_uncertainty_km: number | null;
    data_source: string | null;
    object_metadata: Record<string, unknown>;
    // Legacy alias kept for any old code referencing it
    tca?: string;
    latest_update?: number;
    update_count?: number;
  };
  assessment: Assessment;
}

// Backend /api/events/{id}/evidence returns array of:
// { factor, observed, reference, direction, points, explanation }
export interface EvidenceItem {
  factor: string;
  observed: number | string | null;
  reference: number | string | null;
  direction?: string;
  points: number;
  explanation: string;
  // Legacy fields
  observed_value?: string;
  threshold?: string;
  importance?: string;
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
  message?: string;
}

export interface NextObservation {
  priority: string;
  information_gap: string;
  suggestion: string;
  decision_value: string;
  disclaimer: string;
  why_it_matters?: string;
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

// Chat: backend wraps the inner result in an outer envelope
// { question, answer: string|ChatInner, context_sources, ai_provider }
export interface ChatResult {
  status?: string;
  question: string;
  answer: string | ChatResultInner;
  observed_facts?: string;
  calculated_assessment?: string;
  interpretation?: string;
  uncertainty?: string;
  grounding?: string[];
  context_sources?: Array<{ title: string; content: string }>;
  ai_provider?: string;
}

export interface ChatResultInner {
  status: string;
  question: string;
  answer: string;
  observed_facts: string;
  calculated_assessment: string;
  interpretation: string;
  uncertainty: string;
  grounding: string[];
}

// Backend /api/status response shape
export interface SystemStatus {
  service: string;
  port?: number;
  ai_provider: {
    name: string;
    class: string;
    model: string | null;
  };
  nasa_cneos?: {
    enabled: boolean;
    status: string;
    source?: string;
    approaches_available?: boolean;
  };
  data_mode?: string;
  disclaimer?: string;
  // Legacy fields the frontend used to expect (mapped from above)
  system?: string;
  version?: string;
  demo_mode?: boolean;
  llm_provider?: string;
  total_events?: number;
  critical_events?: number;
  database?: string;
}

export interface Summary {
  total_events: number;
  critical_events: number;
  high_attention_events: number;
  escalating_events: number;
  monitor_events: number;
  low_attention_events?: number;
  low_events?: number;
  ai_provider?: string;
  nasa_cneos_enabled?: boolean;
}

export interface KnowledgeDoc {
  id: number;
  title: string;
  content: string;
  source: string;
}

export interface NasaApproach {
  event_id?: string;
  designation?: string;
  des?: string;
  name?: string;
  date?: string;
  tca?: string;
  tca_raw?: string;
  miss_distance_km?: number | null;
  dist?: number | null;
  dist_min?: number | null;
  dist_max?: number | null;
  v_rel?: number | null;
  relative_velocity_km_s?: number | null;
  h?: number | null;
  h_magnitude?: string | null;
  diameter?: number | null;
  source?: string;
  data_source?: string;
  provenance?: string;
  uncertainty_flag?: string;
}

// Backend /api/nasa/approaches shape:
// { provenance, source, url, disclaimer, count, data: [...] }
export interface NasaResponse {
  status?: string;
  provenance?: string;
  source: string;
  url?: string;
  disclaimer?: string;
  // data is the array field from the backend
  data?: NasaApproach[];
  // approaches is the legacy field name the frontend expected
  approaches?: NasaApproach[];
  count: number;
}

// Backend /api/events/{id} returns a flat UpdateInput (not the nested EventDetail)
// We keep EventDetail as the type name but it's actually flat UpdateInput now
export interface EventDetail {
  // Flat UpdateInput fields (what backend actually returns)
  event_id?: string;
  primary_object_id?: string;
  secondary_object_id?: string;
  timestamp?: string;
  time_of_closest_approach?: string;
  update_number?: number;
  miss_distance_km?: number | null;
  collision_probability?: number | null;
  relative_velocity_km_s?: number | null;
  radial_uncertainty_km?: number | null;
  along_track_uncertainty_km?: number | null;
  cross_track_uncertainty_km?: number | null;
  data_source?: string | null;
  object_metadata?: Record<string, unknown>;
  // Legacy nested shape (kept for compat, will be undefined with current backend)
  event?: { event_id: string; primary_object_id: string; secondary_object_id: string; created_at?: string };
  latest_update?: {
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
  assessment?: Assessment;
  update_history?: unknown[];
}

export interface ToolInfo {
  name: string;
  description: string;
  status: string;
}

export interface ToolCall {
  tool: string;
  status: string;
  input?: Record<string, any>;
  result_summary?: string;
  message?: string;
}

export interface ResearchSource {
  name: string;
  url?: string;
}

export interface ResearchChatResult {
  answer: string;
  tool_calls: ToolCall[];
  sources: ResearchSource[];
  agent_status: string;
}

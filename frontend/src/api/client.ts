/// <reference types="vite/client" />
import type {
  EventListItem,
  Assessment,
  EvidenceItem,
  ChangeAnalysis,
  NextObservation,
  SimulationResult,
  BriefingResult,
  ChatResult,
  SystemStatus,
  Summary,
  KnowledgeDoc,
  NasaResponse,
  EventDetail,
  ToolInfo,
} from "./types";

const BASE = import.meta.env.VITE_API_URL || "/api";

// Extremely robust deterministic demo fallback data for Hackathon Vercel deployment
const DEMO_FALLBACKS: Record<string, any> = {
  "/status": {
    service: "ConjunctIQ",
    ai_provider: { name: "Mock LLM Engine (Fallback)", class: "Mock", model: "deterministic-mock" },
    nasa_cneos: { enabled: false, status: "Offline - Demo Mode", approaches_available: false },
    data_mode: "Synthetic Hackathon Data",
    disclaimer: "Vercel Deployment: API unavailable. Running in client-side deterministic demo mode."
  } as SystemStatus,
  "/summary": {
    total_events: 5,
    critical_events: 1,
    high_attention_events: 1,
    escalating_events: 2,
    monitor_events: 1,
    ai_provider: "Mock Fallback"
  } as Summary,
  "/events": [
    {
      event: { event_id: "DEMO-001", primary_object_id: "ISS (ZARYA)", secondary_object_id: "COSMOS 2251 DEB", timestamp: new Date().toISOString(), time_of_closest_approach: new Date(Date.now() + 86400000).toISOString(), update_number: 3, miss_distance_km: 1.2, collision_probability: 0.0004, relative_velocity_km_s: 14.5, radial_uncertainty_km: 0.5, along_track_uncertainty_km: 2.1, cross_track_uncertainty_km: 0.8, data_source: "Synthetic", object_metadata: {} },
      assessment: { score: 85, classification: "HIGH", disclaimer: "Demo", factors: [] }
    },
    {
      event: { event_id: "DEMO-003", primary_object_id: "STARLINK-1023", secondary_object_id: "UNKNOWN DEBRIS", timestamp: new Date().toISOString(), time_of_closest_approach: new Date(Date.now() + 43200000).toISOString(), update_number: 5, miss_distance_km: 0.3, collision_probability: 0.0021, relative_velocity_km_s: 11.2, radial_uncertainty_km: 0.1, along_track_uncertainty_km: 0.9, cross_track_uncertainty_km: 0.2, data_source: "Synthetic", object_metadata: {} },
      assessment: { score: 95, classification: "CRITICAL", disclaimer: "Demo", factors: [] }
    }
  ] as EventListItem[],
  "/research/tools": {
    tools: [
      { name: "NASA_ADS_Literature", description: "Search astrophysics literature.", status: "DEMO" },
      { name: "JPL_Horizons_Ephemeris", description: "Query solar system object positions.", status: "DEMO" },
      { name: "SIMBAD_Astronomical", description: "Query astronomical object data.", status: "DEMO" },
      { name: "Orbital_Uncertainty_Simulator", description: "Run monte-carlo conjunction simulations.", status: "DEMO" }
    ]
  },
  "/nasa/approaches": {
    status: "DEMO",
    source: "Synthetic Mock",
    count: 0,
    data: []
  } as NasaResponse
};

// Generates dynamic fallbacks for parameterized routes
function getDynamicFallback(url: string, options?: RequestInit): any {
  if (url.includes("/assessment")) {
    return {
      score: url.includes("DEMO-003") ? 95 : 60,
      classification: url.includes("DEMO-003") ? "CRITICAL" : "MODERATE",
      disclaimer: "Running in Vercel client-side demo mode. Synthetic analysis.",
      factors: [
        { factor: "Miss Distance", points: 40, explanation: "Critically close approach predicted.", observed: 0.3 },
        { factor: "Collision Probability", points: 55, explanation: "Probability exceeds action threshold.", observed: 0.0021 }
      ]
    } as Assessment;
  }
  if (url.includes("/evidence")) {
    return [
      { factor: "Radial Uncertainty", observed: 0.1, reference: 1.0, direction: "Decreasing", points: 20, explanation: "Covariance is shrinking, increasing confidence in high collision probability." }
    ] as EvidenceItem[];
  }
  if (url.includes("/changes")) {
    return {
      status: "Calculated",
      changes: [
        { field: "Miss Distance", previous: 0.8, current: 0.3, direction: "Decreasing", significance: "High" },
        { field: "Collision Probability", previous: 0.0001, current: 0.0021, direction: "Increasing", significance: "Critical" }
      ]
    } as ChangeAnalysis;
  }
  if (url.includes("/simulate")) {
    return {
      simulation: true,
      before: { score: 95, classification: "CRITICAL", disclaimer: "", factors: [] },
      after: { score: 45, classification: "MODERATE", disclaimer: "", factors: [] },
      changed_factors: ["Reduced along-track uncertainty"],
      disclaimer: "Synthetic simulation."
    } as SimulationResult;
  }
  if (url.includes("/chat") || url.includes("/research/chat")) {
    let bodyStr = "";
    try { bodyStr = options?.body ? options.body.toString().toLowerCase() : ""; } catch(e) {}
    
    let answer = "This is a deterministic demo response because the live API is unreachable from this Vercel deployment. ";
    if (bodyStr.includes("critical")) {
      answer += "This event is critical due to a combination of high collision probability and escalating uncertainty trends.";
    } else if (bodyStr.includes("changed")) {
      answer += "Over the last 3 updates, the miss distance has decreased from 0.8km to 0.3km, while the collision probability spiked to 1 in 476.";
    } else if (bodyStr.includes("downtime") || bodyStr.includes("economically")) {
      answer += "30 days of downtime could result in millions of dollars in lost revenue, SLA penalties, and permanent loss of customer trust based on standard broadband replacement cost metrics.";
    } else if (bodyStr.includes("jpl horizons")) {
      answer += "JPL Horizons provides highly accurate ephemerides for solar system objects, which is critical for verifying primary asset telemetry against known orbital trajectories.";
    }
    
    return {
      question: "User Prompt",
      answer: answer,
      ai_provider: "Client-Side Mock Engine"
    } as ChatResult;
  }
  if (url.includes("/next-observation")) {
    return { priority: "Immediate", information_gap: "None", suggestion: "Execute CAM", decision_value: "High", disclaimer: "Demo" } as NextObservation;
  }
  // Default event detail
  return {
    event_id: url.split("/")[2] || "DEMO-00X",
    primary_object_id: "SYNTHETIC ASSET",
    secondary_object_id: "UNKNOWN DEBRIS",
    timestamp: new Date().toISOString(),
    time_of_closest_approach: new Date(Date.now() + 43200000).toISOString(),
    update_number: 1,
    data_source: "Synthetic"
  } as EventDetail;
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(`${BASE}${url}`, {
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      ...options,
    });
  } catch (err) {
    // Network error (e.g. CORS or fully unreachable backend)
    return (DEMO_FALLBACKS[url] || getDynamicFallback(url, options)) as T;
  }

  const contentType = resp.headers.get("content-type");
  
  // Vercel SPA routing fallback protection
  // If the backend is missing, Vercel returns status 200 but serves text/html (index.html)
  if (!contentType || !contentType.includes("application/json")) {
    console.warn(`[ConjunctIQ API Fallback] Route ${url} returned non-JSON (${contentType}). Activating deterministic demo mode.`);
    return (DEMO_FALLBACKS[url] || getDynamicFallback(url, options)) as T;
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`${resp.status}: ${text || resp.statusText}`);
  }

  return resp.json() as Promise<T>;
}

export const api = {
  getStatus: () => fetchJSON<SystemStatus>("/status"),
  getSummary: () => fetchJSON<Summary>("/summary"),
  getEvents: () => fetchJSON<EventListItem[]>("/events"),
  getEventDetail: (id: string) => fetchJSON<EventDetail>(`/events/${id}`),
  getAssessment: (id: string) => fetchJSON<Assessment>(`/events/${id}/assessment`),
  getEvidence: (id: string) => fetchJSON<EvidenceItem[]>(`/events/${id}/evidence`),
  getChanges: (id: string) => fetchJSON<ChangeAnalysis>(`/events/${id}/changes`),
  getNextObservation: (id: string) => fetchJSON<NextObservation>(`/events/${id}/next-observation`),
  simulate: (id: string, overrides: Record<string, number>) =>
    fetchJSON<SimulationResult>(`/events/${id}/simulate`, {
      method: "POST",
      body: JSON.stringify(overrides),
    }),
  getBriefing: (id: string, audience: string) =>
    fetchJSON<BriefingResult>(`/events/${id}/briefing`, {
      method: "POST",
      body: JSON.stringify({ audience }),
    }),
  chat: (id: string, question: string) =>
    fetchJSON<ChatResult>(`/events/${id}/chat`, {
      method: "POST",
      body: JSON.stringify({ question }),
    }),
  getKnowledge: () => fetchJSON<KnowledgeDoc[]>("/knowledge"),
  getNasaApproaches: () => fetchJSON<NasaResponse>("/nasa/approaches"),
  getResearchTools: () => fetchJSON<any>("/research/tools"),
  sendResearchChat: (messages: {role: string, content: string}[]) => fetchJSON<any>("/research/chat", { method: "POST", body: JSON.stringify({ messages }) }),
};

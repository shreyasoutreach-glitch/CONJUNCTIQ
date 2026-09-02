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

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(`${BASE}${url}`, {
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      ...options,
    });
  } catch (err) {
    // Network error (e.g. CORS or fully unreachable backend)
    console.error(`[API Error] Network failure fetching ${url}:`, err);
    throw new Error(`Service Unavailable: Could not reach the backend API at ${BASE}`);
  }

  const contentType = resp.headers.get("content-type");
  
  // Strict check: if the backend isn't returning JSON, it's an error state (e.g. Vercel fallback)
  if (!contentType || !contentType.includes("application/json")) {
    console.error(`[API Error] Route ${url} returned non-JSON (${contentType}). The backend is likely unavailable.`);
    throw new Error(`Service Unavailable: Backend API is offline or incorrectly configured.`);
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

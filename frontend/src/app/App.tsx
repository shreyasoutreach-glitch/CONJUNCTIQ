import { useState } from "react";
import { useConjunctIQ } from "../hooks/useConjunctIQ";
import StatusStrip from "../workstation/StatusStrip";
import CommandCenter from "../workstation/CommandCenter";
import EventDashboard from "../workstation/EventDashboard";
import ResearchDashboard from "../ai/ResearchDashboard";
import SpaceEconomicsDashboard from "../workstation/SpaceEconomicsDashboard";
import PersistentAIPanel from "../workstation/PersistentAIPanel";
import ErrorBoundary from "./ErrorBoundary";

export type ViewState = "command" | "event" | "research" | "economics";

export default function App() {
  const {
    status,
    summary,
    events,
    selectedEventId,
    eventDetail,
    assessment,
    evidence,
    changes,
    nextObs,
    loading,
    error,
    selectEvent,
  } = useConjunctIQ();

  const [view, setView] = useState<ViewState>("command");

  const selectedEvent = events.find(e => e.event.event_id === selectedEventId) ?? events[0] ?? null;
  const actualSelectedEvent = events.find(e => e.event.event_id === selectedEventId) ?? null;

  const handleSelectEvent = (id: string) => {
    selectEvent(id);
    setView("event");
  };

  const handleBackToCommand = () => {
    setView("command");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "var(--bg-app)" }}>
        <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Initializing ConjunctIQ...</div>
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "var(--bg-app)" }}>
        <div style={{ color: "var(--critical)", fontSize: "14px" }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="cockpit-environment">
      <StatusStrip status={status} summary={summary} view={view} setView={setView} />
      
      <div className="cockpit-workspace">
        
        {/* CENTER WORKSTATION (Left + Center logical areas) */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", minHeight: 0 }}><ErrorBoundary fallbackName="Main Workstation">
          {view === "economics" ? (<SpaceEconomicsDashboard />) : view === "research" ? (
            <ResearchDashboard />
          ) : view === "command" ? (
            <CommandCenter 
              events={events} 
              defaultEvent={selectedEvent} 
              onSelectEvent={handleSelectEvent} 
            />
          ) : (
            <EventDashboard 
              selectedEvent={actualSelectedEvent}
              eventDetail={eventDetail}
              assessment={assessment}
              evidence={evidence}
              changes={changes}
              nextObs={nextObs}
              onBack={handleBackToCommand}
            />
          )}
        </ErrorBoundary>
        </div>

        {/* RIGHT: PERMANENT AI MONITOR */}<ErrorBoundary fallbackName="Persistent AI"><PersistentAIPanel view={view} eventId={actualSelectedEvent ? actualSelectedEvent.event.event_id : null} assessment={assessment} /></ErrorBoundary>
        
      </div>
    </div>
  );
}



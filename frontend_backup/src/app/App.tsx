import { useConjunctIQ } from "../hooks/useConjunctIQ";
import StatusStrip from "../workstation/StatusStrip";
import EventConsole from "../workstation/EventConsole";
import CentralDisplay from "../workstation/CentralDisplay";
import TelemetryDeck from "../workstation/TelemetryDeck";
import AnalysisPanel from "../analysis/AnalysisPanel";

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

  const selectedEvent = events.find(e => e.event.event_id === selectedEventId) ?? null;

  if (loading) {
    return (
      <div className="boot-screen">
        <div className="boot-screen__inner">
          <div className="boot-screen__title">CONJUNCTIQ</div>
          <div className="boot-screen__sub">Initializing workstation…</div>
        </div>
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className="boot-screen">
        <div className="boot-screen__inner">
          <div className="boot-screen__error">BACKEND OFFLINE</div>
          <div className="boot-screen__detail">{error}</div>
          <div className="boot-screen__hint">
            Ensure the backend is running at 127.0.0.1:8001
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="workstation">
      <StatusStrip status={status} summary={summary} />
      <EventConsole events={events} selectedId={selectedEventId} onSelect={selectEvent} />
      <CentralDisplay selectedEvent={selectedEvent} eventDetail={eventDetail} />
      <TelemetryDeck selectedEvent={selectedEvent} eventDetail={eventDetail} changes={changes} />
      <AnalysisPanel
        eventId={selectedEventId}
        assessment={assessment}
        evidence={evidence}
        changes={changes}
        nextObs={nextObs}
      />
    </div>
  );
}

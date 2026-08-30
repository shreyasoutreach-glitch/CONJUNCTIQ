import type { EventListItem } from "../api/types";

function classificationClass(classification: string): string {
  if (classification.includes("CRITICAL")) return "critical";
  if (classification.includes("HIGH")) return "high";
  if (classification.includes("MONITOR")) return "monitor";
  return "low";
}

function classificationColor(classification: string): string {
  if (classification.includes("CRITICAL")) return "var(--red)";
  if (classification.includes("HIGH")) return "var(--orange)";
  if (classification.includes("MONITOR")) return "var(--yellow)";
  return "var(--green)";
}

function formatTCA(tcaStr: string): string {
  try {
    const tca = new Date(tcaStr);
    const now = new Date();
    const diff = tca.getTime() - now.getTime();
    if (diff < 0) return "PASSED";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${mins}m`;
  } catch {
    return "—";
  }
}

export default function EventConsole({
  events,
  selectedId,
  onSelect,
}: {
  events: EventListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="event-console">
      <div className="panel__header">
        <span className="panel__title">
          <span className="led led--amber" />
          EVENT CONSOLE
        </span>
        <span>{events.length} TRACKED</span>
      </div>
      <div className="event-console__list">
        {events.length === 0 && (
          <div className="loading-text">No events loaded</div>
        )}
        {events.map((item) => {
          const cls = classificationClass(item.assessment.classification);
          const isSelected = item.event.event_id === selectedId;
          const color = classificationColor(item.assessment.classification);
          return (
            <div
              key={item.event.event_id}
              className={`event-row event-row--${cls} ${isSelected ? "event-row--selected" : ""}`}
              onClick={() => onSelect(item.event.event_id)}
            >
              <div className="event-row__top">
                <span className="event-row__id">{item.event.event_id}</span>
                <span className="event-row__score" style={{ color }}>{item.assessment.score}</span>
              </div>
              <div className="event-row__objects">
                {item.event.primary_object_id} × {item.event.secondary_object_id}
              </div>
              <div className="event-row__bottom">
                <span className="event-row__classification" style={{ color }}>
                  {item.assessment.classification}
                </span>
                <span className="event-row__tca">
                  TCA {formatTCA(item.event.tca)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

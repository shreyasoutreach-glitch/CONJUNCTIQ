import { EventListItem } from "../api/types";
import OrbitalScene from "../scene/OrbitalScene";

interface Props {
  events: EventListItem[];
  defaultEvent: EventListItem | null;
  onSelectEvent: (id: string) => void;
}

function formatTCA(tcaStr: string): string {
  try {
    const tca = new Date(tcaStr);
    const now = new Date();
    const diffMs = tca.getTime() - now.getTime();
    if (diffMs <= 0) return "TCA PASSED";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  } catch {
    return tcaStr;
  }
}

function statusBadge(score: number): string {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "WARNING";
  if (score >= 25) return "MONITOR";
  return "LOW";
}

export default function CommandCenter({ events, defaultEvent, onSelectEvent }: Props) {
  return (
    <div className="cockpit-command">
      
      {/* LEFT: EVENT SIDEBAR */}
      <div className="cockpit-sidebar">
        <div className="cockpit-sidebar-scroll">
          {events.map((item) => {
            const status = item.assessment?.classification || statusBadge(item.assessment?.score || 0);
            const isSelected = defaultEvent?.event.event_id === item.event.event_id;
            const statusClass = status.includes('CRITICAL') ? 'critical' : status.includes('HIGH') || status.includes('WARNING') ? 'warning' : 'success';

            return (
              <div 
                key={item.event.event_id} 
                className={`event-card ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectEvent(item.event.event_id)}
                style={{ flex: "none" }}
              >
                <div className="ec-header">
                  <span className="ec-id">{item.event.event_id}</span>
                  <span className={`ec-status ${statusClass}`}>{status.includes('CRITICAL') ? 'CRITICAL' : status.includes('HIGH') ? 'WARNING' : 'LOW'}</span>
                </div>
                <div className="ec-objects">{item.event.primary_object_id} × {item.event.secondary_object_id}</div>
                
                <div className="ec-body">
                  <div className={`ec-score ${statusClass}`}>
                    {item.assessment?.score || 0}
                  </div>
                  <div className="ec-tca">
                    {formatTCA(item.event.time_of_closest_approach ?? item.event.tca)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTER: ORBITAL VISUALIZATION */}
      <div className="cockpit-center">
        <div style={{ position: "absolute", inset: 0 }}>
          <OrbitalScene selectedEvent={defaultEvent} eventDetail={null} />
        </div>
        
        {/* HUD FLOATING TEXT */}
        <div className="hud-layer">
          <div className="hud-corner" style={{ position: "absolute", top: "32px", left: "32px" }}>
            <span className="hud-val">{defaultEvent ? defaultEvent.event.event_id : "NO TARGET"}</span>
            {defaultEvent && (
              <span className={`hud-label ${defaultEvent.assessment?.classification.includes('CRITICAL') ? 'critical' : 'warning'}`} style={{ color: defaultEvent.assessment?.classification.includes('CRITICAL') ? 'var(--critical)' : 'var(--warning)', marginTop: "4px" }}>
                {defaultEvent.assessment?.classification}
              </span>
            )}
          </div>
          
          {defaultEvent && (
            <>
              <div className="hud-corner" style={{ position: "absolute", bottom: "32px", left: "32px", gap: "16px", flexDirection: "row" }}>
                <div>
                  <div className="hud-label">MISS DISTANCE</div>
                  <div className="hud-val">{defaultEvent.event.miss_distance_km?.toFixed(3) || "---"} km</div>
                </div>
                <div style={{ marginLeft: "32px" }}>
                  <div className="hud-label">COLLISION PROBABILITY</div>
                  <div className="hud-val">{defaultEvent.event.collision_probability?.toExponential(2) || "---"}</div>
                </div>
              </div>

              <div className="hud-corner" style={{ position: "absolute", bottom: "32px", right: "32px", textAlign: "right" }}>
                <div className="hud-label">TCA</div>
                <div className="hud-val">{new Date(defaultEvent.event.time_of_closest_approach ?? defaultEvent.event.tca).toUTCString().replace(" GMT", " UTC")}</div>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

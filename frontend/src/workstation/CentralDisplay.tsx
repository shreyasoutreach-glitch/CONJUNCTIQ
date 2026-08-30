import { Suspense } from "react";
import OrbitalScene from "../scene/OrbitalScene";
import type { EventListItem, EventDetail } from "../api/types";

export default function CentralDisplay({
  selectedEvent,
  eventDetail,
}: {
  selectedEvent: EventListItem | null;
  eventDetail: EventDetail | null;
}) {
  const ev = selectedEvent?.event;
  const isSynthetic = ev?.data_source?.includes("SYNTHETIC") ||
    ev?.data_source?.includes("CONJUNCTIQ") ||
    ev?.data_source === null ||
    true;

  return (
    <div className="scene-viewport">
      {/* 3D Canvas */}
      <div className="scene-viewport__canvas">
        <Suspense fallback={<div className="loading-text">Initializing 3D scene…</div>}>
          <OrbitalScene selectedEvent={selectedEvent} eventDetail={eventDetail} />
        </Suspense>
      </div>

      {/* Scan line effect */}
      <div className="scene-scan" />

      {/* Bezel frame corners */}
      <div className="scene-viewport__frame">
        <div className="scene-viewport__corner scene-viewport__corner--tl" />
        <div className="scene-viewport__corner scene-viewport__corner--tr" />
        <div className="scene-viewport__corner scene-viewport__corner--bl" />
        <div className="scene-viewport__corner scene-viewport__corner--br" />
      </div>

      {/* Top-left label */}
      <div className="scene-overlay scene-overlay--top-left">
        <div className="scene-label">3D Orbital Situation</div>
      </div>

      {/* Top-right event info */}
      {ev && (
        <div className="scene-overlay scene-overlay--top-right">
          <div className="scene-event-id">{ev.event_id}</div>
          <div className="scene-objects">
            {ev.primary_object_id} × {ev.secondary_object_id}
          </div>
        </div>
      )}

      {/* Bottom-left provenance */}
      <div className="scene-overlay scene-overlay--bottom-left">
        <div className="scene-provenance">
          {isSynthetic ? (
            <span className="provenance-tag provenance-tag--synthetic">
              SYNTHETIC DEMO
            </span>
          ) : (
            <span className="provenance-tag provenance-tag--real">
              REAL DATA
            </span>
          )}
        </div>
      </div>

      {/* Bottom-right legend */}
      <div className="scene-overlay scene-overlay--bottom-right">
        <div className="scene-legend">
          <div className="scene-legend__item">
            <span className="scene-legend__dot" style={{ background: "var(--cyan)" }} />
            PRIMARY OBJECT
          </div>
          <div className="scene-legend__item">
            <span className="scene-legend__dot" style={{ background: "var(--amber)" }} />
            SECONDARY OBJECT
          </div>
          <div className="scene-legend__item">
            <span className="scene-legend__dot" style={{ background: "var(--red)" }} />
            CONJUNCTION POINT
          </div>
        </div>
      </div>
    </div>
  );
}

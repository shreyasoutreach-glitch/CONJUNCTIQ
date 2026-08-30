import type { EventListItem, EventDetail, ChangeAnalysis } from "../api/types";

function formatProb(p: number | null | undefined): string {
  if (p === null || p === undefined) return "—";
  return p.toExponential(1);
}

function formatDistance(d: number | null | undefined): string {
  if (d === null || d === undefined) return "—";
  return d.toFixed(1);
}

function formatVelocity(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return v.toFixed(1);
}

function formatTCA(tcaStr: string | undefined | null): string {
  if (!tcaStr) return "—";
  try {
    const tca = new Date(tcaStr);
    if (isNaN(tca.getTime())) return "—";
    const now = new Date();
    const diff = tca.getTime() - now.getTime();
    if (diff < 0) return "PASSED";
    const totalMins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hours >= 48) {
      const days = Math.floor(hours / 24);
      const remH = hours % 24;
      return `${days}d ${String(remH).padStart(2, "0")}h`;
    }
    return `${hours}h ${String(mins).padStart(2, "0")}m`;
  } catch {
    return "—";
  }
}

function scoreColor(score: number): string {
  if (score >= 75) return "red";
  if (score >= 50) return "orange";
  if (score >= 25) return "yellow";
  return "green";
}

export default function TelemetryDeck({
  selectedEvent,
  eventDetail,
  changes,
}: {
  selectedEvent: EventListItem | null;
  eventDetail: EventDetail | null;
  changes: ChangeAnalysis | null;
}) {
  const ev = selectedEvent?.event;
  const score = selectedEvent?.assessment.score ?? 0;
  const sc = scoreColor(score);
  const escalating = changes?.status === "escalating";

  // Backend returns a flat UpdateInput for /api/events/{id}
  // So eventDetail IS the flat object (not nested).
  // Pull fields from eventDetail (flat) first, fall back to selectedEvent.event
  const missDistance = eventDetail?.miss_distance_km ?? ev?.miss_distance_km ?? null;
  const collProb = eventDetail?.collision_probability ?? ev?.collision_probability ?? null;
  const relVel = eventDetail?.relative_velocity_km_s ?? ev?.relative_velocity_km_s ?? null;
  const tca = eventDetail?.time_of_closest_approach ?? ev?.time_of_closest_approach ?? ev?.tca ?? null;

  const radUnc = eventDetail?.radial_uncertainty_km ?? ev?.radial_uncertainty_km ?? null;
  const atUnc = eventDetail?.along_track_uncertainty_km ?? ev?.along_track_uncertainty_km ?? null;
  const ctUnc = eventDetail?.cross_track_uncertainty_km ?? ev?.cross_track_uncertainty_km ?? null;

  // Also support legacy nested latest_update shape (in case backend changes)
  const legacy = eventDetail?.latest_update;
  const finalMiss = missDistance ?? legacy?.miss_distance_km ?? null;
  const finalProb = collProb ?? legacy?.collision_probability ?? null;
  const finalVel = relVel ?? legacy?.relative_velocity_km_s ?? null;
  const finalTca = tca ?? legacy?.time_of_closest_approach ?? null;
  const finalRadUnc = radUnc ?? legacy?.radial_uncertainty_km ?? null;
  const finalAtUnc = atUnc ?? legacy?.along_track_uncertainty_km ?? null;
  const finalCtUnc = ctUnc ?? legacy?.cross_track_uncertainty_km ?? null;

  const uncertainty = (finalRadUnc !== null && finalAtUnc !== null && finalCtUnc !== null)
    ? Math.sqrt((finalRadUnc ?? 0) ** 2 + (finalAtUnc ?? 0) ** 2 + (finalCtUnc ?? 0) ** 2)
    : null;

  return (
    <div className="telemetry-deck">
      <div className="telemetry-deck__grid">
        <div className={`telemetry-cell telemetry-cell--${sc}`}>
          <div className="telemetry-cell__label">Attention Score</div>
          <div className="telemetry-cell__value">{score}</div>
          <div className="telemetry-cell__unit">/ 100</div>
        </div>

        <div className="telemetry-cell">
          <div className="telemetry-cell__label">Miss Distance</div>
          <div className="telemetry-cell__value">
            {formatDistance(finalMiss)}
          </div>
          <div className="telemetry-cell__unit">km</div>
        </div>

        <div className="telemetry-cell telemetry-cell--cyan">
          <div className="telemetry-cell__label">Collision Prob</div>
          <div className="telemetry-cell__value" style={{ fontSize: 16 }}>
            {formatProb(finalProb)}
          </div>
          <div className="telemetry-cell__unit">&nbsp;</div>
        </div>

        <div className="telemetry-cell">
          <div className="telemetry-cell__label">Rel Velocity</div>
          <div className="telemetry-cell__value">
            {formatVelocity(finalVel)}
          </div>
          <div className="telemetry-cell__unit">km/s</div>
        </div>

        <div className="telemetry-cell telemetry-cell--accent">
          <div className="telemetry-cell__label">TCA</div>
          <div className="telemetry-cell__value" style={{ fontSize: 18 }}>
            {formatTCA(finalTca)}
          </div>
          <div className="telemetry-cell__unit">&nbsp;</div>
        </div>

        <div className={`telemetry-cell ${escalating ? "telemetry-cell--red" : "telemetry-cell--green"}`}>
          <div className="telemetry-cell__label">Escalation</div>
          <div className="telemetry-cell__value" style={{ fontSize: 16 }}>
            {changes?.status === "insufficient data" ? "N/A" : escalating ? "YES" : "NO"}
          </div>
          <div className="telemetry-cell__unit">&nbsp;</div>
        </div>
      </div>
    </div>
  );
}

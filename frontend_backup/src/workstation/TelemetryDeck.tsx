import type { EventListItem, EventDetail, ChangeAnalysis } from "../api/types";

function formatProb(p: number | null): string {
  if (p === null) return "—";
  return p.toExponential(1);
}

function formatDistance(d: number | null): string {
  if (d === null) return "—";
  return d.toFixed(1);
}

function formatVelocity(v: number | null): string {
  if (v === null) return "—";
  return v.toFixed(1);
}

function formatTCA(tcaStr: string | undefined): string {
  if (!tcaStr) return "—";
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
  const latest = eventDetail?.latest_update;
  const score = selectedEvent?.assessment.score ?? 0;
  const sc = scoreColor(score);
  const escalating = changes?.status === "escalating";
  const uncertainty = latest
    ? Math.sqrt(
        (latest.radial_uncertainty_km ?? 0) ** 2 +
        (latest.along_track_uncertainty_km ?? 0) ** 2 +
        (latest.cross_track_uncertainty_km ?? 0) ** 2
      )
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
            {formatDistance(latest?.miss_distance_km ?? ev?.miss_distance_km ?? null)}
          </div>
          <div className="telemetry-cell__unit">km</div>
        </div>

        <div className="telemetry-cell telemetry-cell--cyan">
          <div className="telemetry-cell__label">Collision Prob</div>
          <div className="telemetry-cell__value" style={{ fontSize: 16 }}>
            {formatProb(latest?.collision_probability ?? ev?.collision_probability ?? null)}
          </div>
          <div className="telemetry-cell__unit">&nbsp;</div>
        </div>

        <div className="telemetry-cell">
          <div className="telemetry-cell__label">Rel Velocity</div>
          <div className="telemetry-cell__value">
            {formatVelocity(latest?.relative_velocity_km_s ?? null)}
          </div>
          <div className="telemetry-cell__unit">km/s</div>
        </div>

        <div className="telemetry-cell telemetry-cell--accent">
          <div className="telemetry-cell__label">TCA</div>
          <div className="telemetry-cell__value" style={{ fontSize: 18 }}>
            {formatTCA(latest?.time_of_closest_approach ?? ev?.tca)}
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

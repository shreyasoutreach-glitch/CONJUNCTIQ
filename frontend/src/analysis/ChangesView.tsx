import type { ChangeAnalysis } from "../api/types";

function statusClass(status: string): string {
  if (status === "escalating") return "escalating";
  if (status === "de-escalating") return "de-escalating";
  if (status === "stable") return "stable";
  if (status === "mixed") return "mixed";
  return "insufficient";
}

function formatValue(val: number | string | null): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "number") {
    if (Math.abs(val) < 0.001 && val !== 0) return val.toExponential(1);
    return val.toFixed(2);
  }
  return val;
}

export default function ChangesView({ changes }: { changes: ChangeAnalysis | null }) {
  if (!changes) return <div className="loading-text">No change data</div>;

  const sc = statusClass(changes.status);

  return (
    <div className="change-display">
      <div className={`change-status change-status--${sc}`}>
        {changes.status === "insufficient data" ? "INSUFFICIENT DATA" : changes.status.toUpperCase()}
      </div>

      {changes.status === "insufficient data" && (
        <div className="observation-field">
          <div className="observation-field__label">Current Assessment</div>
          <div className="observation-field__value">Available</div>
          <div className="observation-field__label" style={{ marginTop: 6 }}>Historical Comparison</div>
          <div className="observation-field__value">Not available — only one update received</div>
        </div>
      )}

      {changes.changes.map((c, i) => (
        <div key={i} className="change-arrow">
          <div className="change-arrow__col">
            <div className="change-arrow__label">Previous</div>
            <div className="change-arrow__value">{formatValue(c.previous)}</div>
          </div>
          <div className="change-arrow__icon">
            {c.direction === "increasing" ? "↑" : c.direction === "decreasing" ? "↓" : "→"}
          </div>
          <div className="change-arrow__col">
            <div className="change-arrow__label">Current</div>
            <div className="change-arrow__value">{formatValue(c.current)}</div>
          </div>
          <div className="change-arrow__col" style={{ flex: 0.6 }}>
            <div className="change-arrow__label">{c.field.replace(/_/g, " ")}</div>
            <div className="change-arrow__value" style={{
              fontSize: 9,
              color: c.significance === "high" ? "var(--red)" : c.significance === "moderate" ? "var(--orange)" : "var(--text-tertiary)"
            }}>
              {c.significance.toUpperCase()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

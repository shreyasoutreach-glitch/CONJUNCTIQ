import type { EvidenceItem } from "../api/types";

export default function EvidenceView({ evidence }: { evidence: EvidenceItem[] }) {
  if (evidence.length === 0) return <div className="loading-text">No evidence data</div>;

  return (
    <div>
      {evidence.map((e, i) => (
        <div key={i} className={`evidence-item evidence-item--${e.importance}`}>
          <div className="evidence-item__factor">{e.factor}</div>
          <div className="evidence-item__row">
            <span>Observed</span>
            <span style={{ color: "var(--text-bright)" }}>{e.observed_value}</span>
          </div>
          <div className="evidence-item__row">
            <span>Threshold</span>
            <span style={{ color: "var(--cyan)" }}>{e.threshold}</span>
          </div>
          <div className="evidence-item__row">
            <span>Importance</span>
            <span style={{ color: "var(--amber)" }}>{e.importance}</span>
          </div>
          <div className="evidence-item__row">
            <span>Points</span>
            <span style={{ color: "var(--amber)" }}>+{e.points}</span>
          </div>
          <div className="evidence-item__explanation">{e.explanation}</div>
        </div>
      ))}
    </div>
  );
}

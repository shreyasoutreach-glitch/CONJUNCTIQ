import type { Assessment } from "../api/types";

function classificationClass(cls: string): string {
  if (cls.includes("CRITICAL")) return "critical";
  if (cls.includes("HIGH")) return "high";
  if (cls.includes("MONITOR")) return "monitor";
  return "low";
}

export default function AssessmentView({ assessment }: { assessment: Assessment | null }) {
  if (!assessment) return <div className="loading-text">No assessment data</div>;

  const cls = classificationClass(assessment.classification);

  return (
    <div>
      <div className="assessment-score">
        <span className="assessment-score__value" style={{
          color: cls === "critical" ? "var(--red)" : cls === "high" ? "var(--orange)" : cls === "monitor" ? "var(--yellow)" : "var(--green)"
        }}>
          {assessment.score}
        </span>
        <span className="assessment-score__max">/100</span>
      </div>

      <div className={`assessment-classification classification--${cls}`}>
        {assessment.classification}
      </div>

      <div className="factor-list">
        {assessment.factors.map((f, i) => (
          <div key={i} className="factor-item">
            <div className="factor-item__header">
              <span className="factor-item__name">{f.factor.replace(/_/g, " ")}</span>
              <span className="factor-item__points">+{f.points} pts</span>
            </div>
            <div className="factor-item__explanation">{f.explanation}</div>
            {f.observed_value !== null && f.observed_value !== undefined && (
              <div className="factor-item__detail">
                <span>Obs: {String(f.observed_value)}</span>
                {f.threshold && <span>Thresh: {f.threshold}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="disclaimer-text">{assessment.disclaimer}</div>
    </div>
  );
}

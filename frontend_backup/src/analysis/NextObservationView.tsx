import type { NextObservation } from "../api/types";

function priorityClass(priority: string): string {
  const p = priority.toLowerCase();
  if (p === "high") return "high";
  if (p === "moderate") return "moderate";
  return "low";
}

export default function NextObservationView({ observation }: { observation: NextObservation | null }) {
  if (!observation) return <div className="loading-text">No observation data</div>;

  const pc = priorityClass(observation.priority);

  return (
    <div className="observation-display">
      <div className={`observation-priority observation-priority--${pc}`}>
        {observation.priority} PRIORITY
      </div>

      <div className="observation-field">
        <div className="observation-field__label">Information Gap</div>
        <div className="observation-field__value">{observation.information_gap}</div>
      </div>

      <div className="observation-field">
        <div className="observation-field__label">Recommended Observation</div>
        <div className="observation-field__value">{observation.suggestion}</div>
      </div>

      <div className="observation-field">
        <div className="observation-field__label">Decision Value</div>
        <div className="observation-field__value">{observation.decision_value}</div>
      </div>

      <div className="disclaimer-text">{observation.disclaimer}</div>
    </div>
  );
}

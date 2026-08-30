import { useState } from "react";
import { api } from "../api/client";
import type { SimulationResult } from "../api/types";

export default function SimulationView({ eventId }: { eventId: string | null }) {
  const [overrides, setOverrides] = useState<Record<string, string>>({
    miss_distance_km: "",
    collision_probability: "",
    relative_velocity_km_s: "",
    radial_uncertainty_km: "",
    along_track_uncertainty_km: "",
    cross_track_uncertainty_km: "",
  });
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, number> = {};
      for (const [k, v] of Object.entries(overrides)) {
        if (v.trim() !== "") {
          const num = parseFloat(v);
          if (!isNaN(num)) params[k] = num;
        }
      }
      const r = await api.simulate(eventId, params);
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  const fields: { key: string; label: string; unit: string }[] = [
    { key: "miss_distance_km", label: "Miss Distance", unit: "km" },
    { key: "collision_probability", label: "Collision Prob", unit: "" },
    { key: "relative_velocity_km_s", label: "Rel Velocity", unit: "km/s" },
    { key: "radial_uncertainty_km", label: "Radial Unc", unit: "km" },
    { key: "along_track_uncertainty_km", label: "Along-Track", unit: "km" },
    { key: "cross_track_uncertainty_km", label: "Cross-Track", unit: "km" },
  ];

  return (
    <div className="sim-display">
      <div className="sim-controls">
        {fields.map((f) => (
          <div key={f.key} className="sim-input">
            <label className="sim-input__label">{f.label}{f.unit && ` (${f.unit})`}</label>
            <input
              className="sim-input__field"
              type="number"
              step="any"
              placeholder="—"
              value={overrides[f.key]}
              onChange={(e) => setOverrides({ ...overrides, [f.key]: e.target.value })}
            />
          </div>
        ))}
      </div>

      <button className="sim-button" onClick={handleSimulate} disabled={loading || !eventId}>
        {loading ? "Computing…" : "Run Simulation"}
      </button>

      {error && <div className="error-text">{error}</div>}

      {result && (
        <>
          <div className="sim-comparison">
            <div className="sim-card sim-card--before">
              <div className="sim-card__label">Current</div>
              <div className="sim-card__score">{result.before.score}</div>
              <div className="sim-card__class">{result.before.classification}</div>
            </div>
            <div className="sim-card sim-card--after">
              <div className="sim-card__label">Hypothetical</div>
              <div className="sim-card__score">{result.after.score}</div>
              <div className="sim-card__class">{result.after.classification}</div>
            </div>
          </div>

          {result.changed_factors.length > 0 && (
            <div className="observation-field">
              <div className="observation-field__label">Changed Factors</div>
              <div className="observation-field__value" style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
                {result.changed_factors.map(f => f.replace(/_/g, " ")).join(", ")}
              </div>
            </div>
          )}

          <div className="sim-disclaimer">
            HYPOTHETICAL SCENARIO — NOT A PREDICTION — NOT MANEUVER GUIDANCE
          </div>
        </>
      )}
    </div>
  );
}

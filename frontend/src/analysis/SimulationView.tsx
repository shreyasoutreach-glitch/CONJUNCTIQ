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
          if (isNaN(num)) {
            throw new Error(`Invalid number format for ${k.replace(/_/g, " ")}`);
          }
          if (num < 0) {
            throw new Error(`${k.replace(/_/g, " ")} must be \u2265 0`);
          }
          if (k === "collision_probability" && num > 1) {
            throw new Error(`collision probability must be \u2264 1`);
          }
          params[k] = num;
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

  const fields: { key: string; label: string; unit: string; min: number; max?: number }[] = [
    { key: "miss_distance_km", label: "Miss Distance", unit: "km", min: 0 },
    { key: "collision_probability", label: "Collision Prob", unit: "", min: 0, max: 1 },
    { key: "relative_velocity_km_s", label: "Rel Velocity", unit: "km/s", min: 0 },
    { key: "radial_uncertainty_km", label: "Radial Unc", unit: "km", min: 0 },
    { key: "along_track_uncertainty_km", label: "Along-Track", unit: "km", min: 0 },
    { key: "cross_track_uncertainty_km", label: "Cross-Track", unit: "km", min: 0 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {fields.map((f) => (
          <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{f.label}{f.unit && ` (${f.unit})`}</label>
            <input
              style={{ background: "var(--bg-base)", border: "1px solid var(--seam)", borderRadius: "6px", padding: "10px", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "14px" }}
              type="number"
              step="any"
              min={f.min}
              max={f.max}
              placeholder="---"
              value={overrides[f.key]}
              onChange={(e) => setOverrides({ ...overrides, [f.key]: e.target.value })}
            />
          </div>
        ))}
      </div>

      <button onClick={handleSimulate} disabled={loading || !eventId} style={{ background: "var(--text-primary)", color: "var(--bg-base)", border: "none", padding: "12px", borderRadius: "6px", fontWeight: 500, fontSize: "14px", cursor: "pointer", opacity: (loading || !eventId) ? 0.5 : 1 }}>
        {loading ? "Computing..." : "Run Simulation"}
      </button>

      {error && (
        <div style={{ color: "var(--critical)", fontSize: "13px", fontWeight: 500, padding: "12px", background: "rgba(255, 69, 58, 0.1)", borderRadius: "6px" }}>
          Validation Error: {error}
        </div>
      )}

      {result && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
          
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1, padding: "20px", background: "var(--surface-secondary)", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px", textTransform: "uppercase" }}>Current</div>
              <div style={{ fontSize: "32px", fontWeight: 400, color: "var(--text-primary)" }}>{result.before.score}</div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>{result.before.classification}</div>
            </div>
            <div style={{ flex: 1, padding: "20px", background: "var(--surface-secondary)", borderRadius: "8px", textAlign: "center", border: "1px solid var(--accent)" }}>
              <div style={{ fontSize: "12px", color: "var(--accent)", marginBottom: "8px", textTransform: "uppercase" }}>Hypothetical</div>
              <div style={{ fontSize: "32px", fontWeight: 400, color: "var(--accent)" }}>{result.after.score}</div>
              <div style={{ fontSize: "12px", color: "var(--accent)", marginTop: "4px" }}>{result.after.classification}</div>
            </div>
          </div>

          <div style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Hypothetical scenario. Not maneuver guidance.
          </div>

        </div>
      )}
    </div>
  );
}

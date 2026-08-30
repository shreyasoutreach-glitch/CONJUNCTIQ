import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { NasaResponse } from "../api/types";

function formatDist(au: number | null): string {
  if (au === null) return "—";
  if (au < 0.01) return `${(au * 149597.871).toFixed(0)} km`;
  return `${au.toFixed(4)} AU`;
}

function formatDiameter(d: number | null): string {
  if (d === null) return "—";
  if (d >= 1000) return `${(d / 1000).toFixed(1)} km`;
  return `${d.toFixed(0)} m`;
}

export default function NasaPanel() {
  const [data, setData] = useState<NasaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await api.getNasaApproaches();
        setData(r);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load NASA data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="loading-text">Establishing NASA/JPL data link…</div>;
  if (error) return <div className="error-text">{error}</div>;
  if (!data) return <div className="loading-text">No data</div>;

  const isLive = data.status === "live";

  return (
    <div className="nasa-display">
      <div className="nasa-header">
        <span className="nasa-header__title">NASA/JPL CNEOS</span>
        <span className="nasa-link-status">
          <span className={`led ${isLive ? "led--cyan" : "led--dim"}`} />
          {isLive ? "LIVE LINK" : "CACHED"}
        </span>
      </div>

      <div style={{ display: "flex", gap: 5, marginBottom: 2, alignItems: "center" }}>
        <span className="provenance-tag provenance-tag--real">REAL DATA</span>
        <span style={{ fontSize: 9, color: "var(--text-tertiary)" }}>
          {data.source}
        </span>
      </div>

      <div style={{ fontSize: 9, color: "var(--text-tertiary)", lineHeight: 1.4, marginBottom: 4 }}>
        Real astronomical data from NASA/JPL Center for Near-Earth Object Studies.
        This is independent from the synthetic ConjunctIQ demonstration events.
      </div>

      {data.approaches.map((a, i) => (
        <div key={i} className="nasa-approach">
          <div className="nasa-approach__name">
            {a.name || a.des} <span style={{ fontSize: 9, color: "var(--text-tertiary)" }}>({a.des})</span>
          </div>
          <div className="nasa-approach__row">
            <span>Date</span>
            <span style={{ color: "var(--text-bright)" }}>{a.date}</span>
          </div>
          <div className="nasa-approach__row">
            <span>Closest Dist</span>
            <span style={{ color: "var(--cyan)" }}>{formatDist(a.dist)}</span>
          </div>
          <div className="nasa-approach__row">
            <span>Velocity</span>
            <span style={{ color: "var(--text-bright)" }}>{a.v_rel ? `${a.v_rel.toFixed(2)} km/s` : "—"}</span>
          </div>
          <div className="nasa-approach__row">
            <span>Diameter</span>
            <span style={{ color: "var(--amber)" }}>{formatDiameter(a.diameter)}</span>
          </div>
        </div>
      ))}

      <div className="disclaimer-text">
        Source: NASA/JPL CNEOS. Real asteroid close-approach data — distinct from synthetic ConjunctIQ demo events.
      </div>
    </div>
  );
}

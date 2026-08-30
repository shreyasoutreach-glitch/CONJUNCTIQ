import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { NasaResponse, NasaApproach } from "../api/types";

function formatDist(km: number | null | undefined): string {
  if (km === null || km === undefined) return "—";
  if (km >= 1_000_000) return `${(km / 1_000_000).toFixed(2)}M km`;
  if (km >= 1_000) return `${(km / 1_000).toFixed(0)}k km`;
  return `${km.toFixed(0)} km`;
}

function formatDiameter(d: number | null | undefined): string {
  if (d === null || d === undefined) return "—";
  if (d >= 1000) return `${(d / 1000).toFixed(1)} km`;
  return `${d.toFixed(0)} m`;
}

function getApproachName(a: NasaApproach): string {
  return a.name ?? a.designation ?? a.des ?? "Unknown";
}

function getApproachDes(a: NasaApproach): string {
  return a.des ?? a.designation ?? "";
}

function getApproachDate(a: NasaApproach): string {
  return a.tca_raw ?? a.date ?? a.tca ?? "—";
}

function getApproachDist(a: NasaApproach): string {
  // Backend returns miss_distance_km (already converted from AU)
  const km = a.miss_distance_km ?? null;
  if (km !== null && km !== undefined) return formatDist(km);
  // Legacy: dist in AU
  if (a.dist !== null && a.dist !== undefined) return `${a.dist.toFixed(4)} AU`;
  return "—";
}

function getApproachVel(a: NasaApproach): string {
  const v = a.relative_velocity_km_s ?? a.v_rel ?? null;
  if (v === null || v === undefined) return "—";
  return `${v.toFixed(2)} km/s`;
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
  if (error) return (
    <div>
      <div className="error-text">{error}</div>
      <div className="disclaimer-text" style={{ marginTop: 8 }}>
        NASA/JPL CNEOS data link is unavailable. This does not affect the ConjunctIQ synthetic demonstration events.
      </div>
    </div>
  );
  if (!data) return <div className="loading-text">No data</div>;

  // Backend returns data in the "data" field (not "approaches")
  const approaches: NasaApproach[] = data.data ?? data.approaches ?? [];
  // Live if provenance = "real" or status = "live"
  const isLive = data.provenance === "real" || data.status === "live";

  return (
    <div className="nasa-display">
      <div className="nasa-header">
        <span className="nasa-header__title">NASA/JPL CNEOS</span>
        <span className="nasa-link-status">
          <span className={`led ${isLive ? "led--cyan" : "led--dim"}`} />
          {isLive ? "REAL DATA LINK" : "CACHED"}
        </span>
      </div>

      <div style={{ display: "flex", gap: 5, marginBottom: 2, alignItems: "center" }}>
        <span className="provenance-tag provenance-tag--real">REAL NASA/JPL DATA</span>
        <span style={{ fontSize: 9, color: "var(--text-tertiary)" }}>
          {data.source}
        </span>
      </div>

      <div style={{ fontSize: 9, color: "var(--text-tertiary)", lineHeight: 1.4, marginBottom: 4 }}>
        Real astronomical data from NASA/JPL Center for Near-Earth Object Studies.
        {approaches.length} approaches shown. Independent from the synthetic ConjunctIQ demonstration events.
      </div>

      {approaches.length === 0 && (
        <div className="loading-text">No approaches returned from NASA/JPL CNEOS.</div>
      )}

      {approaches.map((a, i) => (
        <div key={a.event_id ?? i} className="nasa-approach">
          <div className="nasa-approach__name">
            {getApproachName(a)}{" "}
            {getApproachDes(a) && <span style={{ fontSize: 9, color: "var(--text-tertiary)" }}>({getApproachDes(a)})</span>}
          </div>
          <div className="nasa-approach__row">
            <span>Date</span>
            <span style={{ color: "var(--text-bright)" }}>{getApproachDate(a)}</span>
          </div>
          <div className="nasa-approach__row">
            <span>Closest Dist</span>
            <span style={{ color: "var(--cyan)" }}>{getApproachDist(a)}</span>
          </div>
          <div className="nasa-approach__row">
            <span>Velocity</span>
            <span style={{ color: "var(--text-bright)" }}>{getApproachVel(a)}</span>
          </div>
          {(a.h_magnitude ?? a.h) && (
            <div className="nasa-approach__row">
              <span>H mag</span>
              <span style={{ color: "var(--amber)" }}>{a.h_magnitude ?? a.h}</span>
            </div>
          )}
        </div>
      ))}

      <div className="disclaimer-text">
        Source: NASA/JPL CNEOS. Real asteroid close-approach data — distinct from synthetic ConjunctIQ demo events.
      </div>
    </div>
  );
}

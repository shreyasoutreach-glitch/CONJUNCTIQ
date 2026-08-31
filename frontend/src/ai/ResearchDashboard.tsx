import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import type { ToolInfo } from "../api/types";

export default function ResearchDashboard() {
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  
  useEffect(() => {
    api.getResearchTools().then(t => {
      setTools(t.tools || (Array.isArray(t) ? t : []));
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setTools([]);
      setFetchError(true);
      setLoading(false);
    });
  }, []);

  return (
    <div className="workstation-view">
      <div className="ws-header">
        <h1>ASTRONOMY RESEARCH</h1>
        <p>Explore astronomical literature, objects, ephemerides and orbital models.</p>
      </div>
      
      <div>
        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.05em", marginBottom: "16px", textTransform: "uppercase" }}>
          Active Capabilities
        </div>
        
        {loading ? (
          <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Loading capabilities...</div>
        ) : fetchError ? (
          <div style={{ color: "var(--warning)", fontSize: "13px", padding: "16px", background: "rgba(255, 159, 10, 0.1)", borderRadius: "6px", border: "1px solid rgba(255, 159, 10, 0.2)" }}>
            Research tools are currently unavailable. The AI assistant may run in limited capability mode.
          </div>
        ) : tools.length === 0 ? (
          <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>No active capabilities found.</div>
        ) : (
          <div className="ws-grid">
            {tools.map((t) => (
              <div key={t.name} className="ws-card">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)" }}></div>
                  <div className="ws-card-title" style={{ margin: 0 }}>{t.name.replace(/_/g, " ").toUpperCase()}</div>
                </div>
                <div className="ws-card-desc">{t.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div style={{ marginTop: "16px" }}>
        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.05em", marginBottom: "16px", textTransform: "uppercase" }}>
          Research Activity
        </div>
        <div style={{ padding: "24px", background: "var(--surface-primary)", border: "1px solid var(--seam)", borderRadius: "var(--radius-md)" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "13px", fontStyle: "italic" }}>
            The AI assistant's active research operations will be logged here.
          </div>
        </div>
      </div>
    </div>
  );
}


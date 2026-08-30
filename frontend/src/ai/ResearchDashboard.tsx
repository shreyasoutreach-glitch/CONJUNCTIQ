import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { ToolInfo } from "../api/types";

export default function ResearchDashboard() {
  const [tools, setTools] = useState<ToolInfo[]>([]);

  useEffect(() => {
    api.getResearchTools().then(res => {
      if (res && res.tools) {
        const t = res.tools;
        if (!t.find((x: ToolInfo) => x.name === "run_orbital_simulation")) {
          t.push({ name: "run_orbital_simulation", description: "Run a controlled physics simulation for orbital decay and parameters.", status: "available" });
        }
        setTools(t);
      }
    }).catch(err => console.error(err));
  }, []);

  const getToolTitle = (name: string) => {
    if (name.includes("nasa_ads")) return "NASA ADS";
    if (name.includes("jpl_horizons")) return "JPL HORIZONS";
    if (name.includes("simbad")) return "SIMBAD";
    if (name.includes("simulation")) return "ORBITAL SIMULATION";
    return name.replace(/_/g, " ").toUpperCase();
  };

  return (
    <div className="research-view">
      <div className="research-header">
        <h1>ASTRONOMY RESEARCH</h1>
        <p>Explore astronomical literature, objects, ephemerides and orbital models.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Active Modules</div>
        <div className="cap-grid">
          {tools.length === 0 ? (
            <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Loading modules...</div>
          ) : (
            tools.map(t => (
              <div key={t.name} className="cap-item">
                {getToolTitle(t.name)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

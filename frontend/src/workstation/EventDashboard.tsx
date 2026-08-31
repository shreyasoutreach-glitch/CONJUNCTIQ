import { useState } from "react";
import { EventListItem, EventDetail, Assessment, EvidenceItem, ChangeAnalysis, NextObservation } from "../api/types";
import OrbitalScene from "../scene/OrbitalScene";
import SimulationView from "../analysis/SimulationView";

interface Props {
  selectedEvent: EventListItem | null;
  eventDetail: EventDetail | null;
  assessment: Assessment | null;
  evidence: EvidenceItem[];
  changes: ChangeAnalysis | null;
  nextObs: NextObservation | null;
  onBack: () => void;
}

type TabState = "ASSESSMENT" | "EVIDENCE" | "CHANGES" | "OBSERVATION" | "SIMULATION";

export default function EventDashboard({ selectedEvent, eventDetail, assessment, evidence, changes, nextObs, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<TabState>("ASSESSMENT");

  if (!selectedEvent) return null;
  
  const ev = selectedEvent.event;
  const isCritical = assessment?.classification?.includes('CRITICAL');

  // Generate Modeled Mission/Economics Intelligence (Deterministic based on event ID)
  const isDemo1 = ev.event_id === "DEMO-001";
  const missionCriticality = isDemo1 ? "HIGH" : ev.event_id === "DEMO-003" ? "CRITICAL" : "MODERATE";
  const trackingConfidence = isDemo1 ? "MODERATE" : "HIGH";
  const econExposure = isDemo1 ? "MODELED: HIGH ($400M+)" : ev.event_id === "DEMO-003" ? "MODELED: CRITICAL ($1.2B+)" : "MODELED: LOW ($50M+)";
  const serviceExposure = isDemo1 ? "MODELED: REGIONAL DISRUPTION" : "MODELED: NO DISRUPTION EXPECTED";


  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", gap: "24px" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px", flex: "none" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 500 }}>
          <span style={{ fontSize: "16px" }}>?</span> Command Center
        </button>
        <div style={{ width: "1px", height: "24px", background: "var(--seam)" }}></div>
        <div className="tech-text" style={{ fontSize: "18px", color: "var(--text-primary)" }}>{ev.event_id}</div>
        {assessment && (
          <div style={{ fontSize: "12px", fontWeight: 600, padding: "4px 12px", borderRadius: "100px", background: isCritical ? "rgba(255, 69, 58, 0.1)" : "rgba(255, 159, 10, 0.1)", color: isCritical ? "var(--critical)" : "var(--warning)" }}>
            {assessment.classification} • {assessment.score} / 100
          </div>
        )}
      </div>

      <div className="dashboard-workspace">
        
        {/* LEFT: TARGET TELEMETRY */}
        <div className="dash-col-telemetry">
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Target Telemetry</div>
          
          <div className="telemetry-item">
            <div className="telemetry-label">Miss Distance</div>
            <div className="telemetry-value">{ev.miss_distance_km?.toFixed(3) || "---"} km</div>
          </div>
          <div className="telemetry-item">
            <div className="telemetry-label">Collision Probability</div>
            <div className="telemetry-value">{ev.collision_probability?.toExponential(2) || "---"}</div>
          </div>
          <div className="telemetry-item">
            <div className="telemetry-label">Relative Velocity</div>
            <div className="telemetry-value">{ev.relative_velocity_km_s?.toFixed(3) || "---"} km/s</div>
          </div>
          <div className="telemetry-item">
            <div className="telemetry-label">TCA</div>
            <div className="telemetry-value" style={{ fontSize: "14px" }}>{new Date(ev.time_of_closest_approach ?? ev.tca).toUTCString().replace(" GMT", " UTC")}</div>
          </div>
          {ev.radial_uncertainty_km && (
            <div className="telemetry-item">
              <div className="telemetry-label">Radial Uncertainty</div>
              <div className="telemetry-value">{ev.radial_uncertainty_km.toFixed(3)} km</div>
            </div>
          )}
        </div>

        {/* CENTER: ORBITAL VISUALIZATION */}
        <div className="dash-col-scene">
          <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
            <OrbitalScene selectedEvent={selectedEvent} eventDetail={eventDetail} />
          </div>
          <div className="hud-layer" style={{ zIndex: 2 }}>
            <div className="hud-corner">
              <span className="hud-label">Geometry</span>
              <span className="hud-val" style={{ fontSize: "14px" }}>{ev.primary_object_id} × {ev.secondary_object_id}</span>
            </div>
          </div>
        </div>

        {/* RIGHT: ANALYSIS STATION */}
        <div className="dash-col-analysis">
          <div className="analysis-header">
            <div className="seg-nav" style={{ background: "var(--bg-base)" }}>
              {(["ASSESSMENT", "EVIDENCE", "CHANGES", "OBSERVATION", "SIMULATION"] as TabState[]).map(tab => (
                <button 
                  key={tab} 
                  className={`seg-nav-btn ${activeTab === tab ? "active" : ""}`}
                  style={{ flex: 1, padding: "6px 8px", fontSize: "11px" }}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "OBSERVATION" ? "OBSERVE" : tab === "SIMULATION" ? "SIMULATE" : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="analysis-content modern-text">
            {activeTab === "ASSESSMENT" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                
                {/* 1. TECHNICAL RISK */}
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.05em", marginBottom: "16px", textTransform: "uppercase" }}>
                    Technical Risk
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                      <div style={{ fontSize: "40px", fontWeight: 300, color: "var(--text-primary)", lineHeight: 1 }}>
                        {assessment?.score || 0}
                      </div>
                      <div style={{ fontSize: "16px", color: "var(--text-secondary)" }}>/ 100</div>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: isCritical ? "var(--critical)" : "var(--warning)", marginTop: "4px", textTransform: "uppercase" }}>
                      {assessment?.classification}
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--seam)", paddingTop: "12px" }}>
                    {assessment?.factors.map((f, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ color: "var(--text-secondary)" }}>{f.factor.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>+{f.points}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. MISSION IMPACT */}
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.05em", marginBottom: "12px", textTransform: "uppercase" }}>
                    Mission Impact
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Mission Criticality</span>
                      <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{missionCriticality}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Tracking Confidence</span>
                      <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{trackingConfidence}</span>
                    </div>
                  </div>
                </div>

                {/* 3. ECONOMIC EXPOSURE */}
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.05em", marginBottom: "12px", textTransform: "uppercase" }}>
                    Economic Exposure
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Asset Exposure</span>
                      <span style={{ color: "var(--text-primary)", fontWeight: 500, textAlign: "right" }}>{econExposure}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", alignItems: "flex-start" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Service Impact</span>
                      <span style={{ color: "var(--text-primary)", fontWeight: 500, textAlign: "right" }}>{serviceExposure}</span>
                    </div>
                  </div>
                </div>

                {/* 4. DECISION SUPPORT SUMMARY */}
                <div style={{ padding: "12px", background: "var(--surface-primary)", borderRadius: "6px", border: "1px solid var(--seam)" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.05em", marginBottom: "8px", textTransform: "uppercase" }}>
                    Decision Brief
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.5 }}>
                    Updated covariance information is the highest priority. Economic exposure is modeled as {econExposure.replace("MODELED: ", "").toLowerCase()} due to mission criticality. No maneuver recommendation is issued by ConjunctIQ at this time.
                  </div>
                </div>

              </div>
            )}

            {activeTab === "EVIDENCE" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>Source</div>
                  <div style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 500 }}>{ev.data_source || "NASA/JPL CNEOS"}</div>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {evidence.map((evItem, i) => (
                    <div key={i} className="evidence-box">
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "8px" }}>{evItem.factor.replace(/_/g, " ")}</div>
                      <div className="tech-text" style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "8px" }}>{evItem.observed}</div>
                      <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{evItem.explanation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "CHANGES" && changes && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Change Feed</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {changes.changes.map((c, i) => (
                    <div key={i} style={{ paddingLeft: "16px", borderLeft: "2px solid var(--seam)" }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "4px" }}>{c.field.replace(/_/g, " ").toUpperCase()}</div>
                      <div className="tech-text" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                        <span>{c.previous}</span>
                        <span>?</span>
                        <span style={{ color: "var(--text-primary)" }}>{c.current}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{c.significance}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "OBSERVATION" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {nextObs?.information_gap && (
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "8px" }}>Information Gap</div>
                    <div style={{ color: "var(--text-primary)", fontSize: "14px", lineHeight: 1.6 }}>{nextObs.information_gap}</div>
                  </div>
                )}
                {nextObs?.suggestion && (
                  <div style={{ padding: "16px", background: "var(--surface-primary)", borderRadius: "8px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", marginBottom: "8px" }}>Priority</div>
                    <div style={{ color: "var(--text-primary)", fontSize: "14px", lineHeight: 1.6 }}>{nextObs.suggestion}</div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "SIMULATION" && (
              <SimulationView eventId={ev.event_id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




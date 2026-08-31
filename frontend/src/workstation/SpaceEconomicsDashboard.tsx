import React, { useState } from "react";

export default function SpaceEconomicsDashboard() {
  const [satelliteCost, setSatelliteCost] = useState(8.7);
  const [dailyRev, setDailyRev] = useState(0.04);
  const [downtime, setDowntime] = useState(52);
  const [collisionProb, setCollisionProb] = useState(0.015);
  const [maneuverCost, setManeuverCost] = useState(0.05);

  const assetExposure = satelliteCost + (dailyRev * downtime);
  const expectedLoss = assetExposure * collisionProb;
  const revenueAtRisk = dailyRev * downtime;

  const mitigateCost = maneuverCost;
  const mitigateExpectedLoss = assetExposure * 0.0001; // residual risk
  const mitigateResidual = mitigateCost + mitigateExpectedLoss;

  const replaceCost = satelliteCost;
  const replaceDowntime = downtime;
  const replaceRevenueLoss = dailyRev * downtime;

  return (
    <div className="workstation-view">
      <div className="ws-header">
        <h1>SPACE ECONOMICS</h1>
        <p>Translate orbital risk into financial exposure.</p>
      </div>
      
      {/* TOP METRICS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        <div className="ws-card">
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Asset Exposure</div>
          <div style={{ fontSize: "28px", color: "var(--text-primary)", fontWeight: 300 }}>${assetExposure.toFixed(1)}M</div>
        </div>
        <div className="ws-card">
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Expected Loss</div>
          <div style={{ fontSize: "28px", color: "var(--critical)", fontWeight: 300 }}>${(expectedLoss * 1000).toFixed(0)}K</div>
        </div>
        <div className="ws-card">
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Revenue at Risk</div>
          <div style={{ fontSize: "28px", color: "var(--warning)", fontWeight: 300 }}>${revenueAtRisk.toFixed(1)}M</div>
        </div>
        <div className="ws-card">
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Replacement Cost</div>
          <div style={{ fontSize: "28px", color: "var(--text-primary)", fontWeight: 300 }}>${replaceCost.toFixed(1)}M</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginTop: "16px" }}>
        
        {/* MITIGATION VS REPLACEMENT */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.05em", marginBottom: "16px", textTransform: "uppercase" }}>
            Mitigation vs Replacement Analysis
          </div>
          <div style={{ display: "flex", gap: "24px" }}>
            
            <div className="ws-card" style={{ flex: 1 }}>
              <div style={{ color: "var(--accent)", fontWeight: 600, fontSize: "13px", marginBottom: "16px", textTransform: "uppercase" }}>Mitigation</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Maneuver Cost</span>
                  <span style={{ color: "var(--text-primary)", fontSize: "13px" }}>${(mitigateCost * 1000).toFixed(0)}K</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Avoided Loss</span>
                  <span style={{ color: "var(--success)", fontSize: "13px" }}>${((expectedLoss - mitigateExpectedLoss) * 1000).toFixed(0)}K</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--seam)", paddingTop: "12px" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Residual Exposure</span>
                  <span style={{ color: "var(--text-primary)", fontSize: "13px" }}>${(mitigateResidual * 1000).toFixed(0)}K</span>
                </div>
              </div>
            </div>

            <div className="ws-card" style={{ flex: 1 }}>
              <div style={{ color: "var(--critical)", fontWeight: 600, fontSize: "13px", marginBottom: "16px", textTransform: "uppercase" }}>Replacement</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Capital Cost</span>
                  <span style={{ color: "var(--text-primary)", fontSize: "13px" }}>${replaceCost.toFixed(1)}M</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Lost Revenue</span>
                  <span style={{ color: "var(--critical)", fontSize: "13px" }}>${replaceRevenueLoss.toFixed(1)}M</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--seam)", paddingTop: "12px" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Total Liability</span>
                  <span style={{ color: "var(--text-primary)", fontSize: "13px" }}>${assetExposure.toFixed(1)}M</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* KEY ASSUMPTIONS */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.05em", marginBottom: "16px", textTransform: "uppercase" }}>
            Key Assumptions (Editable)
          </div>
          <div className="ws-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Satellite Cost ($M)</label>
              <input type="number" step="0.1" value={satelliteCost} onChange={e => setSatelliteCost(parseFloat(e.target.value) || 0)} style={{ width: "80px", background: "var(--bg-app)", border: "1px solid var(--seam)", color: "var(--text-primary)", padding: "4px 8px", borderRadius: "4px", textAlign: "right" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Daily Revenue ($M)</label>
              <input type="number" step="0.01" value={dailyRev} onChange={e => setDailyRev(parseFloat(e.target.value) || 0)} style={{ width: "80px", background: "var(--bg-app)", border: "1px solid var(--seam)", color: "var(--text-primary)", padding: "4px 8px", borderRadius: "4px", textAlign: "right" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Replacement Downtime (Weeks)</label>
              <input type="number" step="1" value={downtime} onChange={e => setDowntime(parseFloat(e.target.value) || 0)} style={{ width: "80px", background: "var(--bg-app)", border: "1px solid var(--seam)", color: "var(--text-primary)", padding: "4px 8px", borderRadius: "4px", textAlign: "right" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Collision Probability</label>
              <input type="number" step="0.001" value={collisionProb} onChange={e => setCollisionProb(parseFloat(e.target.value) || 0)} style={{ width: "80px", background: "var(--bg-app)", border: "1px solid var(--seam)", color: "var(--text-primary)", padding: "4px 8px", borderRadius: "4px", textAlign: "right" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Maneuver Propellant Cost ($M)</label>
              <input type="number" step="0.01" value={maneuverCost} onChange={e => setManeuverCost(parseFloat(e.target.value) || 0)} style={{ width: "80px", background: "var(--bg-app)", border: "1px solid var(--seam)", color: "var(--text-primary)", padding: "4px 8px", borderRadius: "4px", textAlign: "right" }} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import type { SystemStatus, Summary } from "../api/types";

function formatUTC(d: Date): string {
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function StatusStrip({
  status,
  summary,
}: {
  status: SystemStatus | null;
  summary: Summary | null;
}) {
  const [utc, setUtc] = useState(formatUTC(new Date()));

  useEffect(() => {
    const interval = setInterval(() => setUtc(formatUTC(new Date())), 1000);
    return () => clearInterval(interval);
  }, []);

  const eventCount = summary?.total_events ?? status?.total_events ?? 0;
  const criticalCount = summary?.critical_events ?? status?.critical_events ?? 0;
  const escalatingCount = summary?.escalating_events ?? 0;
  const aiProvider = status?.llm_provider ?? "—";
  const aiOnline = !!status?.llm_provider;
  const dbConnected = status?.database === "connected";

  return (
    <div className="topbar">
      <span className="topbar__brand">
        <span className="topbar__brand-dot" />
        CONJUNCTIQ
      </span>

      <div className="topbar__group">
        <div className="topbar__item">
          <span className={`led ${dbConnected ? "led--green" : "led--red"}`} />
          <span className="topbar__label">SYS</span>
          <span className={`topbar__value ${dbConnected ? "topbar__value--green" : "topbar__value--red"}`}>
            {dbConnected ? "ONLINE" : "OFFLINE"}
          </span>
        </div>

        <div className="topbar__divider" />

        <div className="topbar__item">
          <span className="topbar__label">EVENTS</span>
          <span className="topbar__value">{eventCount}</span>
        </div>

        <div className="topbar__item">
          <span className="topbar__label">CRITICAL</span>
          <span className="topbar__value topbar__value--red">{criticalCount}</span>
        </div>

        <div className="topbar__item">
          <span className="topbar__label">ESCALATING</span>
          <span className="topbar__value topbar__value--orange">{escalatingCount}</span>
        </div>
      </div>

      <div className="topbar__divider" />

      <div className="topbar__group">
        <div className="topbar__item">
          <span className={`led ${aiOnline ? "led--green" : "led--red"}`} />
          <span className="topbar__label">AI</span>
          <span className="topbar__value">{aiProvider.toUpperCase()}</span>
        </div>

        <div className="topbar__item">
          <span className="led led--cyan" />
          <span className="topbar__label">NASA/JPL</span>
          <span className="topbar__value topbar__value--cyan">LINK</span>
        </div>

        <div className="topbar__item">
          <span className="topbar__label">MODE</span>
          <span className="topbar__value topbar__value--accent">
            {status?.demo_mode ? "DEMO" : "LIVE"}
          </span>
        </div>
      </div>

      <span className="topbar__spacer" />

      <div className="topbar__item">
        <span className="topbar__label">UTC</span>
        <span className="topbar__utc">{utc}</span>
      </div>
    </div>
  );
}

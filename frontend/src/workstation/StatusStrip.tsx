import { useState, useEffect } from "react";
import { SystemStatus, Summary } from "../api/types";
import { ViewState } from "../app/App";

interface Props {
  status: SystemStatus | null;
  summary: Summary | null;
  view: ViewState;
  setView: (v: ViewState) => void;
}

export default function StatusStrip({ status, summary, view, setView }: Props) {
  const [time, setTime] = useState(new Date().toUTCString().replace(" GMT", " UTC"));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toUTCString().replace(" GMT", " UTC"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="cockpit-topbar">
      
      <div className="topbar-left">
        <div className="topbar-brand">CONJUNCTIQ</div>
        <div className="status-indicator">
          <div className="status-dot"></div>
          {status?.service ? "SYSTEM ONLINE" : "CONNECTING..."}
        </div>
      </div>

      <div className="topbar-center">
        <div className="seg-nav">
          <button 
            className={`seg-nav-btn ${view === "command" || view === "event" ? "active" : ""}`}
            onClick={() => setView("command")}
          >
            COMMAND CENTER
          </button>
          <button 
            className={`seg-nav-btn ${view === "research" ? "active" : ""}`}
            onClick={() => setView("research")}
          >
            ASTRONOMY RESEARCH
          </button>
          <button 
            className={`seg-nav-btn ${view === "economics" ? "active" : ""}`}
            onClick={() => setView("economics")}
          >
            SPACE ECONOMICS
          </button>
        </div>
      </div>

      <div className="topbar-right">
        {summary && (
          <>
            <div className="topbar-stat"><span>{summary.total_events}</span> EVENTS</div>
            <div className="topbar-stat critical"><span>{summary.critical_events}</span> CRITICAL</div>
            <div className="topbar-stat warning"><span>{summary.escalating_events}</span> ESCALATING</div>
          </>
        )}
        <div className="topbar-stat"><span>{time}</span></div>
      </div>
      
    </div>
  );
}

import { useState } from "react";
import type { Assessment, EvidenceItem, ChangeAnalysis, NextObservation } from "../api/types";
import AssessmentView from "./AssessmentView";
import EvidenceView from "./EvidenceView";
import ChangesView from "./ChangesView";
import NextObservationView from "./NextObservationView";
import SimulationView from "./SimulationView";
import AIPanel from "../ai/AIPanel";
import NasaPanel from "../nasa/NasaPanel";

type Tab = "assessment" | "evidence" | "changes" | "observation" | "simulate" | "ai" | "nasa";

const TABS: { id: Tab; label: string }[] = [
  { id: "assessment", label: "Assessment" },
  { id: "evidence", label: "Evidence" },
  { id: "changes", label: "Changes" },
  { id: "observation", label: "Next Obs" },
  { id: "simulate", label: "Simulate" },
  { id: "ai", label: "AI" },
  { id: "nasa", label: "NASA" },
];

export default function AnalysisPanel({
  eventId,
  assessment,
  evidence,
  changes,
  nextObs,
}: {
  eventId: string | null;
  assessment: Assessment | null;
  evidence: EvidenceItem[];
  changes: ChangeAnalysis | null;
  nextObs: NextObservation | null;
}) {
  const [tab, setTab] = useState<Tab>("assessment");

  return (
    <div className="analysis-panel">
      <div className="panel__header">
        <span className="panel__title">
          <span className="led led--cyan" />
          ANALYSIS DISPLAY
        </span>
        <span>{TABS.find(t => t.id === tab)?.label}</span>
      </div>
      <div className="mode-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`mode-btn ${tab === t.id ? "mode-btn--active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="analysis-content">
        {tab === "assessment" && <AssessmentView assessment={assessment} />}
        {tab === "evidence" && <EvidenceView evidence={evidence} />}
        {tab === "changes" && <ChangesView changes={changes} />}
        {tab === "observation" && <NextObservationView observation={nextObs} />}
        {tab === "simulate" && <SimulationView eventId={eventId} />}
        {tab === "ai" && <AIPanel eventId={eventId} />}
        {tab === "nasa" && <NasaPanel />}
      </div>
    </div>
  );
}

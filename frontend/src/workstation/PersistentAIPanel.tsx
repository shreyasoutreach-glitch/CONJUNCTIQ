import { useState, useRef, useEffect } from "react";
import { api } from "../api/client";
import type { ToolCall, ResearchSource, BriefingResult } from "../api/types";
import { ViewState } from "../app/App";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  tool_calls?: ToolCall[];
  sources?: ResearchSource[];
}

export default function PersistentAIPanel({ view, eventId, assessment }: { view: ViewState, eventId: string | null, assessment: any }) {
  const [researchMsgs, setResearchMsgs] = useState<ChatMessage[]>([{
    role: "assistant",
    content: "ASTRONOMY RESEARCH ASSISTANT ONLINE.\n\nModules Loaded: NASA ADS, JPL Horizons, SIMBAD.\n\nHow can I assist your discovery today?"
  }]);
  
  const [eventMsgs, setEventMsgs] = useState<Record<string, ChatMessage[]>>({});
  const [briefings, setBriefings] = useState<Record<string, BriefingResult>>({});
  
  const [globalMsgs, setGlobalMsgs] = useState<ChatMessage[]>([{
    role: "assistant",
    content: "COMMAND CENTER AI ONLINE.\n\nSelect a conjunction or ask an astronomy question."
  }]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view === "event" && eventId && !briefings[eventId]) {
      setLoading(true);
      api.getBriefing(eventId, "analyst").then(r => {
        setBriefings(prev => ({ ...prev, [eventId]: r }));
        setLoading(false);
      }).catch(e => {
        console.error(e);
        setLoading(false);
      });
    }
  }, [view, eventId, briefings]);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [researchMsgs, eventMsgs, globalMsgs, loading, view, eventId]);

  const activeMessages = view === "research" ? researchMsgs 
                       : view === "event" ? (eventId ? (eventMsgs[eventId] || []) : [])
                       : globalMsgs;

  const handleSend = async () => {
    const query = input.trim();
    if (!query || loading) return;

    setInput("");
    setLoading(true);

    if (view === "research") {
      const newMsgs = [...researchMsgs, { role: "user" as const, content: query }];
      setResearchMsgs(newMsgs);
      try {
        const chatApiMsgs = newMsgs.map(m => ({ role: m.role, content: m.content }));
        const result = await api.sendResearchChat(chatApiMsgs);
        setResearchMsgs(prev => [...prev, { role: "assistant", content: result.answer, tool_calls: result.tool_calls, sources: result.sources }]);
      } catch (e: any) {
        setResearchMsgs(prev => [...prev, { role: "assistant", content: "Error connecting to Research API: " + e.message }]);
      }
    } 
    else if (view === "event" && eventId) {
      const current = eventMsgs[eventId] || [];
      const newMsgs = [...current, { role: "user" as const, content: query }];
      setEventMsgs(prev => ({ ...prev, [eventId]: newMsgs }));
      try {
        const r = await api.chat(eventId, query);
        const ans = typeof r.answer === "string" ? r.answer : r.answer ? (r.answer as any).answer : "Analysis complete.";
        setEventMsgs(prev => ({ ...prev, [eventId]: [...prev[eventId]!, { role: "assistant", content: ans }] }));
      } catch (e: any) {
        setEventMsgs(prev => ({ ...prev, [eventId]: [...prev[eventId]!, { role: "assistant", content: "Error: " + e.message }] }));
      }
    }
    else {
      const newMsgs = [...globalMsgs, { role: "user" as const, content: query }];
      setGlobalMsgs(newMsgs);
      setTimeout(() => {
        setGlobalMsgs(prev => [...prev, { role: "assistant", content: "Switch to Event Dashboard to analyze specific conjunctions, or switch to Research mode to query astronomy databases." }]);
        setLoading(false);
      }, 600);
      return;
    }
    setLoading(false);
  };

  const contextTitle = view === "event" && eventId ? `Context: ${eventId}` : view === "research" ? "Context: Astronomy Research" : "Context: Command Center";

  return (
    <div className="persistent-ai">
      
      {/* HEADER */}
      <div className="ai-header">
        <div className="ai-brand">
          CONJUNCTIQ AI
          <div className="status-dot" style={{ width: 6, height: 6 }}></div>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 400 }}>Online</span>
        </div>
        <div className="ai-context">{contextTitle}</div>
      </div>

      {/* CHAT LOG */}
      <div className="ai-scroll" ref={chatLogRef}>
        {view === "event" && eventId && briefings[eventId] && (
          <div className="ai-msg assistant">
            <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px", fontSize: "11px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Situation Briefing</div>
            <div>{(briefings[eventId].content || briefings[eventId].interpretation || "Briefing available.")}</div>
          </div>
        )}
        
        {activeMessages.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", width: "100%", gap: "8px" }}>
            
            <div className={`ai-msg ${m.role}`}>
              {m.content}
            </div>
            
            {m.tool_calls && m.tool_calls.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignSelf: "flex-start" }}>
                {m.tool_calls.map((tc, j) => (
                  <div key={j} className="ai-tool">
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{tc.tool.replace(/_/g, " ").toUpperCase()}</span>
                    <span>{tc.status === "completed" ? "Completed" : tc.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="ai-msg assistant" style={{ fontStyle: "italic", opacity: 0.5 }}>
            Analyzing...
          </div>
        )}
      </div>

      {/* INPUT */}
      <div className="ai-input-area">
        <textarea
          className="ai-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask ConjunctIQ..."
          disabled={loading}
          rows={1}
        />
        <button className="ai-btn" onClick={handleSend} disabled={loading || !input.trim()}>
          SEND
        </button>
      </div>

    </div>
  );
}


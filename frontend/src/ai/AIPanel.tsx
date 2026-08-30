import { useState, useEffect, useRef } from "react";
import { api } from "../api/client";
import type { BriefingResult, ChatResult, ChatResultInner } from "../api/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "Why is this event critical?",
  "What changed?",
  "What information is missing?",
  "What should we investigate next?",
  "Explain this simply.",
];

export default function AIPanel({ eventId }: { eventId: string | null }) {
  const [audience, setAudience] = useState<"operator" | "analyst" | "public">("analyst");
  const [briefing, setBriefing] = useState<BriefingResult | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!eventId) return;
    setBriefingLoading(true);
    setBriefing(null);
    setMessages([]);
    (async () => {
      try {
        const r = await api.getBriefing(eventId, audience);
        setBriefing(r);
      } catch {
        setBriefing(null);
      } finally {
        setBriefingLoading(false);
      }
    })();
  }, [eventId, audience]);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (question?: string) => {
    const q = question ?? chatInput;
    if (!q.trim() || !eventId || chatLoading) return;
    setChatInput("");
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setChatLoading(true);
    try {
      const r = await api.chat(eventId, q);
      // Backend wraps: { question, answer: string|ChatInner, ... }
      // The "answer" field may be a nested object (mock) or a string (granite)
      let answerText: string;
      if (typeof r.answer === "string") {
        answerText = r.answer;
      } else {
        const inner = r.answer as ChatResultInner;
        answerText = inner?.answer ?? inner?.interpretation ?? JSON.stringify(inner);
      }
      setMessages(prev => [...prev, { role: "assistant", content: answerText }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Unable to get AI response. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Derive provider from briefing: "mock", "granite", etc.
  const providerLabel = briefing?.provider?.toUpperCase() ?? briefing?.status?.toUpperCase() ?? "MOCK";
  const isOffline = briefing?.status === "unavailable";

  return (
    <div className="ai-display">
      <div className="ai-header">
        <div>
          <div className="ai-header__title">Analysis Assistant</div>
          <div className="ai-header__model">PROVIDER: {providerLabel}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span className={`ai-status-dot ${isOffline ? "ai-status-dot--offline" : "ai-status-dot--online"}`} />
          <span style={{ fontSize: 9, color: "var(--text-secondary)" }}>
            {isOffline ? "OFFLINE" : "ACTIVE"}
          </span>
        </div>
      </div>

      <div className="ai-audience-selector">
        {(["operator", "analyst", "public"] as const).map(a => (
          <button
            key={a}
            className={`ai-audience-btn ${audience === a ? "ai-audience-btn--active" : ""}`}
            onClick={() => setAudience(a)}
          >
            {a}
          </button>
        ))}
      </div>

      {briefingLoading && <div className="loading-text">Generating briefing…</div>}

      {briefing && !briefingLoading && (
        <>
          <div className="ai-briefing">
            <div style={{ fontWeight: 600, color: "var(--amber)", marginBottom: 6, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Briefing — {audience}
            </div>
            <div>{briefing.observed_facts}</div>
            <div style={{ marginTop: 6 }}>{briefing.calculated_assessment}</div>
            <div style={{ marginTop: 6 }}>{briefing.interpretation}</div>
          </div>

          {briefing.grounding && briefing.grounding.length > 0 && (
            <div className="ai-grounding">
              <span style={{ fontSize: 8, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                Grounding:
              </span>
              {briefing.grounding.map((g, i) => (
                <span key={i} className="ai-grounding-chip">{g}</span>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ borderTop: "1px solid var(--seam)", paddingTop: 6, display: "flex", flexDirection: "column", gap: 6, flex: 1, minHeight: 0 }}>
        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-tertiary)", fontWeight: 600 }}>
          Ask the Assistant
        </div>

        {messages.length > 0 && (
          <div className="ai-chat-log" ref={chatLogRef}>
            {messages.map((m, i) => (
              <div key={i} className={`ai-chat-msg ai-chat-msg--${m.role}`}>
                {m.content}
              </div>
            ))}
            {chatLoading && <div className="loading-text" style={{ padding: 6 }}>Analyzing…</div>}
          </div>
        )}

        <div className="ai-quick-prompts">
          {QUICK_PROMPTS.map((p, i) => (
            <button key={i} className="ai-quick-prompt" onClick={() => handleSend(p)}>
              {p}
            </button>
          ))}
        </div>

        <div className="ai-chat-input">
          <input
            className="ai-chat-input__field"
            type="text"
            placeholder="Ask a question…"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            disabled={!eventId || chatLoading}
          />
          <button className="ai-chat-input__send" onClick={() => handleSend()} disabled={!eventId || chatLoading}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

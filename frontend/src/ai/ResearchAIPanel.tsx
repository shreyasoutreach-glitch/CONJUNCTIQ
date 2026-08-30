import { useState, useRef, useEffect } from "react";
import { HardwareScreen } from "../workstation/HardwareScreen";
import { api } from "../api/client";
import type { ToolInfo, ToolCall, ResearchSource, ResearchChatResult } from "../api/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  tool_calls?: ToolCall[];
  sources?: ResearchSource[];
}

export default function ResearchAIPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "ASTRONOMY RESEARCH ASSISTANT ONLINE.\n\nHow can I assist your discovery today?",
    }
  ]);
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  
  const chatLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getResearchTools().then(res => {
      if (res && res.tools) setTools(res.tools);
    }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages, loading, activeTool]);

  const handleSend = async () => {
    if (!chatInput.trim() || loading) return;

    const userMsg = chatInput.trim();
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setChatInput("");
    setLoading(true);
    setActiveTool("ANALYZING");

    try {
      const chatApiMsgs = newMessages.map(m => ({ role: m.role, content: m.content }));
      const result: ResearchChatResult = await api.sendResearchChat(chatApiMsgs);

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: result.answer,
          tool_calls: result.tool_calls,
          sources: result.sources
        }
      ]);
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "I encountered an error connecting to the Research API: " + e.message,
          tool_calls: [{ tool: "system", status: "error", message: e.message }]
        }
      ]);
    } finally {
      setLoading(false);
      setActiveTool(null);
    }
  };

  const getToolStatus = (toolName: string) => {
    if (!loading) return "READY";
    
    // Simplistic animation/status during loading (since we can't stream real tool execution yet without websockets)
    // We just show ACTIVE generically, or we can check the last tool call if streaming was implemented.
    // For now, if loading is true, we just say IDLE unless activeTool is set.
    // Since the backend doesn't stream intermediate steps, we animate a generic "EXECUTING".
    if (toolName === activeTool) return "EXECUTING...";
    return "IDLE";
  };

  return (
    <div style={{ height: "100%", width: "100%", padding: "20px", boxSizing: "border-box" }}>
      <HardwareScreen title="ASTRONOMY RESEARCH TERMINAL" className="analysis-screen"><div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        
        {/* TOP STATUS BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 20px", borderBottom: "1px solid var(--seam)", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--cyan)", fontWeight: "bold", background: "#051515" }}>
          <span>RESEARCH AI</span>
          <span>SYSTEM: {loading ? "PROCESSING" : "ONLINE"}</span>
        </div>

        {/* CONVERSATION AREA */}
        <div className="ai-chat-log" ref={chatLogRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div className={`ai-chat-msg ${m.role === "user" ? "ai-chat-msg--operator" : "ai-chat-msg--assistant"}`} style={{ whiteSpace: "pre-wrap", fontSize: "14px", padding: "16px", lineHeight: "1.5", maxWidth: "80%" }}>
                {m.content}
              </div>
              
              {/* Tool Execution History embedded in chat if any */}
              {m.tool_calls && m.tool_calls.length > 0 && (
                <div style={{ alignSelf: "flex-start", marginTop: "10px", marginLeft: "8px", padding: "12px", border: "1px solid var(--seam-light)", background: "var(--bg-recessed)", fontSize: "11px", fontFamily: "var(--font-mono)", maxWidth: "80%", width: "100%" }}>
                  <div style={{ color: "var(--gold)", fontWeight: "bold", marginBottom: "8px" }}>? TOOL EXECUTION HISTORY</div>
                  {m.tool_calls.map((tc, j) => (
                    <div key={j} style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: j < m.tool_calls!.length - 1 ? "1px dashed var(--seam)" : "none" }}>
                      <div style={{ color: "var(--cyan)", fontWeight: "bold" }}>{tc.tool.toUpperCase()}</div>
                      {tc.input && (
                        <div style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
                          {Object.entries(tc.input).map(([k, v]) => (
                            <div key={k}>{k}: {v}</div>
                          ))}
                        </div>
                      )}
                      <div style={{ color: tc.status === "error" ? "var(--red)" : "var(--green)", marginTop: "4px" }}>
                        STATUS: {tc.status.toUpperCase()}
                      </div>
                      {tc.message && (
                        <div style={{ color: "var(--red)", marginTop: "4px" }}>{tc.message}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Sources */}
              {m.sources && m.sources.length > 0 && (
                <div style={{ alignSelf: "flex-start", marginTop: "10px", marginLeft: "8px", padding: "12px", border: "1px solid var(--seam)", background: "#050505", fontSize: "11px", fontFamily: "var(--font-mono)", maxWidth: "80%" }}>
                  <div style={{ color: "var(--cyan)", fontWeight: "bold", marginBottom: "8px" }}>SOURCES</div>
                  {m.sources.map((s, idx) => (
                    <div key={idx} style={{ marginBottom: "6px" }}>
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "var(--cyan-dim)", textDecoration: "underline" }}>{s.name}</a>
                      ) : (
                        <span style={{ color: "var(--text-secondary)" }}>{s.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="ai-chat-msg ai-chat-msg--assistant" style={{ alignSelf: "flex-start", fontStyle: "italic", opacity: 0.7, padding: "16px" }}>
              Executing reasoning cycle...
            </div>
          )}
        </div>

        {/* TOOL EXECUTION PANEL (BOTTOM) */}
        <div style={{ borderTop: "1px solid var(--seam)", background: "var(--bg-recessed)", padding: "16px", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
          <div style={{ color: "var(--gold)", fontWeight: "bold", marginBottom: "12px" }}>TOOL EXECUTION</div>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            {tools.length === 0 ? (
              <div style={{ color: "var(--text-tertiary)" }}>No tools registered.</div>
            ) : (
              tools.map(t => {
                const status = getToolStatus(t.name);
                const isActive = status !== "IDLE" && status !== "READY";
                return (
                  <div key={t.name} style={{ display: "flex", gap: "10px", alignItems: "center", minWidth: "200px" }}>
                    <span className={`led ${isActive ? "led--green led--pulse" : "led--dim"}`}></span>
                    <span style={{ color: isActive ? "var(--text-primary)" : "var(--text-secondary)", width: "120px" }}>{t.name.replace("query_", "").toUpperCase()}</span>
                    <span style={{ color: isActive ? "var(--green)" : "var(--text-tertiary)" }}>{status}</span>
                  </div>
                );
              })
            )}
            {!tools.find(t => t.name === "run_orbital_simulation") && (
              <div style={{ display: "flex", gap: "10px", alignItems: "center", minWidth: "200px" }}>
                <span className={`led ${loading ? "led--green led--pulse" : "led--active"}`}></span>
                <span style={{ color: loading ? "var(--text-primary)" : "var(--text-secondary)", width: "120px" }}>SIMULATION</span>
                <span style={{ color: loading ? "var(--green)" : "var(--text-tertiary)" }}>{loading ? "EXECUTING..." : "READY"}</span>
              </div>
            )}
          </div>
        </div>

        {/* INPUT AREA */}
        <div style={{ display: "flex", padding: "16px", borderTop: "1px solid var(--seam)", background: "#000" }}>
          <input
            className="ai-chat-input__field"
            style={{ fontSize: "14px", padding: "14px", flex: 1, fontFamily: "var(--font-mono)", background: "transparent", border: "none", color: "var(--text-primary)", outline: "none" }}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="ASK ASTRONOMY..."
            disabled={loading}
          />
          <button className="ai-chat-input__send" onClick={handleSend} style={{ fontSize: "14px", padding: "0 30px", border: "1px solid var(--cyan)", background: "rgba(0, 229, 255, 0.1)", color: "var(--cyan)", cursor: "pointer" }} disabled={loading}>
            [SEND]
          </button>
        </div>

      </div></HardwareScreen>
    </div>
  );
}


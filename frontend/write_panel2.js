import fs from 'fs';

const content = `import { useState, useRef, useEffect } from "react";
import { HardwareScreen } from "../workstation/HardwareScreen";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ResearchAIPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "ASTRONOMY RESEARCH ASSISTANT ONLINE.\\n\\nModules Loaded:\\n- NASA Astrophysics Data System (ADS)\\n- JPL Horizons Ephemerides\\n- CDS SIMBAD Database\\n\\nHow can I assist your discovery today?",
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!chatInput.trim() || loading) return;

    const userMsg = chatInput.trim();
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setLoading(true);

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: \`[TOOL EXECUTION: query_nasa_ads]\\nSearching for: "\${userMsg}"\\n\\n[RESULT]\\nThis functionality is currently pending backend implementation as per the Research API Proposition.\\nOnce implemented, the API will stream real literature, ephemerides, and astronomy data here.\`,
        }
      ]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="cockpit-event-dashboard" style={{ flexDirection: "row", gap: "20px", height: "100%", width: "100%", overflow: "hidden" }}>
      <div className="dashboard-col" style={{ flex: "0 0 350px", overflow: "hidden" }}>
        <HardwareScreen title="RESEARCH SYSTEMS" className="analysis-screen">
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>
            <div style={{ color: "var(--cyan)", fontWeight: "bold", borderBottom: "1px solid var(--seam)", paddingBottom: "4px" }}>AVAILABLE TOOLS</div>
            
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span className="led led--active"></span>
              <span>NASA ADS API</span>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span className="led led--active"></span>
              <span>JPL Horizons</span>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span className="led led--active"></span>
              <span>SIMBAD Database</span>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span className="led led--active"></span>
              <span>Physics Simulator</span>
            </div>

            <div style={{ marginTop: "20px", color: "var(--gold)", fontWeight: "bold", borderBottom: "1px solid var(--seam)", paddingBottom: "4px" }}>STATUS</div>
            <div style={{ color: "var(--green)" }}>ALL SYSTEMS NOMINAL</div>
            <div>Awaiting backend router deployment.</div>
          </div>
        </HardwareScreen>
      </div>

      <div className="dashboard-col" style={{ flex: 1, overflow: "hidden" }}>
        <HardwareScreen title="ASTRONOMY DISCOVERY CHAT" className="analysis-screen">
          <div className="ai-display" style={{ padding: "16px", height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div className="ai-chat-log" ref={chatLogRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {messages.map((m, i) => (
                <div key={i} className={\`ai-chat-msg \${m.role === "user" ? "ai-chat-msg--operator" : "ai-chat-msg--assistant"}\`} style={{ whiteSpace: "pre-wrap", fontSize: "12px", padding: "10px", lineHeight: "1.4" }}>
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="ai-chat-msg ai-chat-msg--assistant" style={{ fontStyle: "italic", opacity: 0.7 }}>
                  Accessing research databases...
                </div>
              )}
            </div>
            <div className="ai-chat-input" style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
              <input
                className="ai-chat-input__field"
                style={{ fontSize: "12px", padding: "10px", flex: 1 }}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about orbital decay, exoplanets, or recent publications..."
              />
              <button className="ai-chat-input__send" onClick={handleSend} style={{ fontSize: "12px", padding: "0 20px" }}>
                EXECUTE QUERY
              </button>
            </div>
          </div>
        </HardwareScreen>
      </div>
    </div>
  );
}`;

fs.writeFileSync('src/ai/ResearchAIPanel.tsx', content);

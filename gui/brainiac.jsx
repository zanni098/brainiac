import { useState, useRef, useEffect } from "react";

// Default configuration - can be overridden by users
const DEFAULT_CONFIG = {
  apiUrl: "https://api.anthropic.com/v1/messages",
  apiKey: "",
  model: "claude-sonnet-4-20250514",
  maxTokens: 4096,
  provider: "anthropic",
  systemPrompt: `You are a research analyst. For every query you MUST:
1. Search Wikipedia for background and context
2. Search Open Library (openlibrary.org) for relevant books
3. Search for recent news articles (last 12 months)
4. Search academic sources when relevant
5. Provide data and statistics when available

Then write a structured report using EXACTLY these headers:
## [Descriptive title for this report]
### Executive Summary
### Background & Context
### Recent Developments
### Key Findings & Data
### Expert Perspectives
### Books & Academic Sources
### Critical Analysis
### Implications & Future Outlook
### References

Rules:
- Cite inline as [1][2][3] using superscript numbers
- References section: numbered list, include full URLs and publication dates
- Each section minimum 5-7 sentences
- Be specific, analytical, and cite everything
- Include statistics, data points, and expert quotes when available
- Provide balanced perspectives on controversial topics
- Highlight knowledge gaps and areas requiring further research`,
  headers: {
    "Content-Type": "application/json",
  }
};

// API provider adapters
const API_ADAPTERS = {
  anthropic: {
    formatRequest: (config, query) => ({
      model: config.model,
      max_tokens: config.maxTokens,
      system: config.systemPrompt,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: `Research this thoroughly: "${query}"\n\nSearch Wikipedia, Open Library, recent news, and academic sources. Write a complete cited report with data, statistics, and expert perspectives.` }],
      stream: true
    }),
    formatHeaders: (config, apiKey) => ({
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    }),
    parseStream: (line) => {
      if (!line.startsWith("data: ")) return null;
      const data = line.slice(6);
      if (data === "[DONE]") return null;
      try {
        const evt = JSON.parse(data);
        if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
          return { type: "text", text: evt.delta.text };
        }
        if (evt.type === "content_block_start" && evt.content_block?.type === "tool_use") {
          return { type: "search" };
        }
      } catch {}
      return null;
    }
  },
  openai: {
    formatRequest: (config, query) => ({
      model: config.model,
      max_tokens: config.maxTokens,
      messages: [
        { role: "system", content: config.systemPrompt },
        { role: "user", content: `Research this thoroughly: "${query}"\n\nSearch Wikipedia, Open Library, recent news, and academic sources. Write a complete cited report with data, statistics, and expert perspectives.` }
      ],
      stream: true
    }),
    formatHeaders: (config, apiKey) => ({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    }),
    parseStream: (line) => {
      if (!line.startsWith("data: ")) return null;
      const data = line.slice(6);
      if (data === "[DONE]") return null;
      try {
        const evt = JSON.parse(data);
        if (evt.choices?.[0]?.delta?.content) {
          return { type: "text", text: evt.choices[0].delta.content };
        }
      } catch {}
      return null;
    }
  },
  custom: {
    formatRequest: (config, query) => ({
      model: config.model,
      max_tokens: config.maxTokens,
      system: config.systemPrompt,
      messages: [{ role: "user", content: `Research this thoroughly: "${query}"\n\nSearch Wikipedia, Open Library, recent news, and academic sources. Write a complete cited report with data, statistics, and expert perspectives.` }],
      stream: true
    }),
    formatHeaders: (config, apiKey) => ({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      ...config.headers
    }),
    parseStream: (line) => {
      if (!line.startsWith("data: ")) return null;
      const data = line.slice(6);
      if (data === "[DONE]") return null;
      try {
        const evt = JSON.parse(data);
        if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
          return { type: "text", text: evt.delta.text };
        }
        if (evt.delta?.content) {
          return { type: "text", text: evt.delta.content };
        }
      } catch {}
      return null;
    }
  }
};

async function runResearch(query, config, onChunk) {
  const adapter = API_ADAPTERS[config.provider] || API_ADAPTERS.custom;
  const body = adapter.formatRequest(config, query);
  const headers = adapter.formatHeaders(config, config.apiKey);

  const r = await fetch(config.apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error?.message || e.message || `HTTP ${r.status}`);
  }

  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let searchCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      const parsed = adapter.parseStream(line);
      if (parsed) {
        if (parsed.type === "text") {
          fullText += parsed.text;
          onChunk({ text: fullText, searches: searchCount });
        } else if (parsed.type === "search") {
          searchCount++;
          onChunk({ text: fullText, searches: searchCount });
        }
      }
    }
  }
  return { text: fullText, searches: searchCount };
}

function CitedText({ text }) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <span>
      {parts.map((p, i) =>
        /^\[\d+\]$/.test(p)
          ? <sup key={i} style={{ color: "#c9a84c", fontSize: "0.68em", fontFamily: "monospace", marginLeft: "1px" }}>{p}</sup>
          : <span key={i}>{p}</span>
      )}
    </span>
  );
}

function ReportView({ raw }) {
  const lines = raw.split("\n");
  const els = [];
  let key = 0;
  let inRefs = false;
  let refBuf = [];

  function flushRefs() {
    if (!refBuf.length) return;
    els.push(
      <ol key={key++} style={{ margin: "0.5rem 0 0", paddingLeft: "1.4rem" }}>
        {refBuf.map((ref, i) => (
          <li key={i} style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "#5a5248", lineHeight: 1.7, marginBottom: "0.2rem" }}>
            <CitedText text={ref} />
          </li>
        ))}
      </ol>
    );
    refBuf = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { key++; continue; }

    if (line.startsWith("## ")) {
      flushRefs(); inRefs = false;
      els.push(
        <h2 key={key++} style={{ fontFamily: "'Georgia','Times New Roman',serif", fontSize: "1.6rem", fontWeight: 400, color: "#f0ece2", lineHeight: 1.2, margin: "0 0 1.5rem", paddingBottom: "1.25rem", borderBottom: "1px solid #2a2620" }}>
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      flushRefs();
      const heading = line.slice(4).trim();
      inRefs = heading.toLowerCase() === "references";
      els.push(
        <h3 key={key++} style={{ fontFamily: "monospace", fontSize: "0.65rem", letterSpacing: ".14em", textTransform: "uppercase", color: "#c9a84c", margin: "2rem 0 0.65rem" }}>
          {heading}
        </h3>
      );
    } else if (inRefs && /^\d+\./.test(trimmed)) {
      refBuf.push(trimmed);
    } else if (!inRefs) {
      els.push(
        <p key={key++} style={{ fontFamily: "'Georgia','Times New Roman',serif", fontSize: "0.97rem", color: "#c0b8ac", lineHeight: 1.85, margin: "0 0 0.75rem" }}>
          <CitedText text={trimmed} />
        </p>
      );
    }
  }
  flushRefs();
  return <div style={{ animation: "fadeIn .4s ease" }}>{els}</div>;
}

const EXAMPLES = [
  "Quantum computing and cryptography",
  "History of the internet",
  "CRISPR gene editing ethics",
  "Rise of AI in creative industries",
  "Climate tipping points",
  "Neural interface technology",
  "Space exploration economics"
];

export default function Brainiac() {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState("idle");
  const [report, setReport] = useState("");
  const [searches, setSearches] = useState(0);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("brainiac-history");
    return saved ? JSON.parse(saved) : [];
  });
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem("brainiac-config");
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  const reportRef = useRef(null);

  useEffect(() => {
    if (report && reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [!!report]);

  useEffect(() => {
    localStorage.setItem("brainiac-config", JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem("brainiac-history", JSON.stringify(history));
  }, [history]);

  async function handleSearch() {
    const q = query.trim();
    if (!q || phase === "running") return;
    
    if (!config.apiKey) {
      setError("Please configure your API key in settings first.");
      setPhase("error");
      return;
    }
    
    setPhase("running");
    setReport("");
    setError("");
    setSearches(0);

    try {
      const result = await runResearch(q, config, ({ text, searches: s }) => {
        setReport(text);
        setSearches(s);
      });
      
      // Save to history
      const historyItem = {
        id: Date.now(),
        query: q,
        report: result.text,
        searches: result.searches,
        timestamp: new Date().toISOString()
      };
      setHistory(prev => [historyItem, ...prev].slice(0, 50)); // Keep last 50
      
      setPhase("done");
    } catch (e) {
      setError(e.message);
      setPhase("error");
    }
  }

  function handleKey(e) { if (e.key === "Enter") handleSearch(); }

  function exportReport(format) {
    if (!report) return;
    
    let content, filename, type;
    
    if (format === "markdown") {
      content = report;
      filename = `brainiac-report-${Date.now()}.md`;
      type = "text/markdown";
    } else if (format === "txt") {
      content = report;
      filename = `brainiac-report-${Date.now()}.txt`;
      type = "text/plain";
    } else if (format === "json") {
      content = JSON.stringify({ query, report, searches, timestamp: new Date().toISOString() }, null, 2);
      filename = `brainiac-report-${Date.now()}.json`;
      type = "application/json";
    }
    
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadFromHistory(item) {
    setQuery(item.query);
    setReport(item.report);
    setSearches(item.searches);
    setPhase("done");
    setShowHistory(false);
  }

  function clearHistory() {
    setHistory([]);
    setShowHistory(false);
  }

  const busy = phase === "running";
  const hasReport = report.length > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0e0c0a", color: "#c8c0b4", fontFamily: "Georgia,serif" }}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}
        .si::placeholder{color:#3d3830}
        .si:focus{outline:none;border-color:#c9a84c!important}
        .ex:hover{color:#c9a84c!important;border-color:#c9a84c50!important}
        .rb:hover:not(:disabled){background:#c9a84c!important;color:#0e0c0a!important}
        .rb:disabled{opacity:.35;cursor:not-allowed}
        .sb:hover{color:#c9a84c!important}
        .hb:hover{color:#c9a84c!important;border-color:#c9a84c50!important}
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>

        <div style={{ marginBottom: "2.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "inline-block", width: 5, height: 5, background: "#c9a84c", borderRadius: "50%" }} />
              <span style={{ fontFamily: "monospace", fontSize: "0.62rem", letterSpacing: ".16em", textTransform: "uppercase", color: "#3d3830" }}>
                Brainiac · Advanced Research Agent
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="hb"
                style={{ background: "transparent", border: "1px solid #2a2620", color: "#3d3830", borderRadius: 4, padding: "4px 12px", fontFamily: "monospace", fontSize: ".65rem", cursor: "pointer", transition: "all .15s" }}
              >
                📚 HISTORY ({history.length})
              </button>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="sb"
                style={{ background: "transparent", border: "1px solid #2a2620", color: "#3d3830", borderRadius: 4, padding: "4px 12px", fontFamily: "monospace", fontSize: ".65rem", cursor: "pointer", transition: "all .15s" }}
              >
                ⚙️ SETTINGS
              </button>
            </div>
          </div>
          <h1 style={{ fontFamily: "Georgia,'Times New Roman',serif", fontSize: "2.2rem", fontWeight: 400, color: "#f0ece2", margin: 0, lineHeight: 1.15 }}>
            Deep research,<br />cited sources,<br />actionable insights.
          </h1>
        </div>

        {showHistory && (
          <div style={{ padding: "1.5rem", background: "#111009", border: "1px solid #2a2620", borderRadius: 6, marginBottom: "2rem", animation: "fadeIn .3s ease", maxHeight: "400px", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontFamily: "monospace", fontSize: "0.7rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#c9a84c", margin: 0 }}>
                Research History
              </h3>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  style={{ background: "transparent", border: "1px solid #4a1e1e", color: "#c05050", borderRadius: 4, padding: "4px 12px", fontFamily: "monospace", fontSize: ".65rem", cursor: "pointer" }}
                >
                  CLEAR ALL
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p style={{ fontFamily: "monospace", fontSize: ".7rem", color: "#5a5248" }}>No research history yet.</p>
            ) : (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {history.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    style={{ padding: "0.75rem", background: "#161410", border: "1px solid #2a2620", borderRadius: 4, cursor: "pointer", transition: "all .15s" }}
                  >
                    <div style={{ fontFamily: "Georgia,serif", fontSize: ".9rem", color: "#c0b8ac", marginBottom: "0.25rem" }}>{item.query}</div>
                    <div style={{ fontFamily: "monospace", fontSize: ".65rem", color: "#5a5248" }}>
                      {new Date(item.timestamp).toLocaleString()} · {item.searches} sources
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showSettings && (
          <div style={{ padding: "1.5rem", background: "#111009", border: "1px solid #2a2620", borderRadius: 6, marginBottom: "2rem", animation: "fadeIn .3s ease" }}>
            <h3 style={{ fontFamily: "monospace", fontSize: "0.7rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#c9a84c", margin: "0 0 1rem" }}>
              API Configuration
            </h3>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontFamily: "monospace", fontSize: ".65rem", color: "#5a5248", marginBottom: ".4rem" }}>Provider</label>
                <select
                  value={config.provider}
                  onChange={e => setConfig({ ...config, provider: e.target.value })}
                  style={{ width: "100%", background: "#161410", border: "1px solid #2a2620", borderRadius: 4, padding: ".6rem", fontFamily: "monospace", fontSize: ".7rem", color: "#f0ece2" }}
                >
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="openai">OpenAI (GPT)</option>
                  <option value="custom">Custom API</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "monospace", fontSize: ".65rem", color: "#5a5248", marginBottom: ".4rem" }}>API URL</label>
                <input
                  type="text"
                  value={config.apiUrl}
                  onChange={e => setConfig({ ...config, apiUrl: e.target.value })}
                  placeholder="https://api.example.com/v1/chat"
                  style={{ width: "100%", background: "#161410", border: "1px solid #2a2620", borderRadius: 4, padding: ".6rem", fontFamily: "monospace", fontSize: ".7rem", color: "#f0ece2" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "monospace", fontSize: ".65rem", color: "#5a5248", marginBottom: ".4rem" }}>API Key</label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="sk-..."
                  style={{ width: "100%", background: "#161410", border: "1px solid #2a2620", borderRadius: 4, padding: ".6rem", fontFamily: "monospace", fontSize: ".7rem", color: "#f0ece2" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "monospace", fontSize: ".65rem", color: "#5a5248", marginBottom: ".4rem" }}>Model</label>
                <input
                  type="text"
                  value={config.model}
                  onChange={e => setConfig({ ...config, model: e.target.value })}
                  placeholder="claude-sonnet-4-20250514"
                  style={{ width: "100%", background: "#161410", border: "1px solid #2a2620", borderRadius: 4, padding: ".6rem", fontFamily: "monospace", fontSize: ".7rem", color: "#f0ece2" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "monospace", fontSize: ".65rem", color: "#5a5248", marginBottom: ".4rem" }}>Max Tokens</label>
                <input
                  type="number"
                  value={config.maxTokens}
                  onChange={e => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                  style={{ width: "100%", background: "#161410", border: "1px solid #2a2620", borderRadius: 4, padding: ".6rem", fontFamily: "monospace", fontSize: ".7rem", color: "#f0ece2" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "monospace", fontSize: ".65rem", color: "#5a5248", marginBottom: ".4rem" }}>System Prompt (Optional)</label>
                <textarea
                  value={config.systemPrompt}
                  onChange={e => setConfig({ ...config, systemPrompt: e.target.value })}
                  rows={6}
                  style={{ width: "100%", background: "#161410", border: "1px solid #2a2620", borderRadius: 4, padding: ".6rem", fontFamily: "monospace", fontSize: ".7rem", color: "#f0ece2", resize: "vertical" }}
                />
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: "0.75rem" }}>
            <input
              className="si"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              disabled={busy}
              placeholder="Enter a topic to research..."
              style={{
                flex: 1, background: "#161410", border: "1px solid #2a2620",
                borderRadius: 6, padding: ".7rem 1rem",
                fontFamily: "Georgia,serif", fontSize: ".95rem",
                color: "#f0ece2", transition: "border-color .2s"
              }}
            />
            <button
              className="rb"
              onClick={handleSearch}
              disabled={busy || !query.trim()}
              style={{
                background: "transparent", border: "1px solid #c9a84c",
                color: "#c9a84c", borderRadius: 6, padding: "0 1.4rem",
                fontFamily: "monospace", fontSize: ".72rem",
                letterSpacing: ".08em", cursor: "pointer", transition: "all .15s"
              }}>{busy ? "RESEARCHING..." : "RESEARCH →"}</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {EXAMPLES.map(ex => (
              <button key={ex} className="ex" onClick={() => setQuery(ex)} disabled={busy}
                style={{
                  background: "transparent", border: "1px solid #1e1c18",
                  color: "#3d3830", borderRadius: 4, padding: "3px 10px",
                  fontFamily: "monospace", fontSize: ".63rem",
                  cursor: "pointer", transition: "all .15s"
                }}>{ex}</button>
            ))}
          </div>
        </div>

        {busy && (
          <div style={{ padding: "1rem 1.25rem", background: "#111009", border: "1px solid #2a2620", borderRadius: 6, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1.25rem", animation: "fadeIn .3s ease" }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ display: "inline-block", width: 5, height: 5, background: "#c9a84c", borderRadius: "50%", animation: `pulse 1.2s ${i * .2}s infinite` }} />
              ))}
            </div>
            <span style={{ fontFamily: "monospace", fontSize: ".7rem", color: "#5a5248" }}>
              {searches > 0 ? `${searches} source${searches > 1 ? "s" : ""} searched` : "Initializing research..."}
            </span>
            {hasReport && (
              <span style={{ fontFamily: "monospace", fontSize: ".7rem", color: "#3a3830", marginLeft: "auto" }}>
                synthesizing report...
              </span>
            )}
          </div>
        )}

        {error && (
          <div style={{ padding: "1rem 1.25rem", background: "#150d0d", border: "1px solid #4a1e1e", borderRadius: 6, color: "#c05050", fontFamily: "monospace", fontSize: ".78rem", marginBottom: "1.5rem" }}>
            {error}
          </div>
        )}

        {hasReport && (
          <>
            <div ref={reportRef} style={{ padding: "2rem 2.25rem", background: "#100f0d", border: "1px solid #2a2620", borderRadius: 8 }}>
              <ReportView raw={report} />
              {busy && (
                <span style={{ display: "inline-block", width: 2, height: "1.1em", background: "#c9a84c", marginLeft: 3, verticalAlign: "middle", animation: "blink 1s infinite" }} />
              )}
            </div>
            
            {phase === "done" && (
              <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => exportReport("markdown")}
                    style={{
                      background: "transparent", border: "1px solid #2a2620", color: "#3d3830",
                      borderRadius: 4, padding: "5px 14px", fontFamily: "monospace",
                      fontSize: ".65rem", cursor: "pointer", letterSpacing: ".06em"
                    }}
                  >EXPORT MD</button>
                  <button
                    onClick={() => exportReport("txt")}
                    style={{
                      background: "transparent", border: "1px solid #2a2620", color: "#3d3830",
                      borderRadius: 4, padding: "5px 14px", fontFamily: "monospace",
                      fontSize: ".65rem", cursor: "pointer", letterSpacing: ".06em"
                    }}
                  >EXPORT TXT</button>
                  <button
                    onClick={() => exportReport("json")}
                    style={{
                      background: "transparent", border: "1px solid #2a2620", color: "#3d3830",
                      borderRadius: 4, padding: "5px 14px", fontFamily: "monospace",
                      fontSize: ".65rem", cursor: "pointer", letterSpacing: ".06em"
                    }}
                  >EXPORT JSON</button>
                </div>
                <button
                  onClick={() => { setReport(""); setPhase("idle"); setQuery(""); }}
                  style={{
                    background: "transparent", border: "1px solid #2a2620", color: "#3d3830",
                    borderRadius: 4, padding: "5px 14px", fontFamily: "monospace",
                    fontSize: ".65rem", cursor: "pointer", letterSpacing: ".06em"
                  }}
                >NEW RESEARCH</button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
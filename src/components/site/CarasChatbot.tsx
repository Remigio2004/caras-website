// src/components/site/CarasChatbot.tsx
import React, { useState, useEffect, FormEvent } from "react";
import carasLogo from "@/assets/caras-logo.png";

const CHAIN_DESK_QUERY_URL = import.meta.env.VITE_CHAIN_DESK_QUERY_URL;
const CHAIN_DESK_API_KEY = import.meta.env.VITE_CHAIN_DESK_API_KEY;

type Message = {
  id: string;
  from: "user" | "bot";
  text: string;
};

const SUGGESTED_QUESTIONS = [
  "What is CARAS and what do you do?",
  "How can I join as an altar server?",
  "What are the qualifications and age requirements?",
  "Where is your parish located?",
];

const generateId = () => Math.random().toString(36).slice(2);

// Shared font for the whole chatbot
const CHAT_FONT_FAMILY =
  '"Playfair Display", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

// ---------- Utility function ----------
function cleanAnswer(text: string): string {
  return text.trim();
}

function markdownToHtml(md: string): string {
  if (!md) return "";

  // Remove markdown headings (###, ##, #)
  let cleaned = md.replace(/^#{1,6}\s*/gm, "");

  // Convert **bold**
  let html = cleaned.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  const lines = html.split("\n");
  const out: string[] = [];
  let inList = false;

  for (let line of lines) {
    line = line.trim();
    if (!line) {
      if (inList) {
        inList = false;
        out.push("</ul>");
      }
      out.push("<br/>");
      continue;
    }

    // Bullet points: "- "
    if (line.startsWith("- ")) {
      if (!inList) {
        inList = true;
        out.push('<ul style="margin:4px 0 4px 18px; padding:0;">');
      }
      out.push(`<li>${line.slice(2)}</li>`);
      continue;
    }

    // Numbered list "1. text"
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      if (inList) {
        inList = false;
        out.push("</ul>");
      }
      out.push(`<p style="margin:4px 0;">${numberedMatch[0]}</p>`);
      continue;
    }

    if (inList) {
      inList = false;
      out.push("</ul>");
    }

    const sentences = line.split(/(?<=[.?!])\s+/);
    sentences.forEach((s) => {
      if (s.trim()) out.push(`<p style="margin:4px 0;">${s.trim()}</p>`);
    });
  }

  if (inList) out.push("</ul>");

  return out.join("");
}

// ---------- API call ----------
async function askChaindesk(
  query: string,
  conversationId: string,
  visitorId: string
): Promise<string | null> {
  const res = await fetch(CHAIN_DESK_QUERY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CHAIN_DESK_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      conversationId,
      visitorId,
      streaming: false,
    }),
  });

  if (!res.ok) {
    console.error("Chaindesk error", await res.text());
    return null;
  }

  const data = await res.json();
  const rawAnswer = (data as any).answer ?? (data as any).text ?? "";
  const cleaned = cleanAnswer(rawAnswer);
  const html = markdownToHtml(cleaned);
  return html || null;
}

// ---------- Component ----------
const CarasChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [conversationId] = useState(() => generateId());
  const [visitorId] = useState(() => generateId());

  useEffect(() => {
    if (!isOpen && messages.length === 0) {
      setMessages([
        {
          id: generateId(),
          from: "bot",
          text: "Hello! I am the CARAS Assistant. How can I help you today?",
        },
      ]);
    }
  }, [isOpen, messages.length]);

  const handleToggle = () => setIsOpen((prev) => !prev);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      from: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const answer = await askChaindesk(trimmed, conversationId, visitorId);
      const botMessage: Message = {
        id: generateId(),
        from: "bot",
        text: answer || "Sorry, I could not understand that.",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          from: "bot",
          text: "There was a problem contacting the assistant.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={handleToggle}
        style={bubbleStyle}
        className="flex justify-center items-center hover:scale-105 hover:shadow-xl"
      >
        <img src={carasLogo} alt="CARAS" className="w-[45px] h-[45px]" />
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div style={panelStyle}>
          <div style={headerStyle}>
            <span>CARAS Assistant</span>
            <button onClick={handleToggle} style={closeButtonStyle}>
              ×
            </button>
          </div>

          <div style={messagesContainerStyle}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={m.from === "user" ? userMessageStyle : botMessageStyle}
              >
                {m.from === "bot" ? (
                  <div
                    style={{
                      whiteSpace: "pre-wrap",
                      fontSize: 12,
                      lineHeight: 1.5,
                      fontFamily: CHAT_FONT_FAMILY,
                    }}
                    dangerouslySetInnerHTML={{ __html: m.text }}
                  />
                ) : (
                  m.text
                )}
              </div>
            ))}
            {isLoading && <div style={botMessageStyle}>Thinking…</div>}

            {/* Suggested questions now inside the scroll area */}
            <div style={suggestionsContainerStyle}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  style={suggestionButtonStyle}
                  onClick={() => setInput(q)}
                  className="hover:bg-yellow-100 hover:scale-[1.02]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={formStyle}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question…"
              style={inputStyle}
            />
            <button
              type="submit"
              style={sendButtonStyle}
              disabled={isLoading}
              className="hover:bg-yellow-700 hover:scale-105 disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default CarasChatbot;

// ---------- Inline styles ----------
const bubbleStyle: React.CSSProperties = {
  position: "fixed",
  bottom: "24px",
  right: "24px",
  width: "55px",
  height: "55px",
  borderRadius: "100%",
  border: "none",
  backgroundColor: "#c9a04f",
  color: "#ffffff",
  fontWeight: 600,
  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.25)",
  cursor: "pointer",
  zIndex: 9999,
  transition:
    "transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease",
  fontFamily: CHAT_FONT_FAMILY,
};

const panelStyle: React.CSSProperties = {
  position: "fixed",
  bottom: "100px",
  right: "24px",
  width: "360px",
  maxHeight: "450px",
  backgroundColor: "#fdfdfd",
  borderRadius: "16px",
  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.25)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  zIndex: 9999,
  fontFamily: CHAT_FONT_FAMILY,
};

const headerStyle: React.CSSProperties = {
  padding: "12px 16px",
  backgroundColor: "#12312b",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontWeight: 600,
  fontFamily: CHAT_FONT_FAMILY,
};

const closeButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#ffffff",
  fontSize: "18px",
  cursor: "pointer",
  fontFamily: CHAT_FONT_FAMILY,
};

const suggestionsContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  gap: "8px",
  padding: "8px 12px",
  overflowX: "auto",
  fontSize: "12px",
  backgroundColor: "#faf7f2",
  fontFamily: CHAT_FONT_FAMILY,
};

const suggestionButtonStyle: React.CSSProperties = {
  flex: "0 0 auto",
  borderRadius: "999px",
  border: "1px solid #d0c7b3",
  padding: "6px 12px",
  fontSize: "12px",
  backgroundColor: "#ffffff",
  cursor: "pointer",
  color: "#12312b",
  transition: "background-color 0.15s ease, transform 0.15s ease",
  whiteSpace: "nowrap",
  fontFamily: CHAT_FONT_FAMILY,
};

const messagesContainerStyle: React.CSSProperties = {
  padding: "12px",
  flex: 1,
  overflowY: "auto",
  backgroundColor: "#f7f5f1",
  fontFamily: CHAT_FONT_FAMILY,
};

const baseMessageStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "12px",
  marginBottom: "8px",
  fontSize: "12px",
  lineHeight: 1.4,
  maxWidth: "90%",
  fontFamily: CHAT_FONT_FAMILY,
};

const userMessageStyle: React.CSSProperties = {
  ...baseMessageStyle,
  marginLeft: "auto",
  backgroundColor: "#ffffff",
  border: "1px solid #e0dccf",
};

const botMessageStyle: React.CSSProperties = {
  ...baseMessageStyle,
  marginRight: "auto",
  backgroundColor: "#e6f0ec",
};

const formStyle: React.CSSProperties = {
  display: "flex",
  borderTop: "1px solid #e0dccf",
  padding: "8px",
  gap: "8px",
  fontFamily: CHAT_FONT_FAMILY,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  borderRadius: "999px",
  border: "1px solid #d0c7b3",
  padding: "8px 12px",
  outline: "none",
  fontSize: "12px",
  fontFamily: CHAT_FONT_FAMILY,
};

const sendButtonStyle: React.CSSProperties = {
  borderRadius: "999px",
  border: "none",
  backgroundColor: "#c9a04f",
  color: "#ffffff",
  padding: "8px 14px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "background-color 0.15s ease, transform 0.15s ease",
  fontFamily: CHAT_FONT_FAMILY,
};

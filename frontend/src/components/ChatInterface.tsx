"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import type { Conversation, Usage } from "@/lib/api";
import {
  getConversations,
  getConversationMessages,
  createConversation,
  deleteConversation,
  getUsage,
  streamChat,
  getSettings,
} from "@/lib/api";
import ConversationSidebar from "./ConversationSidebar";
import MessageBubble from "./MessageBubble";
import UsageBar from "./UsageBar";
import UserMenu from "./UserMenu";
import SettingsModal from "./SettingsModal";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatInterface() {
  const { data: session } = useSession();
  const token = (session as any)?.rawToken as string | undefined;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState("");
  const [usage, setUsage] = useState<Usage | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userHasOwnKey, setUserHasOwnKey] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!token) return;
    getConversations(token).then(setConversations).catch(console.error);
    getUsage(token).then(setUsage).catch(console.error);
    getSettings(token)
      .then((s) => setUserHasOwnKey(s.has_api_key))
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const abortStream = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
    setStreamingText("");
  };

  const handleSelectConv = async (id: string) => {
    abortStream();
    setActiveConvId(id);
    setMessages([]);
    setSidebarOpen(false);
    if (!token) return;
    try {
      const msgs = await getConversationMessages(id, token);
      setMessages(msgs);
    } catch {
      // conversation exists but messages failed — leave empty
    }
  };

  const handleNewConv = async () => {
    if (!token) return;
    abortStream();
    const conv = await createConversation(token);
    setConversations((prev) => [conv as Conversation, ...prev]);
    setActiveConvId(conv.id);
    setMessages([]);
    setSidebarOpen(false);
  };

  const handleDeleteConv = async (id: string) => {
    if (!token) return;
    await deleteConversation(id, token);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) {
      setActiveConvId(null);
      setMessages([]);
    }
  };

  const handleSend = async () => {
    if (!token || !activeConvId || !input.trim() || isStreaming) return;
    const msg = input.trim();
    const convId = activeConvId; // capture before any state changes
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setIsStreaming(true);
    setStreamingText("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let accumulated = "";
      await streamChat(
        convId,
        msg,
        (chunk) => {
          accumulated += chunk;
          setStreamingText(accumulated);
        },
        token,
        controller.signal,
      );
      // Only commit the message if this stream was not aborted
      if (!controller.signal.aborted) {
        setMessages((prev) => [...prev, { role: "assistant", content: accumulated }]);
        setStreamingText("");
        getUsage(token).then(setUsage).catch(console.error);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? { ...c, title: msg.slice(0, 35) + (msg.length > 35 ? "…" : "") }
              : c,
          ),
        );
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return; // intentional switch — no toast
      toast.error(err?.message || "Something went wrong. Do try again.");
    } finally {
      setIsStreaming(false);
    }
  };

  if (!token) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0A",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 2,
              height: 32,
              background: "linear-gradient(to bottom, #C9A84C, transparent)",
              margin: "0 auto 1rem",
            }}
          />
          <p style={{ color: "#4A4540", fontFamily: "Georgia, serif", fontSize: "0.9rem", letterSpacing: "0.1em" }}>
            Loading…
          </p>
        </div>
      </div>
    );
  }

  const user = session?.user;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0A0A0A", position: "relative" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`sidebar${sidebarOpen ? " open" : ""}`}>
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConvId}
          onSelect={handleSelectConv}
          onNew={handleNewConv}
          onDelete={handleDeleteConv}
        />
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* ── Header ── */}
        <div
          style={{
            padding: "0 1.5rem",
            height: 58,
            borderBottom: "1px solid #1A1616",
            background: "#0D0B0B",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            {/* Hamburger (mobile only) */}
            <button
              className="hamburger"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle sidebar"
              style={{
                background: "none",
                border: "none",
                color: "#C9A84C",
                cursor: "pointer",
                fontSize: "1.15rem",
                padding: 0,
                lineHeight: 1,
              }}
            >
              ☰
            </button>

            {/* Gold separator bar */}
            <div
              style={{
                width: 2,
                height: 28,
                background: "linear-gradient(to bottom, transparent, #C9A84C, transparent)",
                opacity: 0.5,
              }}
            />

            <div>
              <h1
                style={{
                  fontFamily: "Georgia, serif",
                  color: "#C9A84C",
                  fontSize: "1.25rem",
                  fontWeight: "normal",
                  letterSpacing: "0.04em",
                  lineHeight: 1.2,
                }}
              >
                Raymond Reddington
              </h1>
              <p style={{ color: "#5A5450", fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Concierge of Crime
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            {userHasOwnKey && (
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "#C9A84C",
                  border: "1px solid rgba(201,168,76,0.35)",
                  borderRadius: 4,
                  padding: "2px 8px",
                  fontFamily: "Inter, sans-serif",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Own Key
              </span>
            )}
            <UserMenu
              name={user?.name ?? ""}
              email={user?.email ?? ""}
              image={user?.image ?? null}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          </div>
        </div>

        {/* ── Messages / Empty state ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {!activeConvId ? (
            /* ── Beautiful empty / welcome state ── */
            <div
              style={{
                margin: "auto",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1.75rem",
                padding: "2rem 1.5rem",
              }}
            >
              {/* RR illustration — full image */}
              <div
                style={{
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid rgba(201, 168, 76, 0.22)",
                  boxShadow:
                    "0 0 0 5px rgba(201,168,76,0.04), 0 0 56px rgba(201,168,76,0.12)",
                  flexShrink: 0,
                  maxWidth: 220,
                }}
              >
                <img
                  src="/rr-art.jpg"
                  alt="Raymond Reddington"
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    filter: "contrast(1.05)",
                  }}
                />
              </div>

              {/* Name + quote */}
              <div style={{ maxWidth: 420 }}>
                <p
                  style={{
                    color: "#5A5450",
                    fontSize: "0.75rem",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    fontFamily: "Inter, sans-serif",
                    marginBottom: "0.5rem",
                  }}
                >
                  The Blacklist
                </p>
                <h2
                  style={{
                    fontFamily: "Georgia, serif",
                    color: "#C9A84C",
                    fontSize: "1.9rem",
                    fontWeight: "normal",
                    letterSpacing: "0.04em",
                    marginBottom: "1rem",
                  }}
                >
                  Raymond Reddington
                </h2>
                <p
                  style={{
                    fontFamily: "Georgia, serif",
                    color: "#6A6458",
                    fontSize: "1.05rem",
                    lineHeight: 1.85,
                    fontStyle: "italic",
                  }}
                >
                  &ldquo;The greatest criminals in the world aren&rsquo;t hiding in the
                  shadows. They&rsquo;re the ones who convince you they&rsquo;re the
                  heroes.&rdquo;
                </p>
              </div>

              {/* CTA */}
              <button className="begin-conv-btn" onClick={handleNewConv}>
                Begin a Conversation
              </button>
            </div>
          ) : (
            /* ── Active conversation messages ── */
            <div
              style={{
                padding: "1.75rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                minHeight: "100%",
              }}
            >
              {messages.map((m, i) => (
                <MessageBubble key={i} role={m.role} content={m.content} />
              ))}
              {isStreaming && streamingText && (
                <MessageBubble role="assistant" content={streamingText} streaming />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Usage bar ── */}
        {usage && <UsageBar used={usage.used} limit={usage.limit} />}

        {/* ── Input area ── */}
        <div
          style={{
            padding: "0.875rem 1.25rem",
            borderTop: "1px solid #1A1616",
            background: "#0D0B0B",
            display: "flex",
            gap: "0.75rem",
            alignItems: "flex-end",
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={!activeConvId || isStreaming}
            placeholder={
              activeConvId ? "Speak your mind…" : "Select or begin a conversation"
            }
            rows={1}
            style={{
              flex: 1,
              background: "#141010",
              border: "1px solid #221E1E",
              borderRadius: 10,
              color: "#E8E0D0",
              padding: "0.8rem 1.1rem",
              fontSize: "1rem",
              resize: "none",
              outline: "none",
              fontFamily: "Inter, sans-serif",
              lineHeight: 1.6,
              transition: "border-color 0.2s",
              maxHeight: 160,
              overflowY: "auto",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.3)")}
            onBlur={(e) => (e.target.style.borderColor = "#221E1E")}
          />
          <button
            onClick={handleSend}
            disabled={!activeConvId || isStreaming || !input.trim()}
            style={{
              background:
                !activeConvId || isStreaming || !input.trim()
                  ? "#1A1414"
                  : "linear-gradient(135deg, #C9A84C, #A07830)",
              border: "1px solid",
              borderColor:
                !activeConvId || isStreaming || !input.trim()
                  ? "#252020"
                  : "transparent",
              borderRadius: 10,
              color:
                !activeConvId || isStreaming || !input.trim()
                  ? "#3A3530"
                  : "#0A0A0A",
              padding: "0.8rem 1.4rem",
              cursor:
                !activeConvId || isStreaming || !input.trim()
                  ? "not-allowed"
                  : "pointer",
              fontSize: "0.95rem",
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              letterSpacing: "0.04em",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {isStreaming ? "…" : "Send"}
          </button>
        </div>
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        token={token}
        onKeyChange={(hasKey) => setUserHasOwnKey(hasKey)}
      />
    </div>
  );
}

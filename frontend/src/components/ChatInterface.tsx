"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import type { Conversation, Usage } from "@/lib/api";
import {
  getConversations,
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

  const handleSelectConv = (id: string) => {
    setActiveConvId(id);
    setMessages([]);
    setStreamingText("");
    setSidebarOpen(false);
  };

  const handleNewConv = async () => {
    if (!token) return;
    const conv = await createConversation(token);
    setConversations((prev) => [conv as Conversation, ...prev]);
    setActiveConvId(conv.id);
    setMessages([]);
    setStreamingText("");
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
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setIsStreaming(true);
    setStreamingText("");

    try {
      let accumulated = "";
      await streamChat(
        activeConvId,
        msg,
        (chunk) => {
          accumulated += chunk;
          setStreamingText(accumulated);
        },
        token,
      );
      setMessages((prev) => [...prev, { role: "assistant", content: accumulated }]);
      setStreamingText("");
      getUsage(token).then(setUsage).catch(console.error);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? { ...c, title: msg.slice(0, 35) + (msg.length > 35 ? "…" : "") }
            : c,
        ),
      );
    } catch (err: any) {
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
        <p style={{ color: "#8A7F70", fontFamily: "Georgia, serif" }}>Loading...</p>
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
        {/* Header */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid #2A2020",
            background: "#111111",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              className="hamburger"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle sidebar"
              style={{
                background: "none",
                border: "none",
                color: "#C9A84C",
                cursor: "pointer",
                fontSize: "1.25rem",
                padding: 0,
                lineHeight: 1,
              }}
            >
              ☰
            </button>
            <div>
              <h1 style={{ fontFamily: "Georgia, serif", color: "#C9A84C", fontSize: "1.1rem" }}>
                Raymond Reddington
              </h1>
              <p style={{ color: "#8A7F70", fontSize: "0.75rem" }}>Concierge of Crime</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {userHasOwnKey && (
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "#C9A84C",
                  border: "1px solid #C9A84C",
                  borderRadius: 4,
                  padding: "2px 6px",
                  fontFamily: "Inter, sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                Own API key
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

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {!activeConvId && (
            <div style={{ margin: "auto", textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "Georgia, serif",
                  color: "#8A7F70",
                  fontSize: "1rem",
                  lineHeight: 1.8,
                }}
              >
                Select a conversation or start a new one.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))}
          {isStreaming && streamingText && (
            <MessageBubble role="assistant" content={streamingText} streaming />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Usage bar */}
        {usage && <UsageBar used={usage.used} limit={usage.limit} />}

        {/* Input */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid #2A2020",
            background: "#111111",
            display: "flex",
            gap: "0.75rem",
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
            placeholder={activeConvId ? "Speak your mind..." : "Select a conversation to begin"}
            rows={1}
            style={{
              flex: 1,
              background: "#1a1414",
              border: "1px solid #2A2020",
              borderRadius: 8,
              color: "#E8E0D0",
              padding: "0.75rem 1rem",
              fontSize: "0.9rem",
              resize: "none",
              outline: "none",
              fontFamily: "Inter, sans-serif",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!activeConvId || isStreaming || !input.trim()}
            style={{
              background: "#C9A84C",
              border: "none",
              borderRadius: 8,
              color: "#0A0A0A",
              padding: "0.75rem 1.25rem",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 600,
              opacity: !activeConvId || isStreaming || !input.trim() ? 0.5 : 1,
            }}
          >
            Send
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

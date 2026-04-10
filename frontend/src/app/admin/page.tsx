"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  getAdminUsers,
  getAdminUserConversations,
  getAdminConversationMessages,
  AdminUser,
  AdminConversation,
  AdminMessage,
} from "@/lib/api";

const ADMIN_EMAIL = "waseekirtefa@gmail.com";

/* ─── tiny helpers ─────────────────────────────────────────── */

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime(s: string | null) {
  if (!s) return "";
  return new Date(s).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* ─── sub-components ───────────────────────────────────────── */

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        background: "rgba(201,168,76,0.08)",
        border: "1px solid rgba(201,168,76,0.2)",
        borderRadius: 8,
        padding: "0.5rem 1.2rem",
        textAlign: "center",
      }}
    >
      <p style={{ color: "#C9A84C", fontSize: "1.5rem", fontFamily: "Georgia, serif", lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ color: "#6A6258", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>
        {label}
      </p>
    </div>
  );
}

/* ─── main page ────────────────────────────────────────────── */

export default function AdminPage() {
  const { data: session, status } = useSession();
  const token = (session as any)?.rawToken as string | undefined;
  const userEmail = session?.user?.email;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [totalConvos, setTotalConvos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [convos, setConvos] = useState<AdminConversation[]>([]);
  const [convosLoading, setConvosLoading] = useState(false);

  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!token || userEmail !== ADMIN_EMAIL) { setLoading(false); return; }
    getAdminUsers(token)
      .then((data) => {
        setTotal(data.total);
        setUsers(data.users);
        setTotalConvos(data.users.reduce((s, u) => s + u.conversations, 0));
        setTotalMessages(data.users.reduce((s, u) => s + u.messages, 0));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, status, userEmail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectUser = async (u: AdminUser) => {
    setSelectedUser(u);
    setSelectedConvId(null);
    setMessages([]);
    setConvos([]);
    if (!token) return;
    setConvosLoading(true);
    try {
      const data = await getAdminUserConversations(u.id, token);
      setConvos(data);
    } catch {
      setConvos([]);
    } finally {
      setConvosLoading(false);
    }
  };

  const selectConv = async (convId: string) => {
    setSelectedConvId(convId);
    setMessages([]);
    if (!token) return;
    setMsgsLoading(true);
    try {
      const data = await getAdminConversationMessages(convId, token);
      setMessages(data.messages);
    } catch {
      setMessages([]);
    } finally {
      setMsgsLoading(false);
    }
  };

  /* ─── guards ─── */
  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0A0A" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 2, height: 32, background: "linear-gradient(to bottom, #C9A84C, transparent)", margin: "0 auto 1rem" }} />
          <p style={{ color: "#4A4540", fontFamily: "Georgia, serif", letterSpacing: "0.1em" }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!session || userEmail !== ADMIN_EMAIL) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0A0A" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#6B1D1D", fontFamily: "Georgia, serif", fontSize: "1.1rem", marginBottom: "0.5rem" }}>Access Denied</p>
          <p style={{ color: "#4A4540", fontSize: "0.8rem" }}>You don&apos;t have clearance for this.</p>
        </div>
      </div>
    );
  }

  const col: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #1A1616",
    overflow: "hidden",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0A0A0A", color: "#E8E0D0" }}>

      {/* ── Top bar ── */}
      <div style={{
        padding: "0 2rem",
        height: 64,
        background: "#0D0B0B",
        borderBottom: "1px solid #1A1616",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}>
          <span style={{ fontFamily: "Georgia, serif", color: "#C9A84C", fontSize: "1.3rem", letterSpacing: "-0.01em" }}>RR</span>
          <div style={{ width: 1, height: 20, background: "#2A2020" }} />
          <h1 style={{ fontFamily: "Georgia, serif", color: "#E8E0D0", fontSize: "1rem", fontWeight: "normal", letterSpacing: "0.06em" }}>
            Admin Panel
          </h1>
          <span style={{ color: "#3A3530", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            The Blacklist
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <StatPill label="Users" value={total} />
          <StatPill label="Conversations" value={totalConvos} />
          <StatPill label="Messages" value={totalMessages} />
        </div>
      </div>

      {error && (
        <div style={{ background: "#1a0808", borderBottom: "1px solid #6B1D1D", padding: "0.5rem 2rem", color: "#c9444c", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {/* ── Three-panel body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── Panel 1: Users ── */}
        <div style={{ ...col, width: 300, minWidth: 280, flexShrink: 0 }}>
          <div style={{ padding: "1rem 1.25rem 0.75rem", borderBottom: "1px solid #1A1616" }}>
            <p style={{ color: "#6A6258", fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Users &mdash; {total}
            </p>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {users.map((u) => {
              const active = selectedUser?.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => selectUser(u)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: active ? "rgba(201,168,76,0.07)" : "transparent",
                    border: "none",
                    borderLeft: `3px solid ${active ? "#C9A84C" : "transparent"}`,
                    padding: "0.9rem 1.25rem",
                    cursor: "pointer",
                    borderBottom: "1px solid #141212",
                    transition: "background 0.15s, border-color 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.875rem",
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(201,168,76,0.04)"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: `2px solid ${active ? "#C9A84C" : "#2A2020"}`,
                    flexShrink: 0,
                    background: "#161010",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#C9A84C",
                    fontFamily: "Georgia, serif",
                    fontSize: "0.9rem",
                  }}>
                    {u.picture
                      ? <img src={u.picture} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : initials(u.name)
                    }
                  </div>

                  {/* Info */}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: active ? "#E8E0D0" : "#B8B0A0", fontSize: "0.9rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.name ?? "Unknown"}
                    </p>
                    <p style={{ color: "#5A5450", fontSize: "0.72rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                      {u.id}
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: 4 }}>
                      <span style={{ background: "#1A1616", borderRadius: 4, padding: "1px 6px", color: "#7A7268", fontSize: "0.65rem" }}>
                        {u.provider ?? "?"}
                      </span>
                      <span style={{ background: "#1A1616", borderRadius: 4, padding: "1px 6px", color: "#7A7268", fontSize: "0.65rem" }}>
                        {u.conversations} convos
                      </span>
                      <span style={{ background: "#1A1616", borderRadius: 4, padding: "1px 6px", color: "#7A7268", fontSize: "0.65rem" }}>
                        {u.messages} msgs
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            {users.length === 0 && (
              <p style={{ color: "#3A3530", fontSize: "0.8rem", textAlign: "center", padding: "3rem 1rem", fontFamily: "Georgia, serif", fontStyle: "italic" }}>
                No users yet.
              </p>
            )}
          </div>
        </div>

        {/* ── Panel 2: Conversations ── */}
        <div style={{ ...col, width: 300, minWidth: 260, flexShrink: 0 }}>
          <div style={{ padding: "1rem 1.25rem 0.75rem", borderBottom: "1px solid #1A1616" }}>
            <p style={{ color: "#6A6258", fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              {selectedUser ? `${selectedUser.name ?? "User"}'s Chats` : "Conversations"}
            </p>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {!selectedUser && (
              <p style={{ color: "#2E2A28", fontSize: "0.8rem", textAlign: "center", padding: "3rem 1rem", fontFamily: "Georgia, serif", fontStyle: "italic" }}>
                Select a user to view their conversations.
              </p>
            )}
            {convosLoading && (
              <p style={{ color: "#4A4540", fontSize: "0.8rem", textAlign: "center", padding: "2rem" }}>Loading…</p>
            )}
            {!convosLoading && selectedUser && convos.map((c) => {
              const active = selectedConvId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => selectConv(c.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: active ? "rgba(201,168,76,0.07)" : "transparent",
                    border: "none",
                    borderLeft: `3px solid ${active ? "#C9A84C" : "transparent"}`,
                    padding: "0.85rem 1.25rem",
                    cursor: "pointer",
                    borderBottom: "1px solid #141212",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(201,168,76,0.04)"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <p style={{
                    color: active ? "#E8E0D0" : "#9A9288",
                    fontSize: "0.88rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginBottom: 4,
                  }}>
                    {c.title}
                  </p>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <span style={{ color: "#4A4540", fontSize: "0.68rem" }}>{fmtDate(c.updated_at)}</span>
                    <span style={{ color: "#3A3530", fontSize: "0.65rem" }}>·</span>
                    <span style={{ color: "#4A4540", fontSize: "0.68rem" }}>{c.message_count} messages</span>
                  </div>
                </button>
              );
            })}
            {!convosLoading && selectedUser && convos.length === 0 && (
              <p style={{ color: "#2E2A28", fontSize: "0.8rem", textAlign: "center", padding: "2rem 1rem", fontFamily: "Georgia, serif", fontStyle: "italic" }}>
                No conversations yet.
              </p>
            )}
          </div>
        </div>

        {/* ── Panel 3: Messages ── */}
        <div style={{ ...col, flex: 1, borderRight: "none" }}>
          <div style={{ padding: "1rem 1.5rem 0.75rem", borderBottom: "1px solid #1A1616" }}>
            <p style={{ color: "#6A6258", fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              {selectedConvId
                ? (convos.find((c) => c.id === selectedConvId)?.title ?? "Messages")
                : "Messages"}
            </p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {!selectedConvId && (
              <div style={{ margin: "auto", textAlign: "center" }}>
                <p style={{ color: "#2E2A28", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "0.9rem", lineHeight: 1.7 }}>
                  Select a conversation<br />to read the messages.
                </p>
              </div>
            )}

            {msgsLoading && (
              <p style={{ color: "#4A4540", fontSize: "0.8rem", textAlign: "center", margin: "auto" }}>Loading…</p>
            )}

            {!msgsLoading && messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  <div style={{
                    maxWidth: "75%",
                    background: isUser ? "#1A1414" : "#161010",
                    borderRadius: isUser ? "12px 12px 0 12px" : "0 12px 12px 12px",
                    borderLeft: isUser ? "none" : "3px solid #C9A84C",
                    border: isUser ? "1px solid #2A2020" : undefined,
                    padding: "0.75rem 1rem",
                  }}>
                    <p style={{
                      color: "#5A5450",
                      fontSize: "0.62rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      marginBottom: "0.35rem",
                    }}>
                      {isUser ? "User" : "Raymond Reddington"}
                    </p>
                    {isUser ? (
                      <p style={{ color: "#C8C0B0", fontSize: "0.92rem", lineHeight: 1.65 }}>{m.content}</p>
                    ) : (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => (
                            <p style={{ fontFamily: "Georgia, serif", color: "#E8E0D0", lineHeight: 1.8, fontSize: "0.95rem", marginBottom: "0.4rem" }}>
                              {children}
                            </p>
                          ),
                          strong: ({ children }) => <strong style={{ color: "#C9A84C" }}>{children}</strong>,
                          em: ({ children }) => <em style={{ color: "#C8C0B0" }}>{children}</em>,
                          ul: ({ children }) => <ul style={{ paddingLeft: "1.25rem", color: "#E8E0D0", marginBottom: "0.4rem" }}>{children}</ul>,
                          li: ({ children }) => <li style={{ fontFamily: "Georgia, serif", lineHeight: 1.7, fontSize: "0.92rem" }}>{children}</li>,
                          code: ({ children, ...props }: any) => (
                            <code style={{ background: "#1a1414", color: "#C9A84C", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace", fontSize: "0.85em" }} {...props}>{children}</code>
                          ),
                          pre: ({ children }) => (
                            <pre style={{ background: "#111", border: "1px solid #2A2020", borderRadius: 6, padding: "0.6rem 0.875rem", overflowX: "auto", marginBottom: "0.4rem", fontFamily: "monospace", fontSize: "0.82rem", color: "#E8E0D0" }}>{children}</pre>
                          ),
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    )}
                    {m.created_at && (
                      <p style={{ color: "#3A3530", fontSize: "0.6rem", marginTop: "0.35rem", textAlign: isUser ? "right" : "left" }}>
                        {fmtTime(m.created_at)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

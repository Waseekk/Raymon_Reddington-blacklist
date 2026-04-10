"use client";

import { useState } from "react";
import type { Conversation } from "@/lib/api";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export default function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  return (
    <div
      style={{
        width: 280,
        minWidth: 280,
        background: "#0B0909",
        borderRight: "1px solid #1A1616",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* ── Brand header with background image ── */}
      <div
        style={{
          position: "relative",
          padding: "1.5rem 1.25rem 1.2rem",
          borderBottom: "1px solid #1A1616",
          overflow: "hidden",
        }}
      >
        {/* Subtle background image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/rr-sidebar.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center 20%",
            opacity: 0.12,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(11,9,9,0.2) 0%, rgba(11,9,9,0.9) 100%)",
          }}
        />

        {/* RR monogram + label */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "baseline",
            gap: "0.6rem",
            marginBottom: "1.1rem",
          }}
        >
          <span
            style={{
              fontFamily: "Georgia, serif",
              color: "#C9A84C",
              fontSize: "1.8rem",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            RR
          </span>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              color: "#5A5450",
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            The Blacklist
          </span>
        </div>

        {/* New conversation button */}
        <button className="new-conv-btn" onClick={onNew} style={{ position: "relative" }}>
          <span style={{ fontSize: "1rem", lineHeight: 1, marginTop: "-1px" }}>＋</span>
          New Conversation
        </button>

        {/* Search */}
        <div
          style={{ marginTop: "0.75rem", position: "relative" }}
        >
          <span
            style={{
              position: "absolute",
              left: "0.65rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#3A3530",
              fontSize: "0.85rem",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            ⌕
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            style={{
              position: "relative",
              width: "100%",
              background: "#141010",
              border: "1px solid #221E1E",
              borderRadius: 6,
              color: "#E8E0D0",
              padding: "0.45rem 0.75rem 0.45rem 1.85rem",
              fontSize: "0.9rem",
              outline: "none",
              fontFamily: "Inter, sans-serif",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.35)")}
            onBlur={(e) => (e.target.style.borderColor = "#221E1E")}
          />
        </div>
      </div>

      {/* ── Conversation list ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0.5rem 0.4rem",
        }}
      >
        {filtered.length === 0 && (
          <p
            style={{
              color: "#2E2A28",
              fontSize: "0.75rem",
              textAlign: "center",
              padding: "2.5rem 1rem",
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              lineHeight: 1.7,
            }}
          >
            {search
              ? "No dossiers match your search."
              : "No conversations yet.\nBegin one above."}
          </p>
        )}

        {filtered.map((conv) => (
          <div key={conv.id} className="conv-item">
            <button
              className={`conv-btn${activeId === conv.id ? " active" : ""}`}
              onClick={() => onSelect(conv.id)}
            >
              {conv.title.length > 30
                ? conv.title.slice(0, 30) + "…"
                : conv.title}
            </button>
            <button
              className="conv-delete-btn"
              onClick={() => onDelete(conv.id)}
              title="Delete"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          padding: "0.75rem 1.25rem",
          borderTop: "1px solid #1A1616",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#2A6B3A",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            color: "#5A5450",
            fontSize: "0.75rem",
            fontFamily: "Inter, sans-serif",
            letterSpacing: "0.06em",
          }}
        >
          CONNECTED
        </span>
      </div>
    </div>
  );
}

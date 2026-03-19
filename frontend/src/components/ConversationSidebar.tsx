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
    ? conversations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  return (
    <div
      style={{
        width: 260,
        minWidth: 260,
        background: "#111111",
        borderRight: "1px solid #2A2020",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "1rem", borderBottom: "1px solid #2A2020" }}>
        <h2
          style={{
            color: "#C9A84C",
            fontFamily: "Georgia, serif",
            fontSize: "1rem",
            marginBottom: "0.75rem",
          }}
        >
          Conversations
        </h2>
        <button
          onClick={onNew}
          style={{
            width: "100%",
            background: "transparent",
            border: "1px solid #C9A84C",
            borderRadius: 6,
            color: "#C9A84C",
            padding: "0.5rem",
            cursor: "pointer",
            fontSize: "0.85rem",
            marginBottom: "0.5rem",
          }}
        >
          + New Conversation
        </button>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          style={{
            width: "100%",
            background: "#1a1414",
            border: "1px solid #2A2020",
            borderRadius: 6,
            color: "#E8E0D0",
            padding: "0.4rem 0.75rem",
            fontSize: "0.8rem",
            outline: "none",
            fontFamily: "Inter, sans-serif",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
        {filtered.map((conv) => (
          <div
            key={conv.id}
            style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}
          >
            <button
              onClick={() => onSelect(conv.id)}
              style={{
                flex: 1,
                textAlign: "left",
                background: activeId === conv.id ? "#1a1414" : "transparent",
                border: activeId === conv.id ? "1px solid #2A2020" : "1px solid transparent",
                borderRadius: 6,
                color: activeId === conv.id ? "#E8E0D0" : "#8A7F70",
                padding: "0.5rem 0.75rem",
                cursor: "pointer",
                fontSize: "0.85rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {conv.title.length > 35 ? conv.title.slice(0, 35) + "…" : conv.title}
            </button>
            <button
              onClick={() => onDelete(conv.id)}
              title="Delete"
              style={{
                background: "transparent",
                border: "none",
                color: "#555",
                cursor: "pointer",
                fontSize: "1rem",
                padding: "0 4px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

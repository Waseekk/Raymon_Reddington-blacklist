"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import StreamingCursor from "./StreamingCursor";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export default function MessageBubble({ role, content, streaming }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (role === "assistant") {
    return (
      <div
        className="message-bubble"
        style={{
          padding: "1rem 1.25rem",
          background: "#161010",
          borderLeft: "3px solid #C9A84C",
          borderRadius: "0 8px 8px 0",
          marginBottom: "1rem",
          maxWidth: "85%",
          alignSelf: "flex-start",
          position: "relative",
        }}
      >
        <button className="copy-btn" onClick={handleCopy}>
          {copied ? "Copied" : "Copy"}
        </button>
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <p style={{ fontFamily: "Georgia, serif", color: "#E8E0D0", lineHeight: 1.8, fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                {children}
              </p>
            ),
            strong: ({ children }) => (
              <strong style={{ color: "#C9A84C", fontWeight: 600 }}>{children}</strong>
            ),
            em: ({ children }) => (
              <em style={{ color: "#C8C0B0", fontStyle: "italic" }}>{children}</em>
            ),
            ul: ({ children }) => (
              <ul style={{ paddingLeft: "1.5rem", color: "#E8E0D0", marginBottom: "0.5rem" }}>{children}</ul>
            ),
            ol: ({ children }) => (
              <ol style={{ paddingLeft: "1.5rem", color: "#E8E0D0", marginBottom: "0.5rem" }}>{children}</ol>
            ),
            li: ({ children }) => (
              <li style={{ fontFamily: "Georgia, serif", color: "#E8E0D0", lineHeight: 1.7, fontSize: "0.95rem", marginBottom: "0.2rem" }}>{children}</li>
            ),
            code({ className, children, ...props }: any) {
              const isBlock = className?.includes("language-");
              return isBlock ? (
                <code style={{ fontFamily: "monospace", fontSize: "0.85rem" }} {...props}>{children}</code>
              ) : (
                <code style={{ background: "#1a1414", color: "#C9A84C", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace", fontSize: "0.85em" }} {...props}>{children}</code>
              );
            },
            pre: ({ children }) => (
              <pre style={{ background: "#111111", border: "1px solid #2A2020", borderRadius: 6, padding: "0.75rem 1rem", overflowX: "auto", marginBottom: "0.5rem", fontFamily: "monospace", fontSize: "0.85rem", color: "#E8E0D0" }}>
                {children}
              </pre>
            ),
            blockquote: ({ children }) => (
              <blockquote style={{ borderLeft: "3px solid #C9A84C", paddingLeft: "1rem", fontStyle: "italic", color: "#8A7F70", marginBottom: "0.5rem" }}>
                {children}
              </blockquote>
            ),
            h1: ({ children }) => (
              <h1 style={{ fontFamily: "Georgia, serif", color: "#C9A84C", fontSize: "1.2rem", marginBottom: "0.5rem" }}>{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 style={{ fontFamily: "Georgia, serif", color: "#C9A84C", fontSize: "1.1rem", marginBottom: "0.5rem" }}>{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 style={{ fontFamily: "Georgia, serif", color: "#C9A84C", fontSize: "1rem", marginBottom: "0.5rem" }}>{children}</h3>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
        {streaming && <StreamingCursor />}
      </div>
    );
  }

  return (
    <div
      className="message-bubble"
      style={{
        padding: "0.75rem 1rem",
        background: "#1a1414",
        borderRadius: "8px 8px 0 8px",
        marginBottom: "1rem",
        maxWidth: "75%",
        alignSelf: "flex-end",
        border: "1px solid #2A2020",
        position: "relative",
      }}
    >
      <button className="copy-btn" onClick={handleCopy}>
        {copied ? "Copied" : "Copy"}
      </button>
      <p
        style={{
          fontFamily: "Inter, sans-serif",
          color: "#C8C0B0",
          lineHeight: 1.6,
          fontSize: "0.9rem",
        }}
      >
        {content}
      </p>
    </div>
  );
}

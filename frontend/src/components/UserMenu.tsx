"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";

interface Props {
  name: string;
  email: string;
  image: string | null;
  onOpenSettings: () => void;
}

export default function UserMenu({ name, email, image, onOpenSettings }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "RR";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "2px solid #C9A84C",
          background: "#161010",
          cursor: "pointer",
          padding: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#C9A84C",
          fontFamily: "Georgia, serif",
          fontSize: "0.85rem",
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {image ? (
          <img
            src={image}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 220,
            background: "#161010",
            border: "1px solid #2A2020",
            borderRadius: 8,
            overflow: "hidden",
            zIndex: 100,
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
          }}
        >
          {/* User info */}
          <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid #2A2020" }}>
            <p
              style={{
                color: "#E8E0D0",
                fontSize: "0.875rem",
                fontWeight: 600,
                marginBottom: 2,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {name || "User"}
            </p>
            <p
              style={{
                color: "#8A7F70",
                fontSize: "0.75rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {email}
            </p>
          </div>

          {/* Menu items */}
          <button
            onClick={() => {
              setOpen(false);
              onOpenSettings();
            }}
            style={menuItemStyle}
            onMouseOver={(e) => (e.currentTarget.style.background = "#1a1414")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Settings
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{ ...menuItemStyle, color: "#C9A84C" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#1a1414")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  background: "transparent",
  border: "none",
  color: "#E8E0D0",
  padding: "0.75rem 1rem",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontFamily: "Inter, sans-serif",
};

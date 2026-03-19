"use client";

interface UsageBarProps {
  used: number;
  limit: number;
}

export default function UsageBar({ used, limit }: UsageBarProps) {
  const pct = limit > 0 ? (used / limit) * 100 : 0;
  const color = pct < 50 ? "#C9A84C" : pct < 80 ? "#c9844c" : "#6B1D1D";

  return (
    <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid #2A2020" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: "#8A7F70", fontSize: "0.75rem" }}>Daily Messages</span>
        <span style={{ color: "#8A7F70", fontSize: "0.75rem" }}>
          {used} / {limit} used today
        </span>
      </div>
      <div style={{ background: "#2A2020", borderRadius: 4, height: 4 }}>
        <div
          style={{
            background: color,
            borderRadius: 4,
            height: 4,
            width: `${Math.min(100, pct)}%`,
            transition: "width 0.3s ease, background 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

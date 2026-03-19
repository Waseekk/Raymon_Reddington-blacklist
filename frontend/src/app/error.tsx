"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0A0A0A",
        gap: "1rem",
      }}
    >
      <p style={{ fontFamily: "Georgia, serif", color: "#C9A84C", fontSize: "1.1rem" }}>
        Something went wrong.
      </p>
      <p style={{ color: "#8A7F70", fontSize: "0.85rem" }}>{error.message}</p>
      <button
        onClick={reset}
        style={{
          background: "transparent",
          border: "1px solid #C9A84C",
          color: "#C9A84C",
          padding: "0.5rem 1.25rem",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}

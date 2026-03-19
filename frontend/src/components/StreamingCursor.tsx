"use client";

export default function StreamingCursor() {
  return (
    <>
      <span className="streaming-cursor">|</span>
      <style>{`
        .streaming-cursor {
          display: inline-block;
          color: #C9A84C;
          animation: blink 1s step-end infinite;
          margin-left: 1px;
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </>
  );
}

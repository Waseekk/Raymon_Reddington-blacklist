"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#0A0A0A",
        overflow: "hidden",
      }}
    >
      {/* Left column — photo (hidden on mobile via .login-image class) */}
      <div
        className="login-image"
        style={{
          flex: "0 0 50%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <img
          src="/reddington.jpg"
          alt="Raymond Reddington"
          style={{
            width: "100%",
            height: "100vh",
            objectFit: "cover",
            objectPosition: "center top",
            display: "block",
          }}
        />
        {/* Subtle dark gradient overlay on the right edge */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, transparent 70%, #0A0A0A 100%)",
          }}
        />
      </div>

      {/* Right column — login card */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* Fading backdrop quote */}
        <p
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontFamily: "Georgia, serif",
            fontSize: "clamp(0.9rem, 2.5vw, 1.3rem)",
            color: "rgba(201, 168, 76, 0.06)",
            textAlign: "center",
            width: "80%",
            lineHeight: 1.8,
            animation: "fadeIn 3s ease-in forwards",
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          &ldquo;The greatest criminals in the world aren&rsquo;t hiding in the shadows.
          They&rsquo;re the ones who convince you they&rsquo;re the heroes.&rdquo;
        </p>

        {/* Login card */}
        <div
          style={{
            background: "#161010",
            border: "1px solid #2A2020",
            borderRadius: 12,
            padding: "2.5rem",
            width: "min(420px, 90vw)",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            zIndex: 1,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                fontFamily: "Georgia, serif",
                color: "#C9A84C",
                fontSize: "1.75rem",
                marginBottom: 8,
              }}
            >
              Raymond Reddington
            </h1>
            <p style={{ color: "#8A7F70", fontSize: "0.9rem" }}>
              Number 4 on the FBI&apos;s Most Wanted List
            </p>
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/chat" })}
            style={btnStyle}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = "#C9A84C")}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = "#2A2020")}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <button
            onClick={() => signIn("facebook", { callbackUrl: "/chat" })}
            style={btnStyle}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = "#C9A84C")}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = "#2A2020")}
          >
            <FacebookIcon />
            Continue with Facebook
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #2A2020",
  borderRadius: 8,
  color: "#E8E0D0",
  padding: "0.8rem 1rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.75rem",
  fontSize: "0.95rem",
  transition: "border-color 0.2s",
  width: "100%",
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"
      />
      <path
        fill="#34A853"
        d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"
      />
      <path
        fill="#FBBC05"
        d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"
      />
      <path
        fill="#EA4335"
        d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" aria-hidden>
      <path d="M24 12.073C24 5.445 18.627 0 12 0S0 5.445 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

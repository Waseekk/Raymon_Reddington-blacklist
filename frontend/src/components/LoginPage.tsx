"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="login-root">
      {/* Full-screen background photo */}
      <div className="login-bg" />

      {/* Dark directional overlay */}
      <div className="login-overlay" />

      {/* Faded watermark quote at bottom */}
      <p
        style={{
          position: "absolute",
          bottom: "1.75rem",
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(201, 168, 76, 0.55)",
          fontFamily: "Georgia, serif",
          fontSize: "clamp(0.6rem, 1.1vw, 0.78rem)",
          textAlign: "center",
          width: "65%",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          userSelect: "none",
          pointerEvents: "none",
          lineHeight: 2,
          zIndex: 5,
        }}
      >
        &ldquo;The greatest criminals aren&rsquo;t hiding in shadows &mdash;
        they&rsquo;re the ones who convince you they&rsquo;re the heroes.&rdquo;
      </p>

      {/* Login card */}
      <div className="login-card">
        {/* Gold accent bar */}
        <div
          style={{
            width: "2.5rem",
            height: "2px",
            background: "linear-gradient(to right, #C9A84C, rgba(201,168,76,0.3))",
            marginBottom: "0.5rem",
          }}
        />

        {/* Brand */}
        <div>
          <p
            style={{
              color: "#6A6258",
              fontSize: "0.72rem",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              fontFamily: "Inter, sans-serif",
              marginBottom: "0.75rem",
            }}
          >
            The Blacklist
          </p>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              color: "#C9A84C",
              fontSize: "2.6rem",
              fontWeight: "normal",
              lineHeight: 1.1,
              letterSpacing: "0.01em",
              marginBottom: "0.65rem",
            }}
          >
            Raymond
            <br />
            Reddington
          </h1>
          <p
            style={{
              color: "#8A8278",
              fontSize: "0.85rem",
              letterSpacing: "0.1em",
              fontFamily: "Inter, sans-serif",
            }}
          >
            No.&nbsp;4 &bull; FBI&apos;s Most Wanted
          </p>
        </div>

        {/* Divider */}
        <div
          style={{
            borderTop: "1px solid rgba(201, 168, 76, 0.1)",
            marginTop: "0.5rem",
            paddingTop: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
          }}
        >
          <p
            style={{
              color: "#5A5550",
              fontSize: "0.72rem",
              textAlign: "center",
              fontFamily: "Inter, sans-serif",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Authenticate to proceed
          </p>

          <button
            className="login-btn"
            onClick={() => signIn("google", { callbackUrl: "/chat" })}
          >
            <GoogleIcon />
            Continue with Google
          </button>

        </div>

        <p
          style={{
            color: "#3A3530",
            fontSize: "0.68rem",
            textAlign: "center",
            fontFamily: "Inter, sans-serif",
            letterSpacing: "0.06em",
            marginTop: "0.25rem",
          }}
        >
          Your conversations are private &amp; secured
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
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


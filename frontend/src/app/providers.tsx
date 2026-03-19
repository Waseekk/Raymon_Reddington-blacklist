"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#161010",
            color: "#E8E0D0",
            border: "1px solid #2A2020",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.875rem",
          },
          error: {
            iconTheme: { primary: "#C9A84C", secondary: "#161010" },
          },
          success: {
            iconTheme: { primary: "#C9A84C", secondary: "#161010" },
          },
        }}
      />
    </NextAuthSessionProvider>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Raymond Reddington",
  description: "Concierge of Crime",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: "#0A0A0A", minHeight: "100vh" }}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getSettings, updateSettings, type UserSettings } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onKeyChange: (hasKey: boolean) => void;
}

export default function SettingsModal({ isOpen, onClose, token, onKeyChange }: Props) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    getSettings(token)
      .then(setSettings)
      .catch(() => toast.error("Failed to load settings"));
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!keyInput.startsWith("sk-ant-")) {
      toast.error("API key must start with sk-ant-");
      return;
    }
    setLoading(true);
    try {
      const updated = await updateSettings(token, keyInput);
      setSettings(updated);
      setKeyInput("");
      onKeyChange(updated.has_api_key);
      toast.success("API key saved");
    } catch {
      toast.error("Failed to save API key");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      const updated = await updateSettings(token, null);
      setSettings(updated);
      onKeyChange(false);
      toast.success("API key removed");
    } catch {
      toast.error("Failed to remove API key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#161010",
          border: "1px solid #2A2020",
          borderRadius: 12,
          padding: "2rem",
          width: "min(480px, 90vw)",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "Georgia, serif", color: "#C9A84C", fontSize: "1.25rem" }}>
            Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#8A7F70",
              cursor: "pointer",
              fontSize: "1.5rem",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* API Key section */}
        <div>
          <h3
            style={{
              color: "#E8E0D0",
              fontSize: "0.9rem",
              marginBottom: "0.5rem",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
            }}
          >
            Anthropic API Key
          </h3>
          <p
            style={{
              color: "#8A7F70",
              fontSize: "0.8rem",
              lineHeight: 1.6,
              marginBottom: "1rem",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Provide your own key to bypass the daily message limit. Your key is stored securely and
            never shared.
          </p>

          {settings?.has_api_key ? (
            <div
              style={{
                background: "#0A0A0A",
                border: "1px solid #2A2020",
                borderRadius: 6,
                padding: "0.75rem 1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
              }}
            >
              <span
                style={{ color: "#8A7F70", fontFamily: "monospace", fontSize: "0.875rem" }}
              >
                sk-ant-•••{settings.api_key_preview}
              </span>
              <span style={{ color: "#C9A84C", fontSize: "0.75rem", fontFamily: "Inter, sans-serif" }}>
                Active
              </span>
            </div>
          ) : (
            <p
              style={{
                color: "#8A7F70",
                fontSize: "0.8rem",
                marginBottom: "0.75rem",
                fontFamily: "Inter, sans-serif",
              }}
            >
              No API key saved. Using shared daily limit.
            </p>
          )}

          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="sk-ant-api03-..."
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            style={{
              width: "100%",
              background: "#0A0A0A",
              border: "1px solid #2A2020",
              borderRadius: 6,
              color: "#E8E0D0",
              padding: "0.75rem 1rem",
              fontSize: "0.875rem",
              fontFamily: "monospace",
              outline: "none",
              marginBottom: "0.75rem",
              boxSizing: "border-box",
            }}
          />

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={handleSave}
              disabled={loading || !keyInput}
              style={{
                background: "#C9A84C",
                border: "none",
                borderRadius: 6,
                color: "#0A0A0A",
                padding: "0.6rem 1.25rem",
                cursor: loading || !keyInput ? "not-allowed" : "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
                opacity: loading || !keyInput ? 0.5 : 1,
                fontFamily: "Inter, sans-serif",
              }}
            >
              Save Key
            </button>
            {settings?.has_api_key && (
              <button
                onClick={handleRemove}
                disabled={loading}
                style={{
                  background: "transparent",
                  border: "1px solid #2A2020",
                  borderRadius: 6,
                  color: "#8A7F70",
                  padding: "0.6rem 1.25rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  opacity: loading ? 0.5 : 1,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Remove Key
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

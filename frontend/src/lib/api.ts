const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

export interface Usage {
  used: number;
  limit: number;
  remaining: number;
  reset_at: string;
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function getConversations(token: string): Promise<Conversation[]> {
  const res = await fetch(`${BACKEND_URL}/api/conversations`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch conversations");
  return res.json();
}

export async function createConversation(token: string): Promise<{ id: string; title: string }> {
  const res = await fetch(`${BACKEND_URL}/api/conversations`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to create conversation");
  return res.json();
}

export async function getConversationMessages(
  convId: string,
  token: string,
): Promise<{ role: "user" | "assistant"; content: string }[]> {
  const res = await fetch(`${BACKEND_URL}/api/conversations/${convId}/messages`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load messages");
  return res.json();
}

export async function deleteConversation(id: string, token: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/conversations/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 204) throw new Error("Failed to delete conversation");
}

export interface AdminUser {
  id: string;
  name: string | null;
  picture: string | null;
  provider: string | null;
  created_at: string;
  conversations: number;
  messages: number;
}

export async function getAdminUsers(token: string): Promise<{ total: number; users: AdminUser[] }> {
  const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch admin users");
  return res.json();
}

export interface UserSettings {
  has_api_key: boolean;
  api_key_preview: string | null;
}

export async function getSettings(token: string): Promise<UserSettings> {
  const res = await fetch(`${BACKEND_URL}/api/settings`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export async function updateSettings(token: string, apiKey: string | null): Promise<UserSettings> {
  const res = await fetch(`${BACKEND_URL}/api/settings`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ api_key: apiKey }),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
}

export interface AdminConversation {
  id: string;
  title: string;
  message_count: number;
  updated_at: string | null;
  created_at: string | null;
}

export interface AdminMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string | null;
}

export async function getAdminUserConversations(
  userId: string,
  token: string,
): Promise<AdminConversation[]> {
  const res = await fetch(
    `${BACKEND_URL}/api/admin/users/${encodeURIComponent(userId)}/conversations`,
    { headers: authHeaders(token), cache: "no-store" },
  );
  if (!res.ok) throw new Error("Failed to fetch user conversations");
  return res.json();
}

export async function getAdminConversationMessages(
  convId: string,
  token: string,
): Promise<{ conversation: { id: string; title: string; user_id: string }; messages: AdminMessage[] }> {
  const res = await fetch(`${BACKEND_URL}/api/admin/conversations/${convId}/messages`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch conversation messages");
  return res.json();
}

export interface AdminConfig {
  daily_message_limit: number;
}

export async function getAdminConfig(token: string): Promise<AdminConfig> {
  const res = await fetch(`${BACKEND_URL}/api/admin/config`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch admin config");
  return res.json();
}

export async function updateAdminConfig(
  token: string,
  patch: Partial<AdminConfig>,
): Promise<AdminConfig> {
  const res = await fetch(`${BACKEND_URL}/api/admin/config`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update admin config");
  return res.json();
}

export async function getUsage(token: string): Promise<Usage> {
  const res = await fetch(`${BACKEND_URL}/api/usage`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch usage");
  return res.json();
}

export async function streamChat(
  convId: string,
  message: string,
  onChunk: (chunk: string) => void,
  token: string,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/chat`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ conversation_id: convId, message }),
    cache: "no-store",
    signal,
  });

  if (!res.ok) throw new Error(`Chat error: ${res.status}`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        try {
          onChunk(JSON.parse(data));
        } catch {
          // ignore malformed lines
        }
      }
    }
  }
}

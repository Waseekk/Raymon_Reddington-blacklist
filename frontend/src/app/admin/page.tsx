"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getAdminUsers, AdminUser } from "@/lib/api";

const ADMIN_EMAIL = "waseekirtefa@gmail.com";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = (session as any)?.rawToken as string | undefined;
  const userEmail = session?.user?.email;

  useEffect(() => {
    if (status === "loading") return;
    if (!token || userEmail !== ADMIN_EMAIL) {
      setLoading(false);
      return;
    }
    getAdminUsers(token)
      .then((data) => {
        setTotal(data.total);
        setUsers(data.users);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, status, userEmail]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
        <p style={{ color: "#C9A84C" }}>Loading…</p>
      </div>
    );
  }

  if (!session || userEmail !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
        <p className="text-red-400">Access denied.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ background: "#0A0A0A", color: "#e5e5e5" }}>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#C9A84C", fontFamily: "Georgia, serif" }}>
          Admin Panel
        </h1>
        <p className="text-sm mb-8" style={{ color: "#888" }}>
          Total users: <span style={{ color: "#C9A84C" }}>{total}</span>
        </p>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid #2a2020" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#161010", borderBottom: "1px solid #2a2020" }}>
                <th className="text-left px-4 py-3" style={{ color: "#C9A84C" }}>Name</th>
                <th className="text-left px-4 py-3" style={{ color: "#C9A84C" }}>Email</th>
                <th className="text-left px-4 py-3" style={{ color: "#C9A84C" }}>Provider</th>
                <th className="text-left px-4 py-3" style={{ color: "#C9A84C" }}>Joined</th>
                <th className="text-right px-4 py-3" style={{ color: "#C9A84C" }}>Convos</th>
                <th className="text-right px-4 py-3" style={{ color: "#C9A84C" }}>Messages</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={u.id}
                  style={{
                    background: i % 2 === 0 ? "#0f0d0d" : "#161010",
                    borderBottom: "1px solid #1a1515",
                  }}
                >
                  <td className="px-4 py-3 flex items-center gap-2">
                    {u.picture && (
                      <img src={u.picture} alt="" className="w-7 h-7 rounded-full" />
                    )}
                    {u.name ?? "—"}
                  </td>
                  <td className="px-4 py-3" style={{ color: "#aaa" }}>{u.id}</td>
                  <td className="px-4 py-3 capitalize" style={{ color: "#aaa" }}>{u.provider ?? "—"}</td>
                  <td className="px-4 py-3" style={{ color: "#aaa" }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">{u.conversations}</td>
                  <td className="px-4 py-3 text-right">{u.messages}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center" style={{ color: "#555" }}>
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

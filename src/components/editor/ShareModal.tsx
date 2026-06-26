"use client";

import { useState, useEffect } from "react";
import { X, Mail, UserPlus, Trash2, Loader2, Shield } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface Permission {
  id: string;
  role: string;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
}

interface ShareModalProps {
  documentId: string;
  onClose: () => void;
}

export default function ShareModal({ documentId, onClose }: ShareModalProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchPerms = async () => {
      try {
        const res = await fetch(`/api/documents/${documentId}/permissions`);
        if (res.ok) setPermissions(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchPerms();
  }, [documentId]);

  const shareDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setSharing(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setPermissions(prev => [...prev, data]);
      setEmail("");
      setSuccess(`Shared with ${data.user.name}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch { setError("Failed to share"); }
    finally { setSharing(false); }
  };

  const removePermission = async (userId: string) => {
    try {
      const res = await fetch(`/api/documents/${documentId}/permissions?userId=${userId}`, { method: "DELETE" });
      if (res.ok) setPermissions(prev => prev.filter(p => p.user.id !== userId));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={18} style={{ color: "var(--color-primary-light)" }} />
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Share Document</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={16} /></button>
        </div>

        <form onSubmit={shareDoc} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Mail size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input type="email" className="input" style={{ paddingLeft: 32, fontSize: 13 }} placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <select value={role} onChange={e => setRole(e.target.value as "editor" | "viewer")} className="input" style={{ width: 100, fontSize: 13 }}>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button type="submit" className="btn btn-primary btn-sm" disabled={sharing}>
            {sharing ? <Loader2 size={14} className="animate-spin-slow" /> : <UserPlus size={14} />}
          </button>
        </form>

        {error && <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", color: "var(--color-error)", fontSize: 12, marginBottom: 12 }}>{error}</div>}
        {success && <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(16,185,129,0.1)", color: "var(--color-success)", fontSize: 12, marginBottom: 12 }}>{success}</div>}

        <div>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "var(--text-secondary)" }}>People with access</h4>
          {loading ? (
            <div style={{ padding: 20, textAlign: "center" }}><Loader2 size={16} className="animate-spin-slow" style={{ color: "var(--text-muted)" }} /></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {permissions.map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 10, background: "var(--bg-elevated)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white" }}>
                      {getInitials(p.user.name)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{p.user.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.user.email}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className={`badge ${p.role === "owner" ? "badge-primary" : p.role === "editor" ? "badge-success" : "badge-neutral"}`}>{p.role}</span>
                    {p.role !== "owner" && (
                      <button onClick={() => removePermission(p.user.id)} className="btn btn-ghost btn-icon" style={{ width: 24, height: 24, color: "var(--color-error)" }}><Trash2 size={12} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

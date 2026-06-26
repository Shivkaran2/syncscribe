"use client";

import { useState, useEffect } from "react";
import { X, Clock, RotateCcw, Loader2, User, ChevronRight } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { DocumentVersion } from "@/types";

interface VersionPanelProps {
  documentId: string;
  canEdit: boolean;
  onClose: () => void;
  onRestore: () => void;
}

export default function VersionPanel({ documentId, canEdit, onClose, onRestore }: VersionPanelProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const res = await fetch(`/api/documents/${documentId}/versions`);
        if (res.ok) setVersions(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchVersions();
  }, [documentId]);

  const restoreVersion = async (versionId: string) => {
    if (!canEdit || !confirm("Restore to this version? Current state will be auto-saved.")) return;
    setRestoring(versionId);
    try {
      const res = await fetch(`/api/documents/${documentId}/versions/${versionId}/restore`, { method: "POST" });
      if (res.ok) onRestore();
    } catch (e) { console.error(e); }
    finally { setRestoring(null); }
  };

  return (
    <div className="animate-slide-in-right" style={{ width: 320, borderLeft: "1px solid var(--border-subtle)", background: "var(--bg-surface)", display: "flex", flexDirection: "column", height: "calc(100vh - 92px)", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Clock size={16} style={{ color: "var(--color-primary-light)" }} />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Version History</h3>
        </div>
        <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ width: 28, height: 28 }}><X size={14} /></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Loader2 size={20} className="animate-spin-slow" style={{ color: "var(--text-muted)" }} /></div>
        ) : versions.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <Clock size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No versions yet. Click save to create a snapshot.</p>
          </div>
        ) : (
          versions.map((v, i) => (
            <div key={v.id} style={{ padding: "12px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: i === 0 ? "var(--color-primary)" : "var(--bg-overlay)", border: `2px solid ${i === 0 ? "var(--color-primary)" : "var(--border-strong)"}`, flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: i === 0 ? "var(--color-primary-light)" : "var(--text-primary)" }}>v{v.versionNumber}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatRelativeTime(v.createdAt)}</span>
                  </div>
                  {v.description && <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>{v.description}</p>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}><User size={10} />{v.creator.name}</span>
                    {canEdit && i > 0 && (
                      <button onClick={() => restoreVersion(v.id)} className="btn btn-ghost btn-sm" disabled={restoring === v.id} style={{ fontSize: 11, padding: "3px 8px", gap: 4 }}>
                        {restoring === v.id ? <Loader2 size={12} className="animate-spin-slow" /> : <><RotateCcw size={11} /> Restore</>}
                      </button>
                    )}
                  </div>
                  {i === 0 && <span className="badge badge-success" style={{ marginTop: 6 }}>Latest</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border-subtle)", fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
        <ChevronRight size={10} />{versions.length} version{versions.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

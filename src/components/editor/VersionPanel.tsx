"use client";

import { useState, useEffect } from "react";
import { X, Clock, RotateCcw, Loader2, User, ChevronRight, Eye } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { DocumentVersion } from "@/types";
import {
  listVersions,
  restoreVersion as restoreVersionAction,
  getVersionPreview,
  type VersionPreview,
} from "@/lib/actions/versions";

interface VersionPanelProps {
  documentId: string;
  canEdit: boolean;
  // Bumped by the parent whenever a new snapshot is saved, so the already-open
  // panel re-fetches instead of showing a stale list.
  refreshKey?: number;
  onClose: () => void;
  // Receives the restored version's HTML so the caller can apply it to the
  // live editor (which propagates the change through Yjs to the server).
  onRestore: (html: string) => void;
}

export default function VersionPanel({ documentId, canEdit, refreshKey = 0, onClose, onRestore }: VersionPanelProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  // Preview state
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<VersionPreview | null>(null);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const res = await listVersions(documentId);
        if (res.ok) setVersions(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchVersions();
  }, [documentId, refreshKey]);

  const openPreview = async (versionId: string) => {
    setPreviewId(versionId);
    setPreview(null);
    setPreviewError("");
    setPreviewLoading(true);
    try {
      const res = await getVersionPreview(documentId, versionId);
      if (res.ok) setPreview(res.data);
      else setPreviewError(res.error);
    } catch (e) {
      console.error(e);
      setPreviewError("Failed to load preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewId(null);
    setPreview(null);
    setPreviewError("");
  };

  const restoreVersion = async (versionId: string) => {
    if (!canEdit || !confirm("Restore to this version? Current state will be auto-saved.")) return;
    setRestoring(versionId);
    try {
      const res = await restoreVersionAction(documentId, versionId);
      if (res.ok) {
        onRestore(res.data.html);
        // Restoring also creates an auto-save version — reload the list.
        const refreshed = await listVersions(documentId);
        if (refreshed.ok) setVersions(refreshed.data);
      }
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
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <button onClick={() => openPreview(v.id)} className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: "3px 8px", gap: 4 }} title="Preview this version">
                        <Eye size={11} /> Preview
                      </button>
                      {canEdit && i > 0 && (
                        <button onClick={() => restoreVersion(v.id)} className="btn btn-ghost btn-sm" disabled={restoring === v.id} style={{ fontSize: 11, padding: "3px 8px", gap: 4 }}>
                          {restoring === v.id ? <Loader2 size={12} className="animate-spin-slow" /> : <><RotateCcw size={11} /> Restore</>}
                        </button>
                      )}
                    </div>
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

      {/* Preview modal */}
      {previewId && (
        <div className="modal-overlay" onClick={closePreview}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 720, width: "90%", display: "flex", flexDirection: "column", maxHeight: "85vh", padding: 0 }}
          >
            {/* Header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <Eye size={18} style={{ color: "var(--color-primary-light)", flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {preview ? (preview.title || "Untitled") : "Preview"}
                    {preview && <span style={{ color: "var(--text-muted)", fontWeight: 500 }}> · v{preview.versionNumber}</span>}
                  </h2>
                  {preview && (
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      {preview.creatorName} · {formatRelativeTime(preview.createdAt)}
                      {preview.description ? ` · ${preview.description}` : ""}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={closePreview} className="btn btn-ghost btn-icon" style={{ flexShrink: 0 }}><X size={16} /></button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px 24px" }}>
              {previewLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                  <Loader2 size={24} className="animate-spin-slow" style={{ color: "var(--text-muted)" }} />
                </div>
              ) : previewError ? (
                <div style={{ padding: "16px", borderRadius: 8, background: "rgba(239,68,68,0.1)", color: "var(--color-error)", fontSize: 13 }}>{previewError}</div>
              ) : preview && preview.isEmpty ? (
                <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                  This version is empty.
                </div>
              ) : preview ? (
                <div
                  className="tiptap-editor"
                  style={{ padding: 0 }}
                  dangerouslySetInnerHTML={{ __html: preview.html }}
                />
              ) : null}
            </div>

            {/* Footer */}
            {preview && (
              <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button onClick={closePreview} className="btn btn-secondary btn-sm">Close</button>
                {canEdit && versions.length > 0 && versions[0].id !== previewId && (
                  <button
                    onClick={() => {
                      const id = previewId;
                      closePreview();
                      if (id) restoreVersion(id);
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ gap: 4 }}
                  >
                    <RotateCcw size={13} /> Restore this version
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

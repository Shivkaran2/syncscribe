"use client";

import { useState, useEffect, useMemo, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import * as Y from "yjs";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Collaboration from "@tiptap/extension-collaboration";
import { useSyncEngine } from "@/hooks/useSyncEngine";
import EditorToolbar from "@/components/editor/Toolbar";
import SyncStatusIndicator from "@/components/editor/SyncStatus";
import VersionPanel from "@/components/editor/VersionPanel";
import ShareModal from "@/components/editor/ShareModal";
import AIAssistant from "@/components/editor/AIAssistant";
import { getDocument, updateDocumentTitle } from "@/lib/actions/documents";
import { createVersion as createVersionAction } from "@/lib/actions/versions";
import {
  ArrowLeft,
  Save,
  Share2,
  Clock,
  Sparkles,
  Loader2,
  FileText,
} from "lucide-react";
import Link from "next/link";

interface DocumentData {
  id: string;
  title: string;
  ownerId: string;
  userRole: string;
  owner: { id: string; name: string; email: string; avatarUrl: string | null };
  permissions: {
    id: string;
    role: string;
    user: { id: string; name: string; email: string; avatarUrl: string | null };
  }[];
  _count?: { versions: number };
}

export default function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [titleSaving, setTitleSaving] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [versionsRefreshKey, setVersionsRefreshKey] = useState(0);

  const yDoc = useMemo(() => new Y.Doc(), []);
  const canEdit = document?.userRole === "owner" || document?.userRole === "editor";

  const { syncStatus, pushToServer, isOnline } = useSyncEngine({
    documentId: id,
    yDoc,
    canEdit: canEdit || false,
  });

  // Editor setup
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        undoRedo: false, // Yjs handles history
      }),
      Placeholder.configure({
        placeholder: "Start writing... ✍️",
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color,
      LinkExtension.configure({
        openOnClick: false,
      }),
      ImageExtension,
      Collaboration.configure({
        document: yDoc,
      }),
    ],
    editable: canEdit || false,
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
    immediatelyRender: false,
  });

  // Fetch document data
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      const fetchDoc = async () => {
        try {
          const res = await getDocument(id);
          if (!res.ok) {
            router.push("/dashboard");
            return;
          }
          setDocument(res.data);
          setTitle(res.data.title);
        } catch (error) {
          console.error("Failed to fetch document:", error);
          router.push("/dashboard");
        } finally {
          setLoading(false);
        }
      };
      fetchDoc();
    }
  }, [id, status, router]);

  // Update editor editable state when canEdit changes
  useEffect(() => {
    if (editor && canEdit !== undefined) {
      editor.setEditable(canEdit || false);
    }
  }, [editor, canEdit]);

  // Save title
  const saveTitle = useCallback(async () => {
    if (!title.trim() || title === document?.title) return;
    setTitleSaving(true);
    try {
      await updateDocumentTitle(id, title);
    } catch (error) {
      console.error("Failed to save title:", error);
    } finally {
      setTitleSaving(false);
    }
  }, [title, document?.title, id]);

  // Create version snapshot
  const createVersion = async () => {
    setSavingVersion(true);
    try {
      // Capture the client's live Yjs state — the database copy lags behind
      // the editor because the WebSocket server persists on a debounce.
      const state = await pushToServer();

      const res = await createVersionAction(id, {
        description: `Manual snapshot`,
        title: title,
        state,
      });

      if (res.ok) {
        setShowVersions(true);
        // Force the panel to re-fetch if it is already open.
        setVersionsRefreshKey((k) => k + 1);
      }
    } catch (error) {
      console.error("Failed to create version:", error);
    } finally {
      setSavingVersion(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-base)",
        }}
      >
        <Loader2
          size={32}
          className="animate-spin-slow"
          style={{ color: "var(--color-primary)" }}
        />
      </div>
    );
  }

  if (!document) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Header */}
      <header
        className="glass"
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 45,
        }}
      >
        {/* Left: Back + Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <Link href="/dashboard" className="btn btn-ghost btn-icon" title="Back to Dashboard">
            <ArrowLeft size={18} />
          </Link>

          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background:
                "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FileText size={14} color="white" />
          </div>

          <input
            id="document-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
            disabled={!canEdit}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-primary)",
              fontSize: 16,
              fontWeight: 600,
              outline: "none",
              flex: 1,
              minWidth: 0,
              padding: "4px 8px",
              borderRadius: 6,
              transition: "background var(--transition-fast)",
            }}
            onFocus={(e) => {
              e.target.style.background = "var(--bg-elevated)";
            }}
            onBlurCapture={(e) => {
              e.target.style.background = "transparent";
            }}
          />

          {titleSaving && (
            <Loader2
              size={14}
              className="animate-spin-slow"
              style={{ color: "var(--text-muted)" }}
            />
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <SyncStatusIndicator syncStatus={syncStatus} isOnline={isOnline} />

          {canEdit && (
            <>
              <button
                id="ai-assistant-btn"
                onClick={() => setShowAI(!showAI)}
                className={`btn btn-ghost btn-sm ${showAI ? "is-active" : ""}`}
                title="AI Assistant"
                style={{
                  color: showAI ? "var(--color-primary-light)" : undefined,
                }}
              >
                <Sparkles size={16} />
              </button>

              <button
                id="save-version-btn"
                onClick={createVersion}
                className="btn btn-ghost btn-sm"
                disabled={savingVersion}
                title="Save Version"
              >
                {savingVersion ? (
                  <Loader2 size={16} className="animate-spin-slow" />
                ) : (
                  <Save size={16} />
                )}
              </button>
            </>
          )}

          <button
            id="version-history-btn"
            onClick={() => setShowVersions(!showVersions)}
            className={`btn btn-ghost btn-sm ${showVersions ? "is-active" : ""}`}
            title="Version History"
            style={{
              color: showVersions ? "var(--color-primary-light)" : undefined,
            }}
          >
            <Clock size={16} />
          </button>

          {document.userRole === "owner" && (
            <button
              id="share-btn"
              onClick={() => setShowShare(true)}
              className="btn btn-primary btn-sm"
            >
              <Share2 size={14} /> Share
            </button>
          )}
        </div>
      </header>

      {/* Toolbar */}
      {canEdit && editor && <EditorToolbar editor={editor} />}

      {/* Main content area */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Editor */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {!canEdit && (
            <div
              style={{
                padding: "8px 16px",
                background: "rgba(245, 158, 11, 0.1)",
                borderBottom: "1px solid rgba(245, 158, 11, 0.2)",
                fontSize: 13,
                color: "var(--color-warning)",
                textAlign: "center",
              }}
            >
              🔒 You have view-only access to this document
            </div>
          )}
          <EditorContent editor={editor} />
        </div>

        {/* Version Panel (side panel) */}
        {showVersions && (
          <VersionPanel
            documentId={id}
            canEdit={canEdit || false}
            refreshKey={versionsRefreshKey}
            onClose={() => setShowVersions(false)}
            onRestore={(html) => {
              // Apply the restored content to the live editor. This mutates the
              // shared Yjs doc (delete + insert), which syncs to the server and
              // other collaborators — unlike overwriting server state, which a
              // CRDT would simply re-merge away.
              if (editor) {
                editor.commands.setContent(html);
                editor.commands.focus("end");
              }
            }}
          />
        )}

        {/* AI Assistant Panel */}
        {showAI && canEdit && editor && (
          <AIAssistant
            editor={editor}
            onClose={() => setShowAI(false)}
          />
        )}
      </div>

      {/* Share Modal */}
      {showShare && (
        <ShareModal
          documentId={id}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

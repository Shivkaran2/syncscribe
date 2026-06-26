"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Clock,
  Users,
  MoreVertical,
  Trash2,
  LogOut,
  Loader2,
  FolderOpen,
  Sparkles,
} from "lucide-react";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { DocumentWithPermissions } from "@/types";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<(DocumentWithPermissions & { userRole: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated") {
      fetchDocuments();
    }
  }, [status, router, fetchDocuments]);

  const createDocument = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Document" }),
      });

      if (res.ok) {
        const doc = await res.json();
        router.push(`/document/${doc.id}`);
      }
    } catch (error) {
      console.error("Failed to create document:", error);
    } finally {
      setCreating(false);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
    setMenuOpen(null);
  };

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Loader2 size={32} className="animate-spin-slow" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      {/* Header */}
      <header
        className="glass"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          padding: "12px 24px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              color: "var(--text-primary)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background:
                  "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={20} color="white" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800 }}>SyncDoc</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 10,
                background: "var(--bg-elevated)",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "white",
                }}
              >
                {getInitials(session?.user?.name || "U")}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {session?.user?.name}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="btn btn-ghost btn-sm"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
              My Documents
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              {documents.length} document{documents.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                id="search-documents"
                type="text"
                className="input"
                style={{ paddingLeft: 36, width: 240 }}
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Create button */}
            <button
              id="create-document"
              onClick={createDocument}
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? (
                <Loader2 size={16} className="animate-spin-slow" />
              ) : (
                <Plus size={16} />
              )}
              New Document
            </button>
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocs.length === 0 ? (
          <div
            className="animate-fade-in"
            style={{
              textAlign: "center",
              padding: "80px 20px",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: "var(--bg-elevated)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <FolderOpen size={32} style={{ color: "var(--text-muted)" }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              {searchQuery ? "No documents found" : "No documents yet"}
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: 14,
                marginBottom: 24,
              }}
            >
              {searchQuery
                ? "Try a different search term"
                : "Create your first document to get started"}
            </p>
            {!searchQuery && (
              <button
                onClick={createDocument}
                className="btn btn-primary"
                disabled={creating}
              >
                <Plus size={16} /> Create Document
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {filteredDocs.map((doc, i) => (
              <div
                key={doc.id}
                className="glass-card animate-fade-in"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  animationDelay: `${i * 50}ms`,
                  animationFillMode: "both",
                  position: "relative",
                }}
              >
                {/* Card content - clickable */}
                <Link
                  href={`/document/${doc.id}`}
                  style={{
                    display: "block",
                    padding: 24,
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  {/* Title */}
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      marginBottom: 8,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      paddingRight: 32,
                    }}
                  >
                    {doc.title}
                  </h3>

                  {/* Content preview */}
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      marginBottom: 16,
                      minHeight: 40,
                    }}
                  >
                    {doc.content || "Empty document"}
                  </p>

                  {/* Meta info */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "var(--text-muted)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Clock size={12} />
                        {formatRelativeTime(doc.updatedAt)}
                      </span>
                      {doc.permissions.length > 1 && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Users size={12} />
                          {doc.permissions.length}
                        </span>
                      )}
                    </div>

                    <span
                      className={`badge ${
                        doc.userRole === "owner"
                          ? "badge-primary"
                          : doc.userRole === "editor"
                          ? "badge-success"
                          : "badge-neutral"
                      }`}
                    >
                      {doc.userRole}
                    </span>
                  </div>
                </Link>

                {/* Menu button */}
                {doc.userRole === "owner" && (
                  <div style={{ position: "absolute", top: 16, right: 16 }}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setMenuOpen(menuOpen === doc.id ? null : doc.id);
                      }}
                      className="btn btn-ghost btn-icon"
                      style={{ width: 28, height: 28 }}
                    >
                      <MoreVertical size={14} />
                    </button>

                    {menuOpen === doc.id && (
                      <div
                        className="animate-scale-in"
                        style={{
                          position: "absolute",
                          right: 0,
                          top: 32,
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border-default)",
                          borderRadius: 10,
                          padding: 4,
                          minWidth: 140,
                          zIndex: 10,
                          boxShadow: "var(--shadow-lg)",
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            deleteDocument(doc.id);
                          }}
                          className="btn btn-ghost"
                          style={{
                            width: "100%",
                            justifyContent: "flex-start",
                            color: "var(--color-error)",
                            padding: "8px 12px",
                            fontSize: 13,
                          }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Close menu on outside click */}
      {menuOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 5 }}
          onClick={() => setMenuOpen(null)}
        />
      )}
    </div>
  );
}

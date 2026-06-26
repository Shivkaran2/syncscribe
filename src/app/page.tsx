"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Wifi,
  WifiOff,
  GitBranch,
  Shield,
  Sparkles,
  ArrowRight,
  Zap,
  RefreshCw,
  Clock,
  Users,
} from "lucide-react";

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  if (session) {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Navigation */}
      <nav
        className="glass"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: "12px 24px",
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
            href="/"
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
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>
              SyncDoc
            </span>
          </Link>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/login" className="btn btn-ghost">
              Sign In
            </Link>
            <Link href="/register" className="btn btn-primary">
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="hero-gradient"
        style={{
          paddingTop: 140,
          paddingBottom: 100,
          textAlign: "center",
          position: "relative",
        }}
      >
        <div
          className="animate-fade-in"
          style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}
        >
          <div
            className="badge badge-primary"
            style={{ marginBottom: 20, display: "inline-flex" }}
          >
            <Zap size={12} /> Local-First Architecture
          </div>

          <h1
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: 20,
              background:
                "linear-gradient(135deg, var(--text-primary) 0%, var(--color-primary-light) 50%, var(--color-accent-light) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Write Anywhere.
            <br />
            Sync Everywhere.
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              color: "var(--text-secondary)",
              maxWidth: 600,
              margin: "0 auto 32px",
              lineHeight: 1.6,
            }}
          >
            A collaborative document editor that works offline-first with
            deterministic CRDT conflict resolution. Zero latency editing.
            Automatic synchronization. Complete version history.
          </p>

          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link href="/register" className="btn btn-primary btn-lg">
              Start Writing Free <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="btn btn-secondary btn-lg">
              Sign In
            </Link>
          </div>
        </div>

        {/* Floating indicators */}
        <div
          className="animate-float"
          style={{
            position: "absolute",
            top: "30%",
            left: "8%",
            opacity: 0.6,
          }}
        >
          <div className="sync-indicator sync-synced glass" style={{ padding: "8px 16px" }}>
            <span className="sync-dot" />
            <span style={{ fontSize: 13 }}>Synced</span>
          </div>
        </div>

        <div
          className="animate-float"
          style={{
            position: "absolute",
            top: "40%",
            right: "8%",
            opacity: 0.6,
            animationDelay: "1s",
          }}
        >
          <div className="sync-indicator sync-offline glass" style={{ padding: "8px 16px" }}>
            <span className="sync-dot" />
            <WifiOff size={14} />
            <span style={{ fontSize: 13 }}>Offline — Still editing</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section
        className="feature-grid-bg"
        style={{ padding: "80px 24px" }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: 32,
              fontWeight: 800,
              marginBottom: 12,
            }}
          >
            Built for the Real World
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "var(--text-secondary)",
              marginBottom: 48,
              maxWidth: 500,
              margin: "0 auto 48px",
            }}
          >
            Every feature designed for reliability, speed, and collaboration
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 20,
            }}
          >
            {[
              {
                icon: <WifiOff size={24} />,
                title: "Offline-First",
                desc: "Edit with zero network dependency. Your data lives in IndexedDB locally. No spinners, no loading, no lag.",
                color: "var(--color-primary)",
              },
              {
                icon: <RefreshCw size={24} />,
                title: "CRDT Sync Engine",
                desc: "Yjs-powered conflict resolution that merges edits deterministically. No data loss, ever. Even with concurrent offline edits.",
                color: "var(--color-accent)",
              },
              {
                icon: <Clock size={24} />,
                title: "Version Time Travel",
                desc: "Capture snapshots, browse a timeline, and restore any previous version without corrupting the current document state.",
                color: "var(--color-warning)",
              },
              {
                icon: <Users size={24} />,
                title: "Real-Time Collaboration",
                desc: "See collaborators' cursors and edits in real-time. Share documents with Owner, Editor, or Viewer roles.",
                color: "var(--color-success)",
              },
              {
                icon: <Shield size={24} />,
                title: "Enterprise Security",
                desc: "JWT auth, Row Level Security, payload size limits, rate limiting, and strict role enforcement on every operation.",
                color: "var(--color-error)",
              },
              {
                icon: <Sparkles size={24} />,
                title: "AI Writing Assistant",
                desc: "Gemini-powered AI to improve, summarize, expand, fix grammar, and translate your text right in the editor.",
                color: "#a855f7",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="glass-card animate-fade-in"
                style={{
                  padding: 28,
                  animationDelay: `${i * 100}ms`,
                  animationFillMode: "both",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: `${feature.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: feature.color,
                    marginBottom: 16,
                  }}
                >
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                  {feature.title}
                </h3>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <div
            className="badge badge-primary"
            style={{ marginBottom: 16, display: "inline-flex" }}
          >
            <GitBranch size={12} /> Architecture
          </div>
          <h2
            style={{
              fontSize: 32,
              fontWeight: 800,
              marginBottom: 16,
            }}
          >
            How Sync Works
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              marginBottom: 40,
              lineHeight: 1.6,
            }}
          >
            CRDTs (Conflict-free Replicated Data Types) ensure every edit
            merges deterministically — no matter the order, no matter the
            timing.
          </p>

          <div
            className="glass-card"
            style={{
              padding: 32,
              textAlign: "left",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 24,
              }}
            >
              {[
                {
                  step: "01",
                  title: "Edit Locally",
                  desc: "Changes write to Yjs CRDT + IndexedDB instantly. Zero network blocking.",
                  icon: <Wifi size={20} />,
                },
                {
                  step: "02",
                  title: "Queue & Debounce",
                  desc: "Edits are batched and queued. Syncs fire on pause, not per keystroke.",
                  icon: <RefreshCw size={20} />,
                },
                {
                  step: "03",
                  title: "Merge & Resolve",
                  desc: "Server applies CRDT updates. All clients converge to same state.",
                  icon: <GitBranch size={20} />,
                },
              ].map((item, i) => (
                <div key={i}>
                  <span
                    style={{
                      fontSize: 36,
                      fontWeight: 900,
                      color: "var(--color-primary)",
                      opacity: 0.3,
                    }}
                  >
                    {item.step}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                      color: "var(--color-primary-light)",
                    }}
                  >
                    {item.icon}
                    <h4 style={{ fontWeight: 700, fontSize: 16 }}>
                      {item.title}
                    </h4>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <div
          className="glass-card animate-fade-in"
          style={{
            maxWidth: 600,
            margin: "0 auto",
            padding: 48,
            background:
              "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(6, 182, 212, 0.05))",
          }}
        >
          <h2
            style={{
              fontSize: 28,
              fontWeight: 800,
              marginBottom: 12,
            }}
          >
            Ready to write without limits?
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              marginBottom: 24,
            }}
          >
            Start editing offline, collaborate in real-time, and never lose a
            version.
          </p>
          <Link href="/register" className="btn btn-primary btn-lg">
            Create Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "32px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background:
                  "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={14} color="white" />
            </div>
            <span style={{ fontWeight: 700 }}>SyncDoc</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
            © {new Date().getFullYear()} SyncDoc. House of Edtech — Fullstack
            Developer Assignment.
          </p>
        </div>
      </footer>
    </div>
  );
}

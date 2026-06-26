import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SyncDoc — Local-First Collaborative Document Editor",
  description:
    "A local-first, collaborative document editor with offline synchronization, deterministic conflict resolution via CRDTs, and granular version control. Edit anywhere, sync everywhere.",
  keywords: [
    "collaborative editor",
    "local-first",
    "CRDT",
    "offline-first",
    "document editor",
    "real-time collaboration",
    "version control",
  ],
  authors: [{ name: "SyncDoc" }],
  openGraph: {
    title: "SyncDoc — Local-First Collaborative Document Editor",
    description:
      "Edit documents offline with zero latency. Automatic conflict resolution and real-time collaboration.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

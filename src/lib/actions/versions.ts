"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createVersionSchema } from "@/lib/validators";
import { getAccessRole, canEditRole } from "@/lib/documentAccess";
import {
  yDocSnapshotToHtml,
  plainTextToHtml,
} from "@/lib/versionHtml";
import type { ActionResult } from "@/lib/actions/types";
import type { DocumentVersion } from "@/types";

const CREATOR_SELECT = {
  select: { id: true, name: true, email: true, avatarUrl: true },
} as const;

// List a document's version snapshots (metadata only, no binary snapshot).
export async function listVersions(
  documentId: string
): Promise<ActionResult<DocumentVersion[]>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const role = await getAccessRole(documentId, session.user.id);
  if (!role) return { ok: false, error: "Document not found" };

  const versions = await prisma.documentVersion.findMany({
    where: { documentId },
    select: {
      id: true,
      documentId: true,
      versionNumber: true,
      title: true,
      content: true,
      createdBy: true,
      createdAt: true,
      description: true,
      creator: CREATOR_SELECT,
    },
    orderBy: { versionNumber: "desc" },
  });

  return { ok: true, data: versions };
}

// Create a version snapshot from the document's current state (editor only).
export async function createVersion(
  documentId: string,
  input: { title?: string; description?: string }
): Promise<ActionResult<DocumentVersion>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const role = await getAccessRole(documentId, session.user.id);
  if (!role) return { ok: false, error: "Document not found" };
  if (!canEditRole(role)) {
    return { ok: false, error: "You need edit access to create versions" };
  }

  const parsed = createVersionSchema.safeParse({ ...input, documentId });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { title: true, content: true, yDocState: true },
  });
  if (!doc) return { ok: false, error: "Document not found" };

  const latestVersion = await prisma.documentVersion.findFirst({
    where: { documentId },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true },
  });
  const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;

  const version = await prisma.documentVersion.create({
    data: {
      documentId,
      versionNumber: nextVersionNumber,
      title: parsed.data.title || doc.title,
      yDocSnapshot: doc.yDocState || Buffer.from([]),
      content: doc.content,
      createdBy: session.user.id,
      description: parsed.data.description || `Version ${nextVersionNumber}`,
    },
    select: {
      id: true,
      documentId: true,
      versionNumber: true,
      title: true,
      content: true,
      createdBy: true,
      createdAt: true,
      description: true,
      creator: CREATOR_SELECT,
    },
  });

  return { ok: true, data: version };
}

// Restore a document to a prior version, auto-saving the current state first.
//
// The document is a Yjs CRDT, so it cannot be reverted by overwriting the
// server state with an older snapshot — CRDT merges are additive and the
// client's IndexedDB copy would simply re-merge the newer state. Instead we
// return the version's HTML and let the client apply it to the live editor
// (`editor.commands.setContent`), producing real delete/insert operations that
// propagate to the WebSocket server, the database, and other collaborators.
export async function restoreVersion(
  documentId: string,
  versionId: string
): Promise<ActionResult<{ restoredVersion: number; html: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const role = await getAccessRole(documentId, session.user.id);
  if (!role) return { ok: false, error: "Document not found" };
  if (!canEditRole(role)) {
    return { ok: false, error: "You need edit access to restore versions" };
  }

  const version = await prisma.documentVersion.findUnique({
    where: { id: versionId, documentId },
    select: { versionNumber: true, yDocSnapshot: true, content: true },
  });
  if (!version) return { ok: false, error: "Version not found" };

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { content: true, yDocState: true },
  });
  if (!doc) return { ok: false, error: "Document not found" };

  const latestVersion = await prisma.documentVersion.findFirst({
    where: { documentId },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true },
  });
  const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;

  // Safety net: snapshot the current state before the client overwrites it.
  await prisma.documentVersion.create({
    data: {
      documentId,
      versionNumber: nextVersionNumber,
      title: `Auto-save before restore to v${version.versionNumber}`,
      yDocSnapshot: doc.yDocState || Buffer.from([]),
      content: doc.content,
      createdBy: session.user.id,
      description: `Auto-saved before restoring to version ${version.versionNumber}`,
    },
  });

  let html = yDocSnapshotToHtml(new Uint8Array(version.yDocSnapshot));
  if (!html && version.content) {
    html = plainTextToHtml(version.content);
  }

  return { ok: true, data: { restoredVersion: version.versionNumber, html } };
}

export interface VersionPreview {
  versionNumber: number;
  title: string | null;
  description: string | null;
  createdAt: Date;
  creatorName: string;
  html: string;
  isEmpty: boolean;
}

// Render a read-only HTML preview of a version's contents.
export async function getVersionPreview(
  documentId: string,
  versionId: string
): Promise<ActionResult<VersionPreview>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const role = await getAccessRole(documentId, session.user.id);
  if (!role) return { ok: false, error: "Document not found" };

  const version = await prisma.documentVersion.findUnique({
    where: { id: versionId, documentId },
    select: {
      versionNumber: true,
      title: true,
      description: true,
      createdAt: true,
      content: true,
      yDocSnapshot: true,
      creator: { select: { name: true } },
    },
  });
  if (!version) return { ok: false, error: "Version not found" };

  // Prefer the formatted snapshot; fall back to the plain-text content.
  let html = yDocSnapshotToHtml(new Uint8Array(version.yDocSnapshot));
  if (!html && version.content) {
    html = plainTextToHtml(version.content);
  }

  return {
    ok: true,
    data: {
      versionNumber: version.versionNumber,
      title: version.title,
      description: version.description,
      createdAt: version.createdAt,
      creatorName: version.creator.name,
      html,
      isEmpty: html.trim().length === 0,
    },
  };
}

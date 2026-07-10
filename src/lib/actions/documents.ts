"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createDocumentSchema, updateDocumentSchema } from "@/lib/validators";
import { getAccessRole, canEditRole } from "@/lib/documentAccess";
import type { ActionResult } from "@/lib/actions/types";
import type { DocumentWithPermissions } from "@/types";

const USER_SELECT = {
  select: { id: true, name: true, email: true, avatarUrl: true },
} as const;

export type DashboardDocument = DocumentWithPermissions & { userRole: string };

export interface DocumentDetail {
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

// List all documents the caller owns or has been granted access to.
export async function listDocuments(): Promise<ActionResult<DashboardDocument[]>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
  const userId = session.user.id;

  const documents = await prisma.document.findMany({
    where: {
      isDeleted: false,
      OR: [{ ownerId: userId }, { permissions: { some: { userId } } }],
    },
    // Explicit select excludes the binary yDocState from the response.
    select: {
      id: true,
      title: true,
      ownerId: true,
      content: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
      owner: USER_SELECT,
      permissions: { include: { user: USER_SELECT } },
      _count: { select: { versions: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const withRole = documents.map((doc) => {
    let userRole = "viewer";
    if (doc.ownerId === userId) {
      userRole = "owner";
    } else {
      const perm = doc.permissions.find((p) => p.userId === userId);
      if (perm) userRole = perm.role;
    }
    return { ...doc, userRole } as DashboardDocument;
  });

  return { ok: true, data: withRole };
}

// Fetch a single document's metadata (no binary state) with the caller's role.
export async function getDocument(
  id: string
): Promise<ActionResult<DocumentDetail>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const role = await getAccessRole(id, session.user.id);
  if (!role) return { ok: false, error: "Document not found" };

  const doc = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      ownerId: true,
      owner: USER_SELECT,
      permissions: {
        select: { id: true, role: true, user: USER_SELECT },
      },
      _count: { select: { versions: true } },
    },
  });

  if (!doc) return { ok: false, error: "Document not found" };
  return { ok: true, data: { ...doc, userRole: role } };
}

// Create a new document owned by the caller.
export async function createDocument(
  title: string
): Promise<ActionResult<{ id: string; title: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const parsed = createDocumentSchema.safeParse({ title });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const document = await prisma.document.create({
    data: {
      title: parsed.data.title,
      ownerId: session.user.id,
      permissions: {
        create: { userId: session.user.id, role: "owner" },
      },
    },
    select: { id: true, title: true },
  });

  return { ok: true, data: document };
}

// Update a document's title (owner/editor only).
export async function updateDocumentTitle(
  id: string,
  title: string
): Promise<ActionResult<{ id: string; title: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const role = await getAccessRole(id, session.user.id);
  if (!role) return { ok: false, error: "Document not found" };
  if (!canEditRole(role)) {
    return { ok: false, error: "Viewers cannot edit documents" };
  }

  const parsed = updateDocumentSchema.safeParse({ title });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const updated = await prisma.document.update({
    where: { id },
    data: { ...(parsed.data.title && { title: parsed.data.title }) },
    select: { id: true, title: true },
  });

  return { ok: true, data: updated };
}

// Soft-delete a document (owner only).
export async function deleteDocument(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const role = await getAccessRole(id, session.user.id);
  if (role !== "owner") {
    return { ok: false, error: "Only the owner can delete a document" };
  }

  await prisma.document.update({
    where: { id },
    data: { isDeleted: true },
  });

  return { ok: true, data: { id } };
}

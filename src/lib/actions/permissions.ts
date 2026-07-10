"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { shareDocumentSchema } from "@/lib/validators";
import type { ActionResult } from "@/lib/actions/types";

const USER_SELECT = {
  select: { id: true, name: true, email: true, avatarUrl: true },
} as const;

export interface PermissionEntry {
  id: string;
  role: string;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
}

// List everyone with access to a document (any collaborator may view this).
export async function listPermissions(
  documentId: string
): Promise<ActionResult<PermissionEntry[]>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
  const userId = session.user.id;

  const doc = await prisma.document.findUnique({
    where: { id: documentId, isDeleted: false },
    select: {
      ownerId: true,
      permissions: {
        select: { id: true, role: true, userId: true, user: USER_SELECT },
      },
    },
  });
  if (!doc) return { ok: false, error: "Document not found" };

  const hasAccess =
    doc.ownerId === userId || doc.permissions.some((p) => p.userId === userId);
  if (!hasAccess) return { ok: false, error: "Access denied" };

  const permissions = doc.permissions.map(({ id, role, user }) => ({
    id,
    role,
    user,
  }));
  return { ok: true, data: permissions };
}

// Share a document with another user by email (owner only).
export async function shareDocument(
  documentId: string,
  input: { email: string; role: "editor" | "viewer" }
): Promise<ActionResult<PermissionEntry>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const doc = await prisma.document.findUnique({
    where: { id: documentId, isDeleted: false },
    select: { ownerId: true },
  });
  if (!doc) return { ok: false, error: "Document not found" };
  if (doc.ownerId !== session.user.id) {
    return { ok: false, error: "Only the owner can share a document" };
  }

  const parsed = shareDocumentSchema.safeParse({ ...input, documentId });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const targetUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (!targetUser) {
    return { ok: false, error: "User not found with that email" };
  }
  if (targetUser.id === session.user.id) {
    return { ok: false, error: "You cannot share a document with yourself" };
  }

  const permission = await prisma.documentPermission.upsert({
    where: {
      documentId_userId: { documentId, userId: targetUser.id },
    },
    update: { role: parsed.data.role },
    create: {
      documentId,
      userId: targetUser.id,
      role: parsed.data.role,
    },
    select: { id: true, role: true, user: USER_SELECT },
  });

  return { ok: true, data: permission };
}

// Remove a collaborator's access (owner only).
export async function removePermission(
  documentId: string,
  userId: string
): Promise<ActionResult<{ userId: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const doc = await prisma.document.findUnique({
    where: { id: documentId, isDeleted: false },
    select: { ownerId: true },
  });
  if (!doc || doc.ownerId !== session.user.id) {
    return { ok: false, error: "Only the owner can manage permissions" };
  }
  if (userId === doc.ownerId) {
    return { ok: false, error: "Cannot remove the owner's permission" };
  }

  await prisma.documentPermission.delete({
    where: { documentId_userId: { documentId, userId } },
  });

  return { ok: true, data: { userId } };
}

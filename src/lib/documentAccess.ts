// Server-only helpers for resolving a user's role on a document.
// Not a "use server" module — these are internal helpers imported by actions.

import prisma from "@/lib/prisma";
import type { DocumentRole } from "@/types";

export type ResolvedRole = DocumentRole | null;

/**
 * Resolve the caller's role on a document, or null when the document does not
 * exist / is deleted / the caller has no access.
 */
export async function getAccessRole(
  documentId: string,
  userId: string
): Promise<ResolvedRole> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId, isDeleted: false },
    select: {
      ownerId: true,
      permissions: {
        where: { userId },
        select: { role: true },
      },
    },
  });

  if (!doc) return null;
  if (doc.ownerId === userId) return "owner";
  if (doc.permissions.length > 0) {
    return doc.permissions[0].role as DocumentRole;
  }
  return null;
}

export function canEditRole(role: ResolvedRole): boolean {
  return role === "owner" || role === "editor";
}

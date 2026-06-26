import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/documents/[id]/versions/[versionId]/restore - Restore to a version
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, versionId } = await params;

    // Check edit access
    const doc = await prisma.document.findUnique({
      where: { id, isDeleted: false },
      include: {
        permissions: { where: { userId: session.user.id } },
      },
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const hasEditAccess =
      doc.ownerId === session.user.id ||
      doc.permissions.some((p) => p.role === "owner" || p.role === "editor");

    if (!hasEditAccess) {
      return NextResponse.json(
        { error: "You need edit access to restore versions" },
        { status: 403 }
      );
    }

    // Get the version to restore
    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId, documentId: id },
    });

    if (!version) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    // First, save the current state as a new version (safety net)
    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentId: id },
      orderBy: { versionNumber: "desc" },
    });

    const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;

    await prisma.documentVersion.create({
      data: {
        documentId: id,
        versionNumber: nextVersionNumber,
        title: `Auto-save before restore to v${version.versionNumber}`,
        yDocSnapshot: doc.yDocState || Buffer.from([]),
        content: doc.content,
        createdBy: session.user.id,
        description: `Auto-saved before restoring to version ${version.versionNumber}`,
      },
    });

    // Restore the document state from the version
    await prisma.document.update({
      where: { id },
      data: {
        yDocState: version.yDocSnapshot,
        content: version.content,
      },
    });

    return NextResponse.json({
      message: `Document restored to version ${version.versionNumber}`,
      restoredVersion: version.versionNumber,
    });
  } catch (error) {
    console.error("Error restoring version:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

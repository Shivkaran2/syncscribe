import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createVersionSchema } from "@/lib/validators";

// GET /api/documents/[id]/versions - List versions
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check access
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

    const hasAccess =
      doc.ownerId === session.user.id ||
      doc.permissions.length > 0;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const versions = await prisma.documentVersion.findMany({
      where: { documentId: id },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { versionNumber: "desc" },
    });

    // Don't return the binary yDocSnapshot in list response
    const versionsWithoutSnapshot = versions.map(({ yDocSnapshot: _snapshot, ...rest }: any) => rest);

    return NextResponse.json(versionsWithoutSnapshot);
  } catch (error) {
    console.error("Error fetching versions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/documents/[id]/versions - Create a version snapshot
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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
      doc.permissions.some((p:any) => p.role === "owner" || p.role === "editor");

    if (!hasEditAccess) {
      return NextResponse.json(
        { error: "You need edit access to create versions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createVersionSchema.safeParse({
      ...body,
      documentId: id,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Get the latest version number
    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentId: id },
      orderBy: { versionNumber: "desc" },
    });

    const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;

    // Use the current yDocState from the document
    const yDocState = doc.yDocState || Buffer.from([]);

    const version = await prisma.documentVersion.create({
      data: {
        documentId: id,
        versionNumber: nextVersionNumber,
        title: parsed.data.title || doc.title,
        yDocSnapshot: yDocState,
        content: doc.content,
        createdBy: session.user.id,
        description: parsed.data.description || `Version ${nextVersionNumber}`,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    // Return without binary data
    const { yDocSnapshot: _snapshot, ...versionData } = version;

    return NextResponse.json(versionData, { status: 201 });
  } catch (error) {
    console.error("Error creating version:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

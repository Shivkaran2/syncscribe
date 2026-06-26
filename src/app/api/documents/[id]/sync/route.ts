import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MAX_SYNC_PAYLOAD_SIZE } from "@/lib/utils";

// POST /api/documents/[id]/sync - Sync Yjs document state
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

    // Check content length before parsing
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_SYNC_PAYLOAD_SIZE) {
      return NextResponse.json(
        { error: "Sync payload too large. Maximum size is 1MB." },
        { status: 413 }
      );
    }

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
        { error: "Viewers cannot push state updates" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Validate update data
    if (!body.update || typeof body.update !== "string") {
      return NextResponse.json(
        { error: "Invalid sync payload" },
        { status: 400 }
      );
    }

    // Decode and validate the base64 update
    let updateBuffer: Buffer;
    try {
      updateBuffer = Buffer.from(body.update, "base64");
    } catch {
      return NextResponse.json(
        { error: "Invalid base64 encoded update" },
        { status: 400 }
      );
    }

    // Size check on decoded payload
    if (updateBuffer.length > MAX_SYNC_PAYLOAD_SIZE) {
      return NextResponse.json(
        { error: "Decoded sync payload too large" },
        { status: 413 }
      );
    }

    // Update the document state
    await prisma.document.update({
      where: { id },
      data: {
        yDocState: updateBuffer,
        content: body.content || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Sync successful",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error syncing document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/documents/[id]/sync - Get current document state
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
      doc.ownerId === session.user.id || doc.permissions.length > 0;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      documentId: id,
      state: doc.yDocState
        ? Buffer.from(doc.yDocState).toString("base64")
        : null,
      updatedAt: doc.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching sync state:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

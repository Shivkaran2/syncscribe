import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updateDocumentSchema } from "@/lib/validators";

// Helper to check document access
async function checkAccess(documentId: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId, isDeleted: false },
    include: {
      permissions: { where: { userId } },
      owner: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });

  if (!doc) return { doc: null, role: null };

  let role = "viewer";
  if (doc.ownerId === userId) {
    role = "owner";
  } else if (doc.permissions.length > 0) {
    role = doc.permissions[0].role;
  } else {
    return { doc: null, role: null }; // No access
  }

  return { doc, role };
}

// GET /api/documents/[id] - Get a specific document
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
    const { doc, role } = await checkAccess(id, session.user.id);

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Fetch full document with all permissions
    const fullDoc = await prisma.document.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        permissions: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: { versions: true },
        },
      },
    });

    return NextResponse.json({ ...fullDoc, userRole: role });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/documents/[id] - Update document title
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { role } = await checkAccess(id, session.user.id);

    if (!role) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (role === "viewer") {
      return NextResponse.json(
        { error: "Viewers cannot edit documents" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...(parsed.data.title && { title: parsed.data.title }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Soft delete a document
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { role } = await checkAccess(id, session.user.id);

    if (role !== "owner") {
      return NextResponse.json(
        { error: "Only the owner can delete a document" },
        { status: 403 }
      );
    }

    await prisma.document.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ message: "Document deleted" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

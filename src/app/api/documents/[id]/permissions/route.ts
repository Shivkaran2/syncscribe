import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { shareDocumentSchema } from "@/lib/validators";

// GET /api/documents/[id]/permissions - List permissions
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

    // Check user has access
    const doc = await prisma.document.findUnique({
      where: { id, isDeleted: false },
      include: {
        permissions: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
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
      doc.permissions.some((p:any) => p.userId === session.user.id);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json(doc.permissions);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/documents/[id]/permissions - Share document
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

    // Only owner can share
    const doc = await prisma.document.findUnique({
      where: { id, isDeleted: false },
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (doc.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the owner can share a document" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = shareDocumentSchema.safeParse({
      ...body,
      documentId: id,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found with that email" },
        { status: 404 }
      );
    }

    if (targetUser.id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot share a document with yourself" },
        { status: 400 }
      );
    }

    // Upsert permission
    const permission = await prisma.documentPermission.upsert({
      where: {
        documentId_userId: {
          documentId: id,
          userId: targetUser.id,
        },
      },
      update: { role: parsed.data.role },
      create: {
        documentId: id,
        userId: targetUser.id,
        role: parsed.data.role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json(permission, { status: 201 });
  } catch (error) {
    console.error("Error sharing document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id]/permissions - Remove permission
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Only owner can remove permissions
    const doc = await prisma.document.findUnique({
      where: { id, isDeleted: false },
    });

    if (!doc || doc.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the owner can manage permissions" },
        { status: 403 }
      );
    }

    // Cannot remove owner's permission
    if (userId === doc.ownerId) {
      return NextResponse.json(
        { error: "Cannot remove the owner's permission" },
        { status: 400 }
      );
    }

    await prisma.documentPermission.delete({
      where: {
        documentId_userId: {
          documentId: id,
          userId,
        },
      },
    });

    return NextResponse.json({ message: "Permission removed" });
  } catch (error) {
    console.error("Error removing permission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

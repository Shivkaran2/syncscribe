import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createDocumentSchema } from "@/lib/validators";

// GET /api/documents - List all documents for the authenticated user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documents = await prisma.document.findMany({
      where: {
        isDeleted: false,
        OR: [
          { ownerId: session.user.id },
          {
            permissions: {
              some: { userId: session.user.id },
            },
          },
        ],
      },
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
      orderBy: { updatedAt: "desc" },
    });

    // Add the user's role to each document
    const documentsWithRole = documents.map((doc: any) => {
      let userRole = "viewer";
      if (doc.ownerId === session.user.id) {
        userRole = "owner";
      } else {
        const perm = doc.permissions.find(
          (p: any) => p.userId === session.user.id
        );
        if (perm) userRole = perm.role;
      }
      return { ...doc, userRole };
    });

    return NextResponse.json(documentsWithRole);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/documents - Create a new document
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const document = await prisma.document.create({
      data: {
        title: parsed.data.title,
        ownerId: session.user.id,
        permissions: {
          create: {
            userId: session.user.id,
            role: "owner",
          },
        },
      },
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
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

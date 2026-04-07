import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    if (!workspaceId) return NextResponse.json({ error: "workspaceId requerido" }, { status: 400 });

    // Verify user is a workspace member
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user!.id } },
    });
    if (!membership) return NextResponse.json({ error: "Sin acceso a este workspace" }, { status: 403 });

    // Support ?templates=true to return only template pages
    const templates = searchParams.get("templates") === "true";
    if (templates) {
      const tmplPages = await prisma.page.findMany({
        where: { createdById: user!.id, isTemplate: true, deletedAt: null },
        include: { blocks: { orderBy: { position: "asc" } } },
        orderBy: { position: "asc" },
      });
      return NextResponse.json(tmplPages);
    }

    // Support ?deleted=true to return soft-deleted pages for trash
    const deleted = searchParams.get("deleted") === "true";

    // Pages are private — only return pages created by this user
    const pages = await prisma.page.findMany({
      where: {
        workspaceId,
        createdById: user!.id,
        deletedAt: deleted ? { not: null } : null,
        isTemplate: false,
      },
      include: { blocks: { orderBy: { position: "asc" } } },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(pages);
  } catch (e) {
    console.error("Pages GET error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    const { title, emoji, workspaceId, parentId, isPrivate, isTemplate } = await request.json();
    if (!workspaceId) return NextResponse.json({ error: "workspaceId requerido" }, { status: 400 });

    // Verify user is a workspace member
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user!.id } },
    });
    if (!membership) return NextResponse.json({ error: "Sin acceso a este workspace" }, { status: 403 });

    const count = await prisma.page.count({ where: { workspaceId, createdById: user!.id } });

    const page = await prisma.page.create({
      data: {
        title: title || "Sin título",
        emoji: emoji || "📄",
        workspaceId,
        createdById: user!.id,
        parentId: parentId || null,
        isPrivate: isPrivate || false,
        isTemplate: isTemplate || false,
        position: count,
        blocks: { create: [{ type: "text", content: "", position: 0 }] },
      },
      include: { blocks: { orderBy: { position: "asc" } } },
    });

    return NextResponse.json(page);
  } catch (e) {
    console.error("Pages POST error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

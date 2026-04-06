import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { error } = await getAuthUser(request);
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    if (!workspaceId) return NextResponse.json({ error: "workspaceId requerido" }, { status: 400 });

    const pages = await prisma.page.findMany({
      where: { workspaceId, deletedAt: null },
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
    const { error } = await getAuthUser(request);
    if (error) return error;
    const { title, emoji, workspaceId, parentId, isPrivate } = await request.json();
    if (!workspaceId) return NextResponse.json({ error: "workspaceId requerido" }, { status: 400 });

    const count = await prisma.page.count({ where: { workspaceId } });

    const page = await prisma.page.create({
      data: {
        title: title || "Sin título",
        emoji: emoji || "📄",
        workspaceId,
        parentId: parentId || null,
        isPrivate: isPrivate || false,
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

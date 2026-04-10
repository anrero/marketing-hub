import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    const { id } = await params;

    // Verify ownership — only the page creator can view
    const page = await prisma.page.findUnique({
      where: { id },
      include: { blocks: { orderBy: { position: "asc" } } },
    });
    if (!page) return NextResponse.json({ error: "Página no encontrada" }, { status: 404 });
    if (page.createdById !== user!.id) {
      return NextResponse.json({ error: "Sin acceso a esta página" }, { status: 403 });
    }

    return NextResponse.json(page);
  } catch (e) {
    console.error("Page GET error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    const { id } = await params;

    // Verify ownership — only the page creator can edit
    const existing = await prisma.page.findUnique({ where: { id }, select: { createdById: true } });
    if (!existing) return NextResponse.json({ error: "Página no encontrada" }, { status: 404 });
    if (existing.createdById !== user!.id) {
      return NextResponse.json({ error: "Sin acceso a esta página" }, { status: 403 });
    }

    const data = await request.json();

    // Handle blocks update — replace all blocks
    if (data.blocks) {
      await prisma.block.deleteMany({ where: { pageId: id } });
      await prisma.block.createMany({
        data: data.blocks.map((b: { type: string; content: string; properties?: unknown }, i: number) => ({
          type: b.type || "text",
          content: b.content || "",
          properties: b.properties || null,
          position: i,
          pageId: id,
        })),
      });
      delete data.blocks;
    }

    // Update page fields
    if (Object.keys(data).length > 0) {
      await prisma.page.update({ where: { id }, data });
    }

    const updated = await prisma.page.findUnique({
      where: { id },
      include: { blocks: { orderBy: { position: "asc" } } },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("Page PATCH error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    const { id } = await params;

    // Verify ownership — only the page creator can delete
    const page = await prisma.page.findUnique({ where: { id }, select: { createdById: true } });
    if (!page) return NextResponse.json({ error: "Página no encontrada" }, { status: 404 });
    if (page.createdById !== user!.id) {
      return NextResponse.json({ error: "Sin acceso a esta página" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const hard = searchParams.get("hard") === "true";

    if (hard) {
      // Hard delete: permanently remove page and its blocks from DB
      await prisma.block.deleteMany({ where: { pageId: id } });
      await prisma.page.delete({ where: { id } });
    } else {
      // Soft delete
      await prisma.page.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Page DELETE error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

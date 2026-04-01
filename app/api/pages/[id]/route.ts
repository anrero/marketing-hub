import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    const page = await prisma.page.findUnique({
      where: { id },
      include: { blocks: { orderBy: { position: "asc" } } },
    });

    return NextResponse.json(page);
  } catch (e) {
    console.error("Page PATCH error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.page.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Page DELETE error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

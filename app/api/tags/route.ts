import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { error } = await getAuthUser(request);
    if (error) return error;
    const { name, color, workspaceId } = await request.json();
    if (!name || !color || !workspaceId) {
      return NextResponse.json({ error: "name, color y workspaceId requeridos" }, { status: 400 });
    }

    const tag = await prisma.tag.create({
      data: { name, color, workspaceId },
    });

    return NextResponse.json(tag);
  } catch (e) {
    console.error("Tag POST error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { error } = await getAuthUser(request);
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    // Delete tag associations first, then the tag
    await prisma.taskTag.deleteMany({ where: { tagId: id } });
    await prisma.tag.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Tag DELETE error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

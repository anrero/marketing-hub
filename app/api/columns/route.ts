import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { error } = await getAuthUser(request);
    if (error) return error;
    const { boardId, name, color, position } = await request.json();
    if (!boardId || !name) return NextResponse.json({ error: "boardId y name requeridos" }, { status: 400 });

    const column = await prisma.column.create({
      data: { name, color: color || "#6b7280", position: position ?? 0, boardId },
    });
    return NextResponse.json(column);
  } catch (e) {
    console.error("Column POST error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { error } = await getAuthUser(request);
    if (error) return error;
    const { id, name, color } = await request.json();
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (color !== undefined) data.color = color;

    const column = await prisma.column.update({ where: { id }, data });
    return NextResponse.json(column);
  } catch (e) {
    console.error("Column PATCH error:", e);
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

    // Move tasks in this column to null column before deleting
    await prisma.task.updateMany({ where: { columnId: id }, data: { columnId: null } });
    await prisma.column.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Column DELETE error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

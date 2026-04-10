import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, checkBoardAccess } from "@/lib/auth";

async function ensureBoardEditor(userId: string, boardId: string) {
  const access = await checkBoardAccess(userId, boardId);
  if (!access.hasAccess) return { ok: false, res: NextResponse.json({ error: "Sin acceso al tablero" }, { status: 403 }) };
  if (access.role === "viewer") return { ok: false, res: NextResponse.json({ error: "Sin permisos de edición" }, { status: 403 }) };
  return { ok: true as const };
}

export async function POST(request: Request) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    const { boardId, name, color, position } = await request.json();
    if (!boardId || !name) return NextResponse.json({ error: "boardId y name requeridos" }, { status: 400 });

    const perm = await ensureBoardEditor(user!.id, boardId);
    if (!perm.ok) return perm.res;

    // Default position = end of the list
    let pos = position;
    if (typeof pos !== "number") {
      pos = await prisma.column.count({ where: { boardId } });
    }

    const column = await prisma.column.create({
      data: { name, color: color || "#6b7280", position: pos, boardId },
    });
    return NextResponse.json(column);
  } catch (e) {
    console.error("Column POST error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    const body = await request.json();

    // Batch reorder: { reorder: [{ id, position }, ...] }
    if (Array.isArray(body.reorder)) {
      const entries: { id: string; position: number }[] = body.reorder;
      if (entries.length === 0) return NextResponse.json({ success: true });
      const first = await prisma.column.findUnique({ where: { id: entries[0].id }, select: { boardId: true } });
      if (!first) return NextResponse.json({ error: "Columna no encontrada" }, { status: 404 });
      const perm = await ensureBoardEditor(user!.id, first.boardId);
      if (!perm.ok) return perm.res;
      await prisma.$transaction(
        entries.map((e) => prisma.column.update({ where: { id: e.id }, data: { position: e.position } }))
      );
      return NextResponse.json({ success: true });
    }

    const { id, name, color, position } = body;
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const existing = await prisma.column.findUnique({ where: { id }, select: { boardId: true } });
    if (!existing) return NextResponse.json({ error: "Columna no encontrada" }, { status: 404 });
    const perm = await ensureBoardEditor(user!.id, existing.boardId);
    if (!perm.ok) return perm.res;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (color !== undefined) data.color = color;
    if (typeof position === "number") data.position = position;

    const column = await prisma.column.update({ where: { id }, data });
    return NextResponse.json(column);
  } catch (e) {
    console.error("Column PATCH error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const targetColumnId = searchParams.get("targetColumnId");
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const existing = await prisma.column.findUnique({ where: { id }, select: { boardId: true, name: true } });
    if (!existing) return NextResponse.json({ error: "Columna no encontrada" }, { status: 404 });
    const perm = await ensureBoardEditor(user!.id, existing.boardId);
    if (!perm.ok) return perm.res;

    if (targetColumnId) {
      // Verify target belongs to the same board
      const target = await prisma.column.findUnique({ where: { id: targetColumnId }, select: { boardId: true, name: true } });
      if (!target || target.boardId !== existing.boardId) {
        return NextResponse.json({ error: "Columna destino inválida" }, { status: 400 });
      }
      await prisma.task.updateMany({
        where: { columnId: id },
        data: { columnId: targetColumnId, status: statusFromColumnName(target.name) },
      });
    } else {
      await prisma.task.updateMany({ where: { columnId: id }, data: { columnId: null } });
    }

    await prisma.column.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Column DELETE error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// Keep the task.status string in sync with the column name so legacy
// hardcoded "completado" / "por_hacer" checks keep working for the default columns.
function statusFromColumnName(name: string): string {
  const n = name.toLowerCase().trim();
  if (n.includes("hacer")) return "por_hacer";
  if (n.includes("proceso") || n.includes("progreso")) return "en_proceso";
  if (n.includes("revisi")) return "en_revision";
  if (n.includes("complet") || n === "done" || n === "hecho" || n === "listo") return "completado";
  return n.replace(/\s+/g, "_");
}

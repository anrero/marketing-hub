import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, checkBoardAccess } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    const { id } = await params;

    const access = await checkBoardAccess(user!.id, id);
    if (!access.hasAccess) {
      return NextResponse.json({ error: "Sin acceso al tablero" }, { status: 403 });
    }

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        columns: { orderBy: { position: "asc" } },
        _count: { select: { shares: true } },
      },
    });
    if (!board) return NextResponse.json({ error: "Tablero no encontrado" }, { status: 404 });

    return NextResponse.json(board);
  } catch (e) {
    console.error("Board GET error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    const { id } = await params;

    // Permission check: WorkspaceMember OR BoardShare with role "editor"
    const access = await checkBoardAccess(user!.id, id);
    if (!access.hasAccess) {
      return NextResponse.json({ error: "Sin acceso al tablero" }, { status: 403 });
    }
    // If access is via BoardShare, must be "editor" (not "viewer")
    const board = await prisma.board.findUnique({ where: { id }, select: { workspaceId: true } });
    if (!board) return NextResponse.json({ error: "Tablero no encontrado" }, { status: 404 });
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: board.workspaceId, userId: user!.id } },
    });
    if (!member && access.role === "viewer") {
      return NextResponse.json({ error: "Sin permisos de edición" }, { status: 403 });
    }

    const data = await request.json();
    const updated = await prisma.board.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("Board PATCH error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    const { id } = await params;

    // Permission check: must be WorkspaceMember with role "owner" or "admin"
    const board = await prisma.board.findUnique({ where: { id }, select: { workspaceId: true } });
    if (!board) return NextResponse.json({ error: "Tablero no encontrado" }, { status: 404 });
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: board.workspaceId, userId: user!.id } },
    });
    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      return NextResponse.json({ error: "Solo administradores pueden eliminar tableros" }, { status: 403 });
    }

    await prisma.board.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Board DELETE error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

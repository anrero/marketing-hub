import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, checkBoardAccess } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    const { id } = await params;

    // Verify requesting user has access to this board
    const access = await checkBoardAccess(user!.id, id);
    if (!access.hasAccess) {
      return NextResponse.json({ error: "Sin acceso al tablero" }, { status: 403 });
    }

    const shares = await prisma.boardShare.findMany({
      where: { boardId: id },
      include: {
        user: { select: { id: true, name: true, email: true, avatarColor: true } },
      },
    });

    return NextResponse.json(shares);
  } catch (e) {
    console.error("BoardShare GET error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    const { id } = await params;

    // Get the board to find workspaceId
    const board = await prisma.board.findUnique({ where: { id }, select: { workspaceId: true } });
    if (!board) return NextResponse.json({ error: "Tablero no encontrado" }, { status: 404 });

    // Verify requesting user is workspace owner OR has "owner"/"admin" role in WorkspaceMember
    const workspace = await prisma.workspace.findUnique({ where: { id: board.workspaceId }, select: { ownerId: true } });
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: board.workspaceId, userId: user!.id } },
    });
    const isOwner = workspace?.ownerId === user!.id;
    const isAdmin = member && (member.role === "owner" || member.role === "admin");
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Sin permisos para compartir" }, { status: 403 });
    }

    const { email, role } = await request.json();
    if (!email || !role || (role !== "editor" && role !== "viewer")) {
      return NextResponse.json({ error: "Email y role (editor/viewer) requeridos" }, { status: 400 });
    }

    // Find target user by email
    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Create BoardShare
    const share = await prisma.boardShare.create({
      data: {
        boardId: id,
        userId: targetUser.id,
        role,
        sharedBy: user!.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarColor: true } },
      },
    });

    return NextResponse.json(share);
  } catch (e: unknown) {
    // Handle unique constraint violation (already shared)
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "El tablero ya fue compartido con este usuario" }, { status: 409 });
    }
    console.error("BoardShare POST error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    const { id } = await params;

    // Get the board to find workspaceId
    const board = await prisma.board.findUnique({ where: { id }, select: { workspaceId: true } });
    if (!board) return NextResponse.json({ error: "Tablero no encontrado" }, { status: 404 });

    // Verify requesting user is workspace owner or admin
    const workspace = await prisma.workspace.findUnique({ where: { id: board.workspaceId }, select: { ownerId: true } });
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: board.workspaceId, userId: user!.id } },
    });
    const isOwner = workspace?.ownerId === user!.id;
    const isAdmin = member && (member.role === "owner" || member.role === "admin");
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Sin permisos para eliminar acceso" }, { status: 403 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    await prisma.boardShare.delete({
      where: { boardId_userId: { boardId: id, userId } },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("BoardShare DELETE error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

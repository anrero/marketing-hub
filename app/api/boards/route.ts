import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;

    // Find workspaces owned by this user
    const ownedWorkspaces = await prisma.workspace.findMany({
      where: { ownerId: user!.id },
      select: { id: true },
    });
    const ownedWorkspaceIds = ownedWorkspaces.map((w: { id: string }) => w.id);

    // Owner sees ALL boards in their workspace(s)
    // Everyone else sees only boards shared with them via BoardShare
    const boards = await prisma.board.findMany({
      where: {
        OR: [
          { workspaceId: { in: ownedWorkspaceIds } },
          { shares: { some: { userId: user!.id } } },
        ],
      },
      include: {
        columns: { orderBy: { position: "asc" } },
        _count: { select: { shares: true } },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(boards);
  } catch (e) {
    console.error("Boards GET error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;

    const { name, emoji, workspaceId } = await request.json();
    if (!name || !workspaceId) return NextResponse.json({ error: "name y workspaceId requeridos" }, { status: 400 });

    // Verify the user is a member of the target workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user!.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Sin acceso a este workspace" }, { status: 403 });
    }

    const count = await prisma.board.count({ where: { workspaceId } });

    // Create board with default columns
    const board = await prisma.board.create({
      data: {
        name, emoji: emoji || "📋", workspaceId, position: count,
        columns: {
          create: [
            { name: "Por hacer", color: "#6b7280", position: 0 },
            { name: "En proceso", color: "#3b82f6", position: 1 },
            { name: "En revisión", color: "#f59e0b", position: 2 },
            { name: "Completado", color: "#22c55e", position: 3 },
          ],
        },
      },
      include: { columns: { orderBy: { position: "asc" } } },
    });

    // Auto-create BoardShare for the creator if they're not the workspace owner
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { ownerId: true } });
    if (workspace?.ownerId !== user!.id) {
      await prisma.boardShare.create({
        data: { boardId: board.id, userId: user!.id, role: "editor", sharedBy: user!.id },
      });
    }

    return NextResponse.json(board);
  } catch (e) {
    console.error("Boards POST error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

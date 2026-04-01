import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    if (!workspaceId) return NextResponse.json({ error: "workspaceId requerido" }, { status: 400 });

    const boards = await prisma.board.findMany({
      where: { workspaceId },
      include: { columns: { orderBy: { position: "asc" } } },
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
    const { name, emoji, workspaceId } = await request.json();
    if (!name || !workspaceId) return NextResponse.json({ error: "name y workspaceId requeridos" }, { status: 400 });

    const count = await prisma.board.count({ where: { workspaceId } });

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

    return NextResponse.json(board);
  } catch (e) {
    console.error("Boards POST error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

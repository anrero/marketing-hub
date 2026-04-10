import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, checkBoardAccess } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get("boardId");
    if (!boardId) return NextResponse.json({ error: "boardId requerido" }, { status: 400 });

    // Permission check: WorkspaceMember OR BoardShare
    const access = await checkBoardAccess(user!.id, boardId);
    if (!access.hasAccess) {
      return NextResponse.json({ error: "Sin acceso al tablero" }, { status: 403 });
    }

    const tasks = await prisma.task.findMany({
      where: { boardId, deletedAt: null },
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true, role: true } },
        subtasks: { orderBy: { position: "asc" } },
        comments: { include: { author: { select: { id: true, name: true, avatarColor: true } } }, orderBy: { createdAt: "asc" } },
        activities: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
        attachments: true,
        urls: true,
        tags: { include: { tag: true } },
        blockedBy: { include: { blocker: { select: { id: true, title: true, status: true } } } },
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(tasks);
  } catch (e) {
    console.error("Tasks GET error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    const data = await request.json();
    const { boardId, title, status, priority, store, assigneeId, campaignType, campaignName, adAccount, dueDate, columnId: requestedColumnId } = data;

    if (!boardId || !title) return NextResponse.json({ error: "boardId y title requeridos" }, { status: 400 });

    // Permission check: WorkspaceMember OR BoardShare with role != "viewer"
    const access = await checkBoardAccess(user!.id, boardId);
    if (!access.hasAccess) {
      return NextResponse.json({ error: "Sin acceso al tablero" }, { status: 403 });
    }
    if (access.role === "viewer") {
      return NextResponse.json({ error: "Sin permisos de edición" }, { status: 403 });
    }

    const count = await prisma.task.count({ where: { boardId } });

    // Resolve target column: explicit columnId wins, then status-name match, then first column by position
    let columnId: string | null = null;
    let resolvedStatus = status || "por_hacer";
    if (requestedColumnId) {
      const col = await prisma.column.findUnique({ where: { id: requestedColumnId }, select: { id: true, boardId: true, name: true } });
      if (col && col.boardId === boardId) {
        columnId = col.id;
        resolvedStatus = statusFromColumnName(col.name);
      }
    }
    if (!columnId) {
      const first = await prisma.column.findFirst({ where: { boardId }, orderBy: { position: "asc" }, select: { id: true, name: true } });
      if (first) {
        columnId = first.id;
        if (!status) resolvedStatus = statusFromColumnName(first.name);
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        status: resolvedStatus,
        priority: priority || "media",
        position: count,
        store: store || null,
        assigneeId: assigneeId || null,
        campaignType: campaignType || null,
        campaignName: campaignName || null,
        adAccount: adAccount || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: user!.id,
        boardId,
        columnId,
      },
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true, role: true } },
        subtasks: true,
        comments: true,
        activities: true,
        attachments: true,
        urls: true,
        tags: { include: { tag: true } },
        blockedBy: { include: { blocker: { select: { id: true, title: true, status: true } } } },
      },
    });

    return NextResponse.json(task);
  } catch (e) {
    console.error("Tasks POST error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

function statusFromColumnName(name: string): string {
  const n = name.toLowerCase().trim();
  if (n.includes("hacer")) return "por_hacer";
  if (n.includes("proceso") || n.includes("progreso")) return "en_proceso";
  if (n.includes("revisi")) return "en_revision";
  if (n.includes("complet") || n === "done" || n === "hecho" || n === "listo") return "completado";
  return n.replace(/\s+/g, "_");
}

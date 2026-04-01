import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get("boardId");
    if (!boardId) return NextResponse.json({ error: "boardId requerido" }, { status: 400 });

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
      orderBy: { position: "asc" },
    });

    return NextResponse.json(tasks);
  } catch (e) {
    console.error("Tasks GET error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { boardId, title, status, priority, store, assigneeId, campaignType, campaignName, adAccount, dueDate, createdById } = data;

    if (!boardId || !title) return NextResponse.json({ error: "boardId y title requeridos" }, { status: 400 });

    const count = await prisma.task.count({ where: { boardId } });

    // Find column matching status
    const column = await prisma.column.findFirst({ where: { boardId, name: { contains: status === "en_proceso" ? "proceso" : status === "en_revision" ? "revisión" : status === "completado" ? "Completado" : "hacer" } } });

    const task = await prisma.task.create({
      data: {
        title,
        status: status || "por_hacer",
        priority: priority || "media",
        position: count,
        store: store || null,
        assigneeId: assigneeId || null,
        campaignType: campaignType || null,
        campaignName: campaignName || null,
        adAccount: adAccount || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: createdById || null,
        boardId,
        columnId: column?.id || null,
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

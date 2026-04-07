import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await getAuthUser(request);
    if (error) return error;
    const { id } = await params;
    const data = await request.json();

    // Handle dueDate conversion
    if (data.dueDate && typeof data.dueDate === "string") {
      data.dueDate = new Date(data.dueDate);
    }

    // Handle subtask operations separately
    if (data._addSubtask) {
      await prisma.subtask.create({
        data: { title: data._addSubtask, taskId: id, position: await prisma.subtask.count({ where: { taskId: id } }) },
      });
      delete data._addSubtask;
    }
    if (data._toggleSubtask) {
      const sub = await prisma.subtask.findUnique({ where: { id: data._toggleSubtask } });
      if (sub) await prisma.subtask.update({ where: { id: data._toggleSubtask }, data: { completed: !sub.completed } });
      delete data._toggleSubtask;
    }
    if (data._removeSubtask) {
      await prisma.subtask.delete({ where: { id: data._removeSubtask } });
      delete data._removeSubtask;
    }

    // Handle comment
    if (data._addComment) {
      await prisma.comment.create({
        data: { content: data._addComment.content, taskId: id, authorId: data._addComment.authorId },
      });
      delete data._addComment;
    }

    // Handle activity
    if (data._addActivity) {
      await prisma.activity.create({
        data: { action: data._addActivity.action, field: data._addActivity.field, oldValue: data._addActivity.oldValue, newValue: data._addActivity.newValue, taskId: id, userId: data._addActivity.userId },
      });
      delete data._addActivity;
    }

    // Handle tags (relation-safe)
    if (data._addTag) {
      await prisma.taskTag.upsert({
        where: { taskId_tagId: { taskId: id, tagId: data._addTag } },
        create: { taskId: id, tagId: data._addTag },
        update: {},
      });
      delete data._addTag;
    }
    if (data._removeTag) {
      await prisma.taskTag.deleteMany({ where: { taskId: id, tagId: data._removeTag } });
      delete data._removeTag;
    }

    // Handle dependencies (relation-safe)
    if (data._addDependency) {
      const exists = await prisma.taskDependency.findFirst({ where: { blockedId: id, blockerId: data._addDependency } });
      if (!exists) {
        await prisma.taskDependency.create({ data: { blockedId: id, blockerId: data._addDependency } });
      }
      delete data._addDependency;
    }
    if (data._removeDependency) {
      await prisma.taskDependency.deleteMany({ where: { blockedId: id, blockerId: data._removeDependency } });
      delete data._removeDependency;
    }

    // Handle URL
    if (data._addUrl) {
      await prisma.taskUrl.create({ data: { url: data._addUrl, taskId: id } });
      delete data._addUrl;
    }
    if (data._removeUrl) {
      await prisma.taskUrl.delete({ where: { id: data._removeUrl } });
      delete data._removeUrl;
    }

    // Clean internal fields before updating task
    const cleanData = { ...data };
    delete cleanData._addSubtask;
    delete cleanData._toggleSubtask;
    delete cleanData._removeSubtask;
    delete cleanData._addComment;
    delete cleanData._addActivity;
    delete cleanData._addUrl;
    delete cleanData._removeUrl;
    delete cleanData._addTag;
    delete cleanData._removeTag;
    delete cleanData._addDependency;
    delete cleanData._removeDependency;
    // Remove relation fields that cannot be set as scalars
    delete cleanData.tags;
    delete cleanData.blockedBy;

    // Only update task if there are remaining fields
    if (Object.keys(cleanData).length > 0) {
      await prisma.task.update({ where: { id }, data: cleanData });
    }

    // Return full task
    const task = await prisma.task.findUnique({
      where: { id },
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
    });

    return NextResponse.json(task);
  } catch (e) {
    console.error("Task PATCH error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await getAuthUser(request);
    if (error) return error;
    const { id } = await params;
    // Soft delete
    await prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Task DELETE error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { error } = await getAuthUser(request);
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    if (!workspaceId) return NextResponse.json({ error: "workspaceId requerido" }, { status: 400 });

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: { select: { id: true, name: true, email: true, role: true, avatarColor: true } },
        tags: true,
        invitations: true,
      },
    });

    if (!workspace) return NextResponse.json({ error: "Workspace no encontrado" }, { status: 404 });

    return NextResponse.json(workspace);
  } catch (e) {
    console.error("Workspace GET error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;

    const { name, emoji } = await request.json();
    if (!name) return NextResponse.json({ error: "name requerido" }, { status: 400 });

    const workspace = await prisma.workspace.create({
      data: { name, emoji: emoji || "🚀" },
    });

    // Assign the creator to the new workspace
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { workspaceId: workspace.id },
      });
    }

    return NextResponse.json(workspace);
  } catch (e) {
    console.error("Workspace POST error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { error } = await getAuthUser(request);
    if (error) return error;
    const { id, name, emoji } = await request.json();
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const workspace = await prisma.workspace.update({
      where: { id },
      data: { ...(name && { name }), ...(emoji && { emoji }) },
    });

    return NextResponse.json(workspace);
  } catch (e) {
    console.error("Workspace PATCH error:", e);
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

    // Don't delete if it's the last workspace
    const count = await prisma.workspace.count();
    if (count <= 1) return NextResponse.json({ error: "No se puede eliminar el único workspace" }, { status: 400 });

    await prisma.workspace.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Workspace DELETE error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

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

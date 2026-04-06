import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;

    const { name, email, avatarColor } = await request.json();
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email.toLowerCase();
    if (avatarColor !== undefined) data.avatarColor = avatarColor;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No hay cambios" }, { status: 400 });
    }

    // Check email uniqueness if changing email
    if (data.email && data.email !== user!.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email as string } });
      if (existing) return NextResponse.json({ error: "Este email ya está en uso" }, { status: 409 });
    }

    const updated = await prisma.user.update({
      where: { id: user!.id },
      data,
      select: { id: true, name: true, email: true, role: true, avatarColor: true, workspaceId: true },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("User PATCH error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

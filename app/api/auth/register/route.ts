import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nombre, email y contraseña son obligatorios" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Este email ya está registrado" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);

    // Check if this is the first user — they become owner and get a new workspace
    const userCount = await prisma.user.count();
    const isFirst = userCount === 0;

    let workspaceId: string | null = null;
    if (isFirst) {
      const ws = await prisma.workspace.create({
        data: { name: "Mi Workspace", emoji: "🚀" },
      });
      workspaceId = ws.id;
    } else {
      // Join the first workspace
      const ws = await prisma.workspace.findFirst();
      workspaceId = ws?.id ?? null;
    }

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hash,
        role: isFirst ? "owner" : "editor",
        workspaceId,
      },
    });

    // If first user, create default boards
    if (isFirst && workspaceId) {
      const defaultColumns = [
        { name: "Por hacer", color: "#6b7280", position: 0 },
        { name: "En proceso", color: "#3b82f6", position: 1 },
        { name: "En revisión", color: "#f59e0b", position: 2 },
        { name: "Completado", color: "#22c55e", position: 3 },
      ];
      await prisma.board.create({
        data: {
          name: "Campañas Facebook", emoji: "📣", workspaceId, position: 0,
          columns: { create: defaultColumns },
        },
      });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarColor: user.avatarColor,
      workspaceId: user.workspaceId,
    });
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

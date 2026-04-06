import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "Email no encontrado" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
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
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Login error:", err.message, err.stack);
    return NextResponse.json(
      { error: err.message, stack: process.env.NODE_ENV !== "production" ? err.stack : undefined },
      { status: 500 },
    );
  }
}

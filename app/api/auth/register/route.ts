import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { UserModel } from "@/lib/generated/prisma/models";
import bcrypt from "bcryptjs";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";

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
    const normalizedEmail = email.toLowerCase();
    const isRedking = normalizedEmail.endsWith("@redking.co");

    let user: UserModel;

    if (isRedking) {
      // Find the REDKING workspace
      const redkingWs = await prisma.workspace.findUnique({ where: { slug: "redking" } });
      if (!redkingWs) {
        return NextResponse.json({ error: "Workspace REDKING no encontrado" }, { status: 500 });
      }

      // Create user with REDKING workspace
      user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hash,
          role: "editor",
          workspaceId: redkingWs.id,
        },
      });

      // Create WorkspaceMember for REDKING
      await prisma.workspaceMember.create({
        data: {
          workspaceId: redkingWs.id,
          userId: user.id,
          role: "member",
        },
      });

      // Create BoardShare for ALL boards in REDKING workspace
      const boards = await prisma.board.findMany({
        where: { workspaceId: redkingWs.id },
        select: { id: true },
      });

      if (boards.length > 0) {
        await prisma.boardShare.createMany({
          data: boards.map((b: { id: string }) => ({
            boardId: b.id,
            userId: user.id,
            role: "editor",
            sharedBy: redkingWs.ownerId,
          })),
        });
      }
    } else {
      // Non-redking: create user first (without workspace)
      user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hash,
          role: "owner",
        },
      });

      // Generate slug from email: part before @, dots to dashes, append random 4 chars
      const emailPrefix = normalizedEmail.split("@")[0].replace(/\./g, "-");
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const slug = `${emailPrefix}-${randomSuffix}`;

      // Create personal workspace
      const personalWs = await prisma.workspace.create({
        data: {
          name: `${name}'s Workspace`,
          slug,
          emoji: "🚀",
          ownerId: user.id,
        },
      });

      // Set user's workspaceId
      user = await prisma.user.update({
        where: { id: user.id },
        data: { workspaceId: personalWs.id },
      });

      // Create WorkspaceMember with role "owner"
      await prisma.workspaceMember.create({
        data: {
          workspaceId: personalWs.id,
          userId: user.id,
          role: "owner",
        },
      });

      // Create default board with default columns
      const defaultColumns = [
        { name: "Por hacer", color: "#6b7280", position: 0 },
        { name: "En proceso", color: "#3b82f6", position: 1 },
        { name: "En revisión", color: "#f59e0b", position: 2 },
        { name: "Completado", color: "#22c55e", position: 3 },
      ];
      await prisma.board.create({
        data: {
          name: "Mi primer board",
          emoji: "📋",
          workspaceId: personalWs.id,
          createdById: user.id,
          position: 0,
          columns: { create: defaultColumns },
        },
      });
    }

    // Create signed JWT token and set as httpOnly cookie
    const token = createSessionToken(user.id);
    const response = NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarColor: user.avatarColor,
      workspaceId: user.workspaceId,
    });

    const cookieOpts = sessionCookieOptions(token);
    response.cookies.set(cookieOpts.name, cookieOpts.value, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    });

    return response;
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

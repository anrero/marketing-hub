import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, role, workspaceId } = await request.json();
    if (!email || !workspaceId) return NextResponse.json({ error: "email y workspaceId requeridos" }, { status: 400 });

    const invitation = await prisma.invitation.create({
      data: { email: email.toLowerCase(), role: role || "editor", workspaceId },
    });

    return NextResponse.json(invitation);
  } catch (e) {
    console.error("Invite error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

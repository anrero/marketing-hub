import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { error } = await getAuthUser(request);
    if (error) return error;

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

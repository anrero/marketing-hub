import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, checkBoardAccess } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const channelType = searchParams.get("channelType");
    const channelId = searchParams.get("channelId");
    const userId = searchParams.get("userId");

    if (!channelType || !channelId) {
      return NextResponse.json({ error: "channelType y channelId requeridos" }, { status: 400 });
    }

    // Permission: board chat requires board access
    if (channelType === "board") {
      const access = await checkBoardAccess(user!.id, channelId);
      if (!access.hasAccess) return NextResponse.json({ error: "Sin acceso al board" }, { status: 403 });
    }

    let where;
    if (channelType === "direct" && userId) {
      where = {
        channelType: "direct",
        OR: [
          { senderId: userId, channelId },
          { senderId: channelId, channelId: userId },
        ],
      };
    } else {
      where = { channelType, channelId };
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      include: { sender: { select: { id: true, name: true, avatarColor: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (e) {
    console.error("Chat GET error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    const { text, channelType, channelId, senderId } = await request.json();
    if (!text || !channelType || !channelId || !senderId) {
      return NextResponse.json({ error: "Campos requeridos: text, channelType, channelId, senderId" }, { status: 400 });
    }

    // Permission: board chat requires board access
    if (channelType === "board") {
      const access = await checkBoardAccess(user!.id, channelId);
      if (!access.hasAccess) return NextResponse.json({ error: "Sin acceso al board" }, { status: 403 });
    }

    const message = await prisma.chatMessage.create({
      data: { text, channelType, channelId, senderId },
      include: { sender: { select: { id: true, name: true, avatarColor: true } } },
    });

    return NextResponse.json(message);
  } catch (e) {
    console.error("Chat POST error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

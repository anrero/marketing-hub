import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelType = searchParams.get("channelType");
    const channelId = searchParams.get("channelId");
    const userId = searchParams.get("userId");

    if (!channelType || !channelId) {
      return NextResponse.json({ error: "channelType y channelId requeridos" }, { status: 400 });
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
    const { text, channelType, channelId, senderId } = await request.json();
    if (!text || !channelType || !channelId || !senderId) {
      return NextResponse.json({ error: "Campos requeridos: text, channelType, channelId, senderId" }, { status: 400 });
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

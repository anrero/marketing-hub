import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    const { error } = await getAuthUser(request);
    if (error) return error;
    const { channelType, channelId, userId } = await request.json();

    if (channelType === "direct") {
      await prisma.chatMessage.updateMany({
        where: { channelType: "direct", senderId: channelId, channelId: userId, read: false },
        data: { read: true },
      });
    } else {
      await prisma.chatMessage.updateMany({
        where: { channelType, channelId, read: false, NOT: { senderId: userId } },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Chat read error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

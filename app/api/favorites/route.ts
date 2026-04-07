import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;

    const favs = await prisma.userFavorite.findMany({
      where: { userId: user!.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(favs);
  } catch (e) {
    console.error("Favorites GET error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;

    const { itemType, itemId } = await request.json();
    if (!itemType || !itemId) {
      return NextResponse.json({ error: "itemType and itemId required" }, { status: 400 });
    }

    const fav = await prisma.userFavorite.upsert({
      where: {
        userId_itemType_itemId: {
          userId: user!.id,
          itemType,
          itemId,
        },
      },
      update: {},
      create: {
        userId: user!.id,
        itemType,
        itemId,
      },
    });

    return NextResponse.json(fav);
  } catch (e) {
    console.error("Favorites POST error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;

    const { itemType, itemId } = await request.json();
    if (!itemType || !itemId) {
      return NextResponse.json({ error: "itemType and itemId required" }, { status: 400 });
    }

    await prisma.userFavorite.deleteMany({
      where: {
        userId: user!.id,
        itemType,
        itemId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Favorites DELETE error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

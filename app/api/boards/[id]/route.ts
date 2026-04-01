import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const board = await prisma.board.update({ where: { id }, data });
    return NextResponse.json(board);
  } catch (e) {
    console.error("Board PATCH error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.board.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Board DELETE error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

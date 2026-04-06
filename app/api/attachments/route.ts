import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import cloudinary, { isCloudinaryConfigured } from "@/lib/cloudinary";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { error } = await getAuthUser(req);
    if (error) return error;
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    if (!taskId) return NextResponse.json({ error: "taskId requerido" }, { status: 400 });

    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(attachments);
  } catch (e) {
    console.error("Attachments GET error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { error } = await getAuthUser(req);
    if (error) return error;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) return NextResponse.json({ error: "Attachment no encontrado" }, { status: 404 });

    // Try to delete from Cloudinary if configured
    if (isCloudinaryConfigured() && attachment.url.includes("cloudinary")) {
      try {
        const publicId = attachment.url.split("/").slice(-2).join("/").replace(/\.[^.]+$/, "");
        await cloudinary.uploader.destroy(publicId);
      } catch { /* ignore cloudinary deletion errors */ }
    }

    await prisma.attachment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Attachments DELETE error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

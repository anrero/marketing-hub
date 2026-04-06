import { NextResponse } from "next/server";
import cloudinary, { isCloudinaryConfigured } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: "Cloudinary no está configurado. Agrega CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en las variables de entorno." },
        { status: 503 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const taskId = formData.get("taskId") as string | null;
    const field = (formData.get("field") as string) || "attachment"; // "attachment" | "cover" | "block"

    if (!file) {
      return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
    }

    // Convert to buffer and upload to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string; public_id: string; bytes: number; resource_type: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "marketing-hub", resource_type: "auto" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as { secure_url: string; public_id: string; bytes: number; resource_type: string });
        },
      ).end(buffer);
    });

    // If it's a task attachment, save to DB
    if (field === "attachment" && taskId) {
      const attachment = await prisma.attachment.create({
        data: {
          name: file.name,
          size: file.size,
          type: file.type,
          url: result.secure_url,
          taskId,
        },
      });
      return NextResponse.json(attachment);
    }

    // For cover images or block images, just return the URL
    return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Upload error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

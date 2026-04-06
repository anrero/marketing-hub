import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Extract and validate user from request.
 * Checks x-user-id header against the database.
 * Returns the user object or a 401 NextResponse.
 */
export async function getAuthUser(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return { user: null, error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, workspaceId: true },
    });
    if (!user) {
      return { user: null, error: NextResponse.json({ error: "Usuario no válido" }, { status: 401 }) };
    }
    return { user, error: null };
  } catch {
    return { user: null, error: NextResponse.json({ error: "Error de autenticación" }, { status: 500 }) };
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

/**
 * Extract and validate user from request.
 * Reads the httpOnly session cookie, verifies the JWT, and looks up the user.
 * Falls back to x-user-id header for backwards compatibility during transition.
 * Returns the user object or a 401 NextResponse.
 */
export async function getAuthUser(request: Request) {
  // 1. Try httpOnly cookie first (secure path)
  let userId = await getSessionUserId();

  // 2. Fallback to x-user-id header (will be removed in the future)
  if (!userId) {
    userId = request.headers.get("x-user-id");
  }

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

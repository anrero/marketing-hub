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

/**
 * Check if a user has access to a board.
 * Access is granted if the user is the board creator OR has a BoardShare.
 * No workspace-owner privilege — everyone follows the same rules.
 */
export async function checkBoardAccess(userId: string, boardId: string): Promise<{ hasAccess: boolean; role: string }> {
  const board = await prisma.board.findUnique({ where: { id: boardId }, select: { createdById: true } });
  if (!board) return { hasAccess: false, role: "" };

  // Creator has full access
  if (board.createdById === userId) return { hasAccess: true, role: "owner" };

  // Check BoardShare
  const share = await prisma.boardShare.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  if (share) return { hasAccess: true, role: share.role };

  return { hasAccess: false, role: "" };
}

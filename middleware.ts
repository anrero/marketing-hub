import { type NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

// API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect API routes (the SPA handles auth state client-side for pages)
  if (pathname.startsWith("/api")) {
    // Allow public API routes
    if (PUBLIC_API_ROUTES.some((r) => pathname.startsWith(r))) {
      return NextResponse.next();
    }

    // Check for session cookie
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      // Also check x-user-id header for backwards compatibility
      const headerUserId = request.headers.get("x-user-id");
      if (!headerUserId) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
      }
      return NextResponse.next();
    }

    // Verify the token
    const userId = verifySessionToken(token);
    if (!userId) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

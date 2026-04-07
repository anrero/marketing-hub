import { type NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "mh-session";

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

    // Check for session cookie (basic gate — full JWT verification happens in getAuthUser)
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token) {
      // Cookie present — let the request through; API route will verify signature
      return NextResponse.next();
    }

    // Fallback: check x-user-id header for backwards compatibility
    const headerUserId = request.headers.get("x-user-id");
    if (headerUserId) {
      return NextResponse.next();
    }

    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

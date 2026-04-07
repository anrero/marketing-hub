import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const { error } = await getAuthUser(request);
  if (error) return error;

  const checks: Record<string, string> = {};

  // Only expose minimal health info (no database URLs or internals)
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.user.count();
    checks.database = "OK";
  } catch (e) {
    checks.database = "FAIL: " + (e instanceof Error ? e.message : String(e));
  }

  return NextResponse.json({ status: "ok", checks }, { status: 200 });
}

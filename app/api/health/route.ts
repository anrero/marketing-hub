import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, string> = {};

  // 1. Check DATABASE_URL
  checks.databaseUrl = process.env.DATABASE_URL ? "SET (" + process.env.DATABASE_URL.replace(/\/\/.*@/, "//***@") + ")" : "NOT SET";

  // 2. Check pg import
  try {
    const pg = await import("pg");
    checks.pgImport = "OK (keys: " + Object.keys(pg).join(", ") + ")";
  } catch (e) {
    checks.pgImport = "FAIL: " + (e instanceof Error ? e.message : String(e));
  }

  // 3. Check prisma adapter import
  try {
    await import("@prisma/adapter-pg");
    checks.adapterImport = "OK";
  } catch (e) {
    checks.adapterImport = "FAIL: " + (e instanceof Error ? e.message : String(e));
  }

  // 4. Check generated prisma client import
  try {
    const mod = await import("@/lib/generated/prisma/client");
    checks.prismaClientImport = "OK (has PrismaClient: " + !!mod.PrismaClient + ")";
  } catch (e) {
    checks.prismaClientImport = "FAIL: " + (e instanceof Error ? e.message : String(e));
  }

  // 5. Check prisma singleton
  try {
    const { prisma } = await import("@/lib/prisma");
    checks.prismaSingleton = "OK (type: " + typeof prisma + ")";
  } catch (e) {
    checks.prismaSingleton = "FAIL: " + (e instanceof Error ? e.message : String(e));
  }

  // 6. Try actual query
  try {
    const { prisma } = await import("@/lib/prisma");
    const count = await prisma.user.count();
    checks.dbQuery = "OK (users: " + count + ")";
  } catch (e) {
    checks.dbQuery = "FAIL: " + (e instanceof Error ? e.message : String(e));
  }

  return NextResponse.json(checks, { status: 200 });
}

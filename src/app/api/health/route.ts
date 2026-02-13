import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import packageJson from "../../../../package.json";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  let dbStatus = "healthy";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "unhealthy";
  }

  const responseTimeMs = Date.now() - start;

  const body = {
    status: dbStatus === "healthy" ? "healthy" : "unhealthy",
    version: packageJson.version,
    database: {
      status: dbStatus,
      responseTimeMs,
    },
  };

  return NextResponse.json(body, {
    status: dbStatus === "healthy" ? 200 : 503,
  });
}

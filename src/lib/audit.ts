import { headers } from "next/headers";
import type { Prisma } from "@/generated/prisma/client";

export interface AuditEntry {
  userId: number;
  action: string;
  entityType: string;
  entityId: number;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
}

export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null
  );
}

export async function logAudit(
  tx: Prisma.TransactionClient,
  entry: AuditEntry,
) {
  await tx.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      before: entry.before != null ? JSON.stringify(entry.before) : null,
      after: entry.after != null ? JSON.stringify(entry.after) : null,
      ipAddress: entry.ipAddress ?? null,
    },
  });
}

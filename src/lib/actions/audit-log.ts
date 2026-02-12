"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export interface AuditLogEntry {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  before: string | null;
  after: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { nickname: string } | null;
}

export interface AuditLogPage {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getAuditLogs(input: {
  agreementId: number;
  page?: number;
  pageSize?: number;
  actionFilter?: string;
}): Promise<AuditLogPage> {
  const session = await auth();
  if (!session?.user) return { entries: [], total: 0, page: 1, pageSize: 20 };

  const userId = parseInt(session.user.id, 10);
  const agreement = await prisma.agreement.findUnique({
    where: { id: input.agreementId },
  });

  if (!agreement || agreement.ownerId !== userId) {
    return { entries: [], total: 0, page: 1, pageSize: 20 };
  }

  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where = {
    entityType: "Agreement",
    entityId: input.agreementId,
    ...(input.actionFilter ? { action: input.actionFilter } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { nickname: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    entries: logs.map((l) => ({
      id: l.id,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      before: l.before,
      after: l.after,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt.toISOString(),
      user: l.user ? { nickname: l.user.nickname } : null,
    })),
    total,
    page,
    pageSize,
  };
}

export async function exportAuditLogsJson(input: {
  agreementId: number;
}): Promise<{ success: true; data: string } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const userId = parseInt(session.user.id, 10);
  const agreement = await prisma.agreement.findUnique({
    where: { id: input.agreementId },
  });

  if (!agreement || agreement.ownerId !== userId) {
    return { success: false, error: "Not found" };
  }

  const logs = await prisma.auditLog.findMany({
    where: { entityType: "Agreement", entityId: input.agreementId },
    include: { user: { select: { nickname: true } } },
    orderBy: { createdAt: "desc" },
  });

  const data = logs.map((l) => ({
    id: l.id,
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId,
    before: l.before ? JSON.parse(l.before) : null,
    after: l.after ? JSON.parse(l.after) : null,
    ipAddress: l.ipAddress,
    createdAt: l.createdAt.toISOString(),
    user: l.user?.nickname ?? null,
  }));

  return { success: true, data: JSON.stringify(data, null, 2) };
}

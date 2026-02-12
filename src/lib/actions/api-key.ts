"use server";

import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/api-keys";
import { getClientIp, logAudit } from "@/lib/audit";
import { createApiKeySchema, revokeApiKeySchema } from "@/lib/schemas/api";
import { type ActionResult, requireOwner, validationError } from "./result";

export interface ApiKeyInfo {
  id: number;
  name: string;
  keyPrefix: string;
  lastUsedAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
}

export async function createApiKey(
  input: unknown,
): Promise<ActionResult & { rawKey?: string }> {
  const user = await requireOwner();
  const parsed = createApiKeySchema.safeParse(input);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const userId = parseInt(user.id, 10);
  const ipAddress = await getClientIp();
  const { rawKey, keyHash, keyPrefix } = generateApiKey();

  await prisma.$transaction(async (tx) => {
    const apiKey = await tx.apiKey.create({
      data: {
        userId,
        name: parsed.data.name,
        keyHash,
        keyPrefix,
      },
    });

    await logAudit(tx, {
      userId,
      action: "api_key.create",
      entityType: "ApiKey",
      entityId: apiKey.id,
      after: { name: parsed.data.name, keyPrefix },
      ipAddress,
    });
  });

  return { success: true, rawKey };
}

export async function revokeApiKey(input: unknown): Promise<ActionResult> {
  const user = await requireOwner();
  const parsed = revokeApiKeySchema.safeParse(input);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const userId = parseInt(user.id, 10);
  const ipAddress = await getClientIp();

  const apiKey = await prisma.apiKey.findUnique({
    where: { id: parsed.data.id },
  });

  if (!apiKey || apiKey.userId !== userId) {
    return { success: false, error: "API key not found", code: "NOT_FOUND" };
  }

  if (apiKey.revokedAt) {
    return {
      success: false,
      error: "API key is already revoked",
      code: "CONFLICT",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.apiKey.update({
      where: { id: apiKey.id },
      data: { revokedAt: new Date() },
    });

    await logAudit(tx, {
      userId,
      action: "api_key.revoke",
      entityType: "ApiKey",
      entityId: apiKey.id,
      before: { name: apiKey.name, keyPrefix: apiKey.keyPrefix },
      ipAddress,
    });
  });

  return { success: true };
}

export async function listApiKeys(): Promise<ApiKeyInfo[]> {
  const user = await requireOwner();
  const userId = parseInt(user.id, 10);

  const keys = await prisma.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      createdAt: true,
      revokedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return keys;
}

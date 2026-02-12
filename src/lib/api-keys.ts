import { randomBytes, createHash } from "crypto";

const KEY_PREFIX = "clahub_";

export function generateApiKey() {
  const rawHex = randomBytes(32).toString("hex");
  const rawKey = `${KEY_PREFIX}${rawHex}`;
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.slice(0, 15); // "clahub_" + 8 hex chars
  return { rawKey, keyHash, keyPrefix };
}

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

const SENSITIVE_KEYS =
  /token|key|secret|password|private|authorization|cookie|signature/i;

export function scrubSensitiveData(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.test(k)) {
      result[k] = "[REDACTED]";
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      result[k] = scrubSensitiveData(v as Record<string, unknown>);
    } else {
      result[k] = v;
    }
  }
  return result;
}

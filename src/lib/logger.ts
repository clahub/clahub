export interface LogContext {
  route?: string;
  method?: string;
  userId?: string | number;
  action?: string;
  [key: string]: unknown;
}

function formatEntry(
  level: string,
  message: string,
  context?: LogContext,
  error?: unknown,
) {
  const entry: Record<string, unknown> = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };
  if (error instanceof Error) {
    entry.errorName = error.name;
    entry.errorMessage = error.message;
    entry.stack = error.stack;
  }
  return entry;
}

export const logger = {
  info(msg: string, ctx?: LogContext) {
    console.info(JSON.stringify(formatEntry("info", msg, ctx)));
  },
  warn(msg: string, ctx?: LogContext) {
    console.warn(JSON.stringify(formatEntry("warn", msg, ctx)));
  },
  error(msg: string, ctx?: LogContext, err?: unknown) {
    console.error(JSON.stringify(formatEntry("error", msg, ctx, err)));
  },
};

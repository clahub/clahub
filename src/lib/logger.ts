import { scrubSensitiveData } from "@/lib/sentry";

export interface LogContext {
  route?: string;
  method?: string;
  userId?: string | number;
  action?: string;
  [key: string]: unknown;
}

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;

function currentLevel(): number {
  const env = (process.env.LOG_LEVEL ?? "info").toLowerCase();
  return LEVELS[env as keyof typeof LEVELS] ?? LEVELS.info;
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
    ...(context ? scrubSensitiveData(context) : undefined),
  };
  if (error instanceof Error) {
    entry.errorName = error.name;
    entry.errorMessage = error.message;
    entry.stack = error.stack;
  }
  return entry;
}

export const logger = {
  debug(msg: string, ctx?: LogContext) {
    if (currentLevel() <= LEVELS.debug) {
      console.debug(JSON.stringify(formatEntry("debug", msg, ctx)));
    }
  },
  info(msg: string, ctx?: LogContext) {
    if (currentLevel() <= LEVELS.info) {
      console.info(JSON.stringify(formatEntry("info", msg, ctx)));
    }
  },
  warn(msg: string, ctx?: LogContext) {
    if (currentLevel() <= LEVELS.warn) {
      console.warn(JSON.stringify(formatEntry("warn", msg, ctx)));
    }
  },
  error(msg: string, ctx?: LogContext, err?: unknown) {
    if (currentLevel() <= LEVELS.error) {
      console.error(JSON.stringify(formatEntry("error", msg, ctx, err)));
    }
  },
};

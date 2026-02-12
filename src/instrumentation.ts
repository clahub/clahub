import { scrubSensitiveData } from "@/lib/sentry";

export async function register() {
  if (process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      beforeSend(event) {
        if (event.request?.headers) {
          delete event.request.headers["authorization"];
          delete event.request.headers["cookie"];
          delete event.request.headers["x-hub-signature-256"];
        }
        if (event.extra) {
          event.extra = scrubSensitiveData(
            event.extra as Record<string, unknown>,
          );
        }
        return event;
      },
    });
  }
}

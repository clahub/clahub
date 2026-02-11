import { NextResponse } from "next/server";
import { getGitHubApp } from "@/lib/github";
import { apiError, ErrorCode } from "@/lib/api-error";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event");
  const delivery = request.headers.get("x-github-delivery");

  if (!signature || !event || !delivery) {
    return apiError(
      ErrorCode.VALIDATION_ERROR,
      "Missing required GitHub webhook headers",
      400,
    );
  }

  const body = await request.text();
  const app = getGitHubApp();

  try {
    await app.webhooks.verifyAndReceive({
      id: delivery,
      name: event as Parameters<
        typeof app.webhooks.verifyAndReceive
      >[0]["name"],
      signature,
      payload: body,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    if (message.includes("signature")) {
      return apiError(
        ErrorCode.UNAUTHORIZED,
        "Invalid signature",
        401,
      );
    }

    logger.error("Webhook handler failed", { route: "/api/webhooks/github", method: "POST" }, error);
    return apiError(
      ErrorCode.INTERNAL_ERROR,
      "Webhook handler failed",
      500,
    );
  }
}

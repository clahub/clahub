import { NextResponse } from "next/server";
import { getGitHubApp } from "@/lib/github";

export async function POST(request: Request) {
  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event");
  const delivery = request.headers.get("x-github-delivery");

  if (!signature || !event || !delivery) {
    return NextResponse.json(
      { error: "Missing required GitHub webhook headers" },
      { status: 400 },
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
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 },
      );
    }

    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

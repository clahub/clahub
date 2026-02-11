import { test, expect } from "@playwright/test";

test.describe("Webhook endpoint", () => {
  test("rejects requests with missing headers", async ({ request }) => {
    const response = await request.post("/api/webhooks/github", {
      data: JSON.stringify({ action: "opened" }),
      headers: {
        "content-type": "application/json",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error.message).toContain("Missing required GitHub webhook headers");
  });

  test("rejects requests with invalid signature", async ({ request }) => {
    const response = await request.post("/api/webhooks/github", {
      data: JSON.stringify({ action: "opened" }),
      headers: {
        "content-type": "application/json",
        "x-hub-signature-256": "sha256=invalid-signature",
        "x-github-event": "push",
        "x-github-delivery": "test-delivery-id",
      },
    });

    // Should not return 200 (success) — either 401 or 500
    expect(response.ok()).toBe(false);
  });
});

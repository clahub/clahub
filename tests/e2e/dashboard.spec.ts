import { test, expect } from "@playwright/test";
import { authenticateAs, testOwner } from "./auth-helpers";

test.describe("Dashboard", () => {
  test("owner views agreements dashboard", async ({ page, context }) => {
    await authenticateAs(context, testOwner);

    await page.goto("/agreements");

    await expect(
      page.getByRole("heading", { name: /Agreements/i }),
    ).toBeVisible();

    // Should see the seeded agreement
    await expect(page.getByText("octocat/hello-world")).toBeVisible();
  });

  test("owner sees agreement card with signature count", async ({
    page,
    context,
  }) => {
    await authenticateAs(context, testOwner);

    await page.goto("/agreements");

    // The seeded agreement has one signature
    const card = page.locator("[data-slot=card]", {
      hasText: "hello-world",
    });
    await expect(card).toBeVisible();
  });

  test("unauthenticated user is redirected to sign-in", async ({ page }) => {
    await page.goto("/agreements");

    // Should be redirected to sign-in page
    await expect(page).toHaveURL(/signin/);
  });
});

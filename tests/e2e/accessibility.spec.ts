import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { authenticateAs, testOwner } from "./auth-helpers";

// Helper to run axe and assert no violations
async function expectNoA11yViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();

  const violations = results.violations.map(
    (v) => `${v.id}: ${v.description} (${v.nodes.length} instances)`,
  );

  expect(violations, `Accessibility violations:\n${violations.join("\n")}`).toHaveLength(0);
}

test.describe("Accessibility — public pages", () => {
  test("home page passes axe audit", async ({ page }) => {
    await page.goto("/");
    await expectNoA11yViolations(page);
  });

  test("why-cla page passes axe audit", async ({ page }) => {
    await page.goto("/why-cla");
    await expectNoA11yViolations(page);
  });

  test("terms page passes axe audit", async ({ page }) => {
    await page.goto("/terms");
    await expectNoA11yViolations(page);
  });

  test("privacy page passes axe audit", async ({ page }) => {
    await page.goto("/privacy");
    await expectNoA11yViolations(page);
  });
});

test.describe("Accessibility — authenticated pages", () => {
  test("agreements dashboard passes axe audit", async ({ page, context }) => {
    await authenticateAs(context, testOwner);
    await page.goto("/agreements");
    await expect(page.getByRole("heading", { name: /Agreements/i })).toBeVisible();
    await expectNoA11yViolations(page);
  });
});

test.describe("Accessibility — landmarks and navigation", () => {
  test("skip nav link is focusable", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skipLink = page.locator("a[href='#main-content']");
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toHaveText("Skip to main content");
  });

  test("main landmark exists with correct id", async ({ page }) => {
    await page.goto("/");
    const main = page.locator("main#main-content");
    await expect(main).toBeVisible();
  });
});

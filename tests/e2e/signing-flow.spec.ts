import { test, expect } from "@playwright/test";
import { authenticateAs, testContributor } from "./auth-helpers";

test.describe("Signing flow", () => {
  test("contributor views agreement page and sees CLA text", async ({
    page,
  }) => {
    await page.goto("/agreements/octocat/hello-world");

    await expect(
      page.getByRole("heading", {
        name: /Contributor License Agreement/i,
      }).first(),
    ).toBeVisible();
    await expect(page.getByText("octocat/hello-world")).toBeVisible();
    await expect(page.getByText("Grant of Copyright License")).toBeVisible();
  });

  test("authenticated contributor sees signing form", async ({
    page,
    context,
  }) => {
    // Use a user that doesn't have an existing signature
    await authenticateAs(context, {
      ...testContributor,
      id: "999",
      githubId: "99999",
      nickname: "fresh-contributor",
      email: "fresh@example.com",
    });

    await page.goto("/agreements/octocat/hello-world");

    // Wait for the page to load and check for the form
    await page.waitForLoadState("networkidle");

    // Should see a form element or the signing form component
    const nameField = page.getByLabel(/Full Legal Name/i);
    await expect(nameField).toBeVisible({ timeout: 10000 });
  });

  test("form validation shows errors for empty required fields", async ({
    page,
    context,
  }) => {
    await authenticateAs(context, {
      ...testContributor,
      id: "998",
      githubId: "99998",
      nickname: "validation-tester",
      email: "validate@example.com",
    });

    await page.goto("/agreements/octocat/hello-world");
    await page.waitForLoadState("networkidle");

    // Find the sign/submit button within the form (not the OAuth button)
    const nameField = page.getByLabel(/Full Legal Name/i);
    await expect(nameField).toBeVisible({ timeout: 10000 });

    // Find the submit button in the signing form
    const submitButton = page
      .locator("form")
      .getByRole("button", { name: /Sign|Submit|Agree/i });
    await submitButton.click();

    // Should see validation error messages
    await expect(
      page.getByText(/required|must|cannot be empty/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("unauthenticated user sees sign-in prompt", async ({ page }) => {
    await page.goto("/agreements/octocat/hello-world");

    await expect(
      page.getByRole("button", { name: /Sign in with GitHub/i }),
    ).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";

function getCredentials() {
  const username = process.env.PLAYWRIGHT_RWA_USER || "Heath93";
  const password = process.env.PLAYWRIGHT_RWA_PASS || "s3cret";
  if (!username || !password) {
    throw new Error("PLAYWRIGHT_RWA_USER and PLAYWRIGHT_RWA_PASS are required");
  }
  return { username, password };
}

test.describe("[REQ-AUTH-005] Session persistence", () => {
  test("[TC-008] session persists across reload", async ({ page }) => {
    // Arrange
    const { username, password } = getCredentials();
    await page.goto("/signin");
    await expect(page.getByTestId("signin-submit")).toBeEnabled();

    // Act
    await page.getByTestId("signin-username").locator("input").fill(username);
    await page.getByTestId("signin-password").locator("input").fill(password);
    await Promise.all([
      page.waitForURL("/"),
      page.getByTestId("signin-submit").click(),
    ]);

    // Assert: logged in
    await expect(page.getByTestId("nav-top-notifications-count")).toBeVisible();

    // Act: reload
    await page.reload();

    // Assert: still authenticated
    await expect(page).toHaveURL("/");
    await expect(page.getByTestId("nav-top-notifications-count")).toBeVisible();
  });
});

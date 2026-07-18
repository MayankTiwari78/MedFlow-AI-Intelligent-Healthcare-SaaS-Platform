import { resolve } from "node:path";

import { expect, test, type Page } from "@playwright/test";

const screenshotPath = (name: string) => resolve(process.cwd(), "../docs/screenshots", name);

const assertHealthyVisuals = async (page: Page) => {
  const brokenImages = await page.locator("img").evaluateAll((images) =>
    images
      .filter(
        (image): image is HTMLImageElement =>
          image instanceof HTMLImageElement && (!image.complete || image.naturalWidth === 0)
      )
      .map((image) => image.getAttribute("src"))
  );
  expect(brokenImages).toEqual([]);
  await expect(page.getByText("Network Error", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Runtime Error", { exact: true })).toHaveCount(0);
};

test("patient desktop runtime and primary navigation are healthy", async ({ page }) => {
  const malformedRequests: string[] = [];
  const consoleErrors: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/[object%20object]")) malformedRequests.push(request.url());
  });
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource")) {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Care that moves/i })).toBeVisible();
  await expect(page.getByText(/care directory is not connected|New clinician profiles|Available to book/i).first()).toBeVisible({ timeout: 30_000 });
  await assertHealthyVisuals(page);
  await page.screenshot({ path: screenshotPath("phase-2a-patient-desktop.png"), fullPage: true });

  for (const name of ["ALL DOCTORS", "ABOUT", "CONTACT"]) {
    await page.getByRole("link", { name }).click();
    await expect(page.locator("main, section").first()).toBeVisible();
  }
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /Create your account|Welcome back/ })).toBeVisible();
  await page.goto("/appointment/missing-clinician");
  await expect(page.getByRole("heading", { name: "This booking profile is unavailable" })).toBeVisible({ timeout: 30_000 });
  for (const route of ["/my-appointments", "/my-profile", "/security"]) {
    await page.goto(route);
    await expect(page.getByRole("link", { name: "Sign in securely" })).toBeVisible();
  }

  expect(malformedRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("patient mobile home is balanced and asset-safe", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Care that moves/i })).toBeVisible();
  await expect(page.getByText(/care directory is not connected|New clinician profiles|Available to book/i).first()).toBeVisible({ timeout: 30_000 });
  await assertHealthyVisuals(page);
  await page.screenshot({ path: screenshotPath("phase-2a-patient-mobile.png"), fullPage: true });
});

test("portal login is healthy at desktop and mobile widths", async ({ page }) => {
  await page.goto("http://127.0.0.1:3001/admin-dashboard");
  await expect(page.getByRole("heading", { name: "Admin sign in" })).toBeVisible({ timeout: 20_000 });
  await assertHealthyVisuals(page);
  await page.screenshot({ path: screenshotPath("phase-2a-portal-desktop.png"), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Admin sign in" })).toBeVisible({ timeout: 20_000 });
  await assertHealthyVisuals(page);
  await page.screenshot({ path: screenshotPath("phase-2a-portal-mobile.png"), fullPage: true });
});

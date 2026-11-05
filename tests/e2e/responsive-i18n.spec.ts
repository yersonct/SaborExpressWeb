import { expect, test } from "@playwright/test";
import { useSyntheticApi } from "./synthetic-api";

const screens = [
  ["dashboard", "/panel"], ["orders", "/orders"], ["payments", "/caja"],
  ["products", "/productos"], ["employees", "/equipo"], ["branches", "/sedes"],
  ["settings", "/ajustes"], ["tables", "/mesas"], ["schedules", "/horarios"],
  ["deliveries", "/domicilios"], ["reviews", "/resenas"],
] as const;

test.beforeEach(async ({ page }, info) => {
  await useSyntheticApi(page, info.project.name.split("-")[0]);
});

async function expectNoPageOverflow(page: import("@playwright/test").Page) {
  const dimensions = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
}

test("login, language persistence and keyboard-accessible recovery", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", info.project.name.split("-")[0]);
  await expectNoPageOverflow(page);
  const logo = page.getByRole("img", { name: "SaborExpress" }).first();
  await expect(logo).toBeVisible();
  const logoBounds = await logo.boundingBox();
  expect(logoBounds?.width).toBeGreaterThan(0);
  expect(logoBounds?.height).toBeGreaterThan(0);  await page.screenshot({ path: info.outputPath("login.png"), fullPage: true });
  await page.locator('input[type="email"]').fill("yersonct@example.invalid");
  await page.locator('input[type="password"]').fill("synthetic-password");
  await page.route("**/api/Auth/login", (route) => route.fulfill({ status: 401, json: { code: "INVALID_CREDENTIALS", message: "Credenciales incorrectas, intente de nuevo.", traceId: "synthetic" } }));
  await page.locator('input[type="password"]').press("Enter");
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.screenshot({ path: info.outputPath("login-error.png"), fullPage: true });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("alertdialog")).toBeHidden();
  await page.getByRole("button", { name: /olvidaste|forgot|esqueceu|oublié/i }).click();
  await expectNoPageOverflow(page);
  await page.screenshot({ path: info.outputPath("recovery.png"), fullPage: true });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", info.project.name.split("-")[0]);
  expect(errors).toEqual([]);
});

for (const [name, path] of screens) {
  test(`${name}: translated responsive page with synthetic data`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("main h1").first()).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", info.project.name.split("-")[0]);
    await expectNoPageOverflow(page);
    await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true });
    expect(errors).toEqual([]);
  });
}

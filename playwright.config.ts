import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3200);
const baseURL = `http://127.0.0.1:${port}`;

const sizes = [
  { name: "phone", width: 360, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1366, height: 768 },
];
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 2,
  timeout: 45000,
  expect: { timeout: 12000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    ...["es", "en", "pt", "fr"].flatMap((locale) => sizes.map((size) => ({
      name: `${locale}-${size.name}`,
      testIgnore: "**/a11y-performance.spec.ts",
      use: { browserName: "chromium" as const, locale, viewport: { width: size.width, height: size.height } },
    }))),
    {
      name: "quality-audit",
      testMatch: "**/a11y-performance.spec.ts",
      use: { browserName: "chromium" as const, locale: "es", viewport: { width: 1366, height: 768 } },
    },
  ],
  webServer: {
    command: `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port ${port}`,
    url: `${baseURL}/login`,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1",
    timeout: 120000,
    env: { NEXT_PUBLIC_API_URL: "http://localhost:5000", NEXT_TELEMETRY_DISABLED: "1" },
  },
});

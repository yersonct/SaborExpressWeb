import { defineConfig } from "@playwright/test";

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
  use: { baseURL: "http://127.0.0.1:3200", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: ["es", "en", "pt", "fr"].flatMap((locale) => sizes.map((size) => ({
    name: `${locale}-${size.name}`,
    use: { browserName: "chromium" as const, locale, viewport: { width: size.width, height: size.height } },
  }))),
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3200",
    url: "http://127.0.0.1:3200/login",
    reuseExistingServer: false,
    timeout: 120000,
    env: { NEXT_PUBLIC_API_URL: "http://localhost:5000", NEXT_TELEMETRY_DISABLED: "1" },
  },
});

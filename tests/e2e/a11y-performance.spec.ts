import { expect, test } from "@playwright/test";
import { useSyntheticApi } from "./synthetic-api";

const screens = [
  ["dashboard", "/panel"],
  ["orders", "/orders"],
  ["payments", "/caja"],
  ["products", "/productos"],
  ["employees", "/equipo"],
  ["branches", "/sedes"],
  ["settings", "/ajustes"],
  ["tables", "/mesas"],
  ["schedules", "/horarios"],
  ["deliveries", "/domicilios"],
  ["reviews", "/resenas"],
] as const;

type ScreenAudit = {
  screen: string;
  domContentLoadedMs: number;
  loadEventMs: number;
  largestContentfulPaintMs: number | null;
  cumulativeLayoutShift: number;
  unnamedControls: string[];
  imagesWithoutAlt: number;
  mainLandmarks: number;
  h1Headings: number;
};

declare global {
  interface Window {
    __qualityAuditMetrics?: { lcp: number | null; cls: number };
  }
}

test("production screens meet local accessibility and performance budgets", async ({ page }, testInfo) => {
  await useSyntheticApi(page, "es");
  await page.addInitScript(() => {
    window.__qualityAuditMetrics = { lcp: null, cls: 0 };

    if (PerformanceObserver.supportedEntryTypes.includes("largest-contentful-paint")) {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries.at(-1);
        if (lastEntry && window.__qualityAuditMetrics) {
          window.__qualityAuditMetrics.lcp = lastEntry.startTime;
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    }

    if (PerformanceObserver.supportedEntryTypes.includes("layout-shift")) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!shift.hadRecentInput && window.__qualityAuditMetrics) {
            window.__qualityAuditMetrics.cls += shift.value ?? 0;
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    }
  });

  const results: ScreenAudit[] = [];
  for (const [screen, path] of screens) {
    await page.goto(path, { waitUntil: "load" });
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("main h1").first()).toBeVisible();
    await page.waitForTimeout(250);

    const result = await page.evaluate((screenName) => {
      const visible = (element: Element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
      };
      const labelFor = (element: Element) => {
        const explicit = element.getAttribute("aria-label")?.trim();
        if (explicit) return explicit;
        const labelledBy = element.getAttribute("aria-labelledby")
          ?.split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
          .filter(Boolean)
          .join(" ");
        if (labelledBy) return labelledBy;
        const title = element.getAttribute("title")?.trim();
        if (title) return title;
        if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
          if (element instanceof HTMLInputElement && ["button", "submit", "reset"].includes(element.type)) {
            return element.value.trim();
          }
          return "";
        }
        const text = element.textContent?.trim();
        if (text) return text;
        const imageAlt = element.querySelector("img[alt]")?.getAttribute("alt")?.trim();
        if (imageAlt) return imageAlt;
        const svgTitle = element.querySelector("svg title")?.textContent?.trim();
        if (svgTitle) return svgTitle;
        return "";
      };
      const controls = Array.from(document.querySelectorAll("button, a[href], input:not([type=hidden]), select, textarea"))
        .filter(visible);
      const unnamedControls = controls
        .filter((element) => {
          if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
            return !element.labels?.length && !labelFor(element);
          }
          return !labelFor(element);
        })
        .map((element) => {
          const classNames = element.getAttribute("class")?.trim().split(/\s+/).slice(0, 4).join(".") ?? "";
          return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${classNames ? `.${classNames}` : ""}`;
        });
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      return {
        screen: screenName,
        domContentLoadedMs: navigation?.domContentLoadedEventEnd ?? 0,
        loadEventMs: navigation?.loadEventEnd ?? 0,
        largestContentfulPaintMs: window.__qualityAuditMetrics?.lcp ?? null,
        cumulativeLayoutShift: window.__qualityAuditMetrics?.cls ?? 0,
        unnamedControls,
        imagesWithoutAlt: Array.from(document.querySelectorAll("img"))
          .filter(visible)
          .filter((image) => !image.hasAttribute("alt")).length,
        mainLandmarks: Array.from(document.querySelectorAll("main")).filter(visible).length,
        h1Headings: Array.from(document.querySelectorAll("h1")).filter(visible).length,
      };
    }, screen);
    results.push(result);
  }

  await testInfo.attach("web-accessibility-performance.json", {
    body: Buffer.from(JSON.stringify({
      origin: "local production build with synthetic API responses",
      criteria: {
        domContentLoadedMs: "< 5000 per screen",
        largestContentfulPaintMs: "measured and <= 4000 per screen",
        cumulativeLayoutShift: "<= 0.1 per screen",
        unnamedVisibleControls: "0 per screen",
        visibleImagesWithoutAlt: "0 per screen",
        mainLandmarks: "exactly 1 per screen",
        visibleH1Headings: ">= 1 per screen",
      },
      results,
    }, null, 2)),
    contentType: "application/json",
  });
  console.log("WEB_QUALITY_AUDIT", JSON.stringify(results));

  expect(results, "all rendered screens should meet the local audit criteria").toEqual(
    results.map((result) => ({
      ...result,
      unnamedControls: [],
      imagesWithoutAlt: 0,
      mainLandmarks: 1,
    })).filter((result) =>
      result.domContentLoadedMs < 5000 &&
      result.largestContentfulPaintMs !== null &&
      result.largestContentfulPaintMs <= 4000 &&
      result.cumulativeLayoutShift <= 0.1,
    ),
  );
  expect(results.every((result) => result.h1Headings >= 1)).toBe(true);
});

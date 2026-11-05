import assert from "node:assert/strict";
import test from "node:test";
import { parseApiBaseUrl } from "../src/config/api-base.ts";
test("normalizes origins, deployment prefixes and legacy API suffixes", () => {
  for (const suffix of ["", "/", "/api", "/api/", "/api/v1", "/api/v1/"]) {
    assert.equal(parseApiBaseUrl(" https://example.com" + suffix + " "), "https://example.com");
  }
  assert.equal(parseApiBaseUrl("http://localhost:5000/platform/api/"), "http://localhost:5000/platform");
});
test("rejects missing, relative, non-HTTP and credential-bearing API configuration", () => {
  for (const value of [undefined, "", "  ", "/api", "undefined", "ftp://example.com",
    "https://user:password@example.com", "https://example.com?token=secret", "https://example.com#api"]) {
    assert.throws(() => parseApiBaseUrl(value), /NEXT_PUBLIC_API_URL/);
  }
});

export function parseApiBaseUrl(value: string | undefined): string {
  if (!value?.trim()) throw new Error("NEXT_PUBLIC_API_URL is required.");
  let url: URL;
  try { url = new URL(value.trim()); }
  catch { throw new Error("NEXT_PUBLIC_API_URL must be an absolute HTTP(S) URL."); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_API_URL must be HTTP(S), without credentials, query parameters or fragments.");
  }
  // Accept legacy settings ending in /api or /api/v1 without duplicating them.
  const prefix = url.pathname.replace(/\/+$/, "").replace(/\/api(?:\/v1)?$/i, "");
  return url.origin + prefix;
}

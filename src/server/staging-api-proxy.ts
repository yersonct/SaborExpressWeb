const STAGING_API_ORIGIN = "https://saborexpressback-staging.onrender.com";
const AUTH_COOKIE_NAMES = new Set(["sabor-admin-access", "sabor-admin-refresh"]);
const ALLOWED_METHODS = new Set(["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]);
const REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "authorization",
  "content-type",
  "if-modified-since",
  "if-none-match",
  "x-csrf-token",
  "x-xsrf-token",
] as const;
const RESPONSE_HEADERS = [
  "content-disposition",
  "content-language",
  "content-type",
  "etag",
  "last-modified",
  "retry-after",
  "vary",
  "x-correlation-id",
  "x-request-id",
] as const;

interface ProxyRuntime {
  nodeEnv?: string;
  targetOrigin?: string;
  fetcher?: typeof fetch;
}

function jsonError(status: number, message: string): Response {
  return Response.json({ error: message }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function hubProxyError(status: number, message: string): Response {
  return Response.json({ error: message }, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-SaborExpress-Hub-Response": "local-proxy",
    },
  });
}

function isLoopbackHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "[::1]";
}

function hasSameOrigin(request: Request, method: string): boolean {
  const requestUrl = new URL(request.url);
  if (!isLoopbackHost(requestUrl.hostname)) return false;

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const parsedOrigin = new URL(origin);
      return parsedOrigin.origin === requestUrl.origin && isLoopbackHost(parsedOrigin.hostname);
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === requestUrl.origin;
    } catch {
      return false;
    }
  }

  return method === "GET" || method === "HEAD" || method === "OPTIONS";
}

function hasVerifiedBrowserOrigin(request: Request): boolean {
  const requestUrl = new URL(request.url);
  const allowedLocalOrigins = new Set([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);
  return allowedLocalOrigins.has(requestUrl.origin) &&
    Boolean(request.headers.get("origin") || request.headers.get("referer")) &&
    hasSameOrigin(request, request.method.toUpperCase());
}

function resolveStagingOrigin(value: string | undefined): URL | null {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (
      parsed.origin !== STAGING_API_ORIGIN ||
      parsed.href !== `${STAGING_API_ORIGIN}/` ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function buildUpstreamUrl(origin: URL, path: string[], search: string): URL | null {
  if (path.some((segment) =>
    !segment || segment === "." || segment === ".." || /[\\/\u0000-\u001f\u007f]/.test(segment)
  )) {
    return null;
  }

  const encodedPath = path.map((segment) => encodeURIComponent(segment)).join("/");
  const url = new URL(`/api${encodedPath ? `/${encodedPath}` : ""}`, origin);
  url.search = search;
  return url;
}

function buildNotificationHubUrl(
  origin: URL,
  path: string[],
  search: string,
  method: string,
): URL | null {
  if (path.some((segment) =>
    !segment || segment === "." || segment === ".." || /[\\/\u0000-\u001f\u007f]/.test(segment)
  )) {
    return null;
  }

  const query = new URLSearchParams(search);
  // SignalR's LongPollingTransport appends `&_=${Date.now()}` to GET polls to
  // avoid intermediary/browser caching. Accept only that numeric cache buster,
  // only for GET; all other query keys (especially access_token) stay blocked.
  const allowedQueryKeys = new Set(["id", "negotiateVersion", "useStatefulReconnect", "_"]);
  if ([...query.keys()].some((key) => !allowedQueryKeys.has(key))) return null;
  const cacheBusters = query.getAll("_");
  if (cacheBusters.length > 0) {
    if (method !== "GET" || cacheBusters.length !== 1 || !/^\d{1,16}$/.test(cacheBusters[0])) {
      return null;
    }
  }

  const suffix = path.map((segment) => encodeURIComponent(segment)).join("/");
  const url = new URL(`/hubs/notifications${suffix ? `/${suffix}` : ""}`, origin);
  url.search = query.toString();
  return url;
}

function filterAuthCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const allowed = cookieHeader.split(";").map((part) => part.trim()).filter((part) => {
    const separator = part.indexOf("=");
    return separator > 0 && AUTH_COOKIE_NAMES.has(part.slice(0, separator));
  });
  return allowed.length ? allowed.join("; ") : null;
}

function getAccessToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator <= 0 || part.slice(0, separator).trim() !== "sabor-admin-access") continue;
    const token = part.slice(separator + 1).trim();
    return token && token.length <= 8192 && !/[\r\n]/.test(token) ? token : null;
  }
  return null;
}

function copyRequestHeaders(request: Request): Headers {
  const headers = new Headers();
  for (const name of REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const clientApp = request.headers.get("x-client-app");
  if (clientApp === "admin-web") headers.set("X-Client-App", clientApp);

  const cookies = filterAuthCookies(request.headers.get("cookie"));
  if (cookies) headers.set("Cookie", cookies);

  const origin = request.headers.get("origin");
  if (origin) headers.set("Origin", origin);
  const referer = request.headers.get("referer");
  if (referer) headers.set("Referer", referer);

  return headers;
}

function getSetCookieHeaders(headers: Headers): string[] {
  const cookieHeaders = headers as Headers & { getSetCookie?: () => string[] };
  return typeof cookieHeaders.getSetCookie === "function"
    ? cookieHeaders.getSetCookie()
    : [];
}

function localizeAuthCookie(cookie: string): string | null {
  const separator = cookie.indexOf("=");
  if (separator <= 0 || !AUTH_COOKIE_NAMES.has(cookie.slice(0, separator).trim())) return null;

  // The fixed upstream is onRender.com. Re-scope its auth cookies to the local
  // host only; HttpOnly, Secure, SameSite, Path, expiry, and other flags survive.
  return cookie.replace(/;\s*domain\s*=\s*[^;]*/gi, "");
}

export async function proxyStagingApiRequest(
  request: Request,
  path: string[],
  runtime: ProxyRuntime = {},
): Promise<Response> {
  const nodeEnv = runtime.nodeEnv ?? process.env.NODE_ENV;
  if (nodeEnv !== "development") return jsonError(404, "Not found");

  const method = request.method.toUpperCase();
  if (!ALLOWED_METHODS.has(method)) return jsonError(405, "Method not allowed");
  if (!hasSameOrigin(request, method)) return jsonError(403, "Cross-origin request blocked");

  const origin = resolveStagingOrigin(
    runtime.targetOrigin ?? process.env.SABOREXPRESS_STAGING_API_ORIGIN,
  );
  if (!origin) return jsonError(503, "Local staging API proxy is not configured safely");

  const incomingUrl = new URL(request.url);
  const upstreamUrl = buildUpstreamUrl(origin, path, incomingUrl.search);
  if (!upstreamUrl) return jsonError(400, "Invalid API path");

  const init: RequestInit & { duplex?: "half" } = {
    method,
    headers: copyRequestHeaders(request),
    redirect: "manual",
    cache: "no-store",
    signal: request.signal,
  };
  if (method !== "GET" && method !== "HEAD" && request.body) {
    init.body = request.body;
    init.duplex = "half";
  }

  try {
    const fetcher = runtime.fetcher ?? fetch;
    const upstream = await fetcher(upstreamUrl, init);

    // Do not let the upstream redirect a same-origin browser request elsewhere.
    if (upstream.status >= 300 && upstream.status < 400) {
      return jsonError(502, "Staging API returned an unexpected redirect");
    }

    const responseHeaders = new Headers({ "Cache-Control": "no-store" });
    for (const name of RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    for (const cookie of getSetCookieHeaders(upstream.headers)) {
      const localCookie = localizeAuthCookie(cookie);
      if (localCookie) responseHeaders.append("Set-Cookie", localCookie);
    }

    const bodyForbidden = method === "HEAD" || [204, 205, 304].includes(upstream.status);
    return new Response(bodyForbidden ? null : upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    // Do not log request headers, bodies, credentials, tokens, or upstream errors.
    return jsonError(502, "Staging API is temporarily unavailable");
  }
}

export async function proxyStagingHealthRequest(
  request: Request,
  runtime: ProxyRuntime = {},
): Promise<Response> {
  const nodeEnv = runtime.nodeEnv ?? process.env.NODE_ENV;
  if (nodeEnv !== "development") return jsonError(404, "Not found");

  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") return jsonError(405, "Method not allowed");
  if (!hasSameOrigin(request, method)) return jsonError(403, "Cross-origin request blocked");

  const origin = resolveStagingOrigin(
    runtime.targetOrigin ?? process.env.SABOREXPRESS_STAGING_API_ORIGIN,
  );
  if (!origin) return jsonError(503, "Local staging API proxy is not configured safely");

  try {
    const headers = new Headers();
    const accept = request.headers.get("accept");
    if (accept) headers.set("Accept", accept);
    const upstream = await (runtime.fetcher ?? fetch)(new URL("/health", origin), {
      method,
      headers,
      redirect: "manual",
      cache: "no-store",
      signal: request.signal,
    });
    if (upstream.status >= 300 && upstream.status < 400) {
      return jsonError(502, "Staging API returned an unexpected redirect");
    }

    const responseHeaders = new Headers({ "Cache-Control": "no-store" });
    const contentType = upstream.headers.get("content-type");
    if (contentType) responseHeaders.set("Content-Type", contentType);
    return new Response(method === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return jsonError(502, "Staging API is temporarily unavailable");
  }
}

export async function proxyStagingNotificationHubRequest(
  request: Request,
  path: string[],
  runtime: ProxyRuntime = {},
): Promise<Response> {
  const nodeEnv = runtime.nodeEnv ?? process.env.NODE_ENV;
  if (nodeEnv !== "development") return jsonError(404, "Not found");

  const method = request.method.toUpperCase();
  if (!["GET", "POST", "DELETE"].includes(method)) {
    return jsonError(405, "Method not allowed");
  }
  if (!hasVerifiedBrowserOrigin(request)) return jsonError(403, "Cross-origin request blocked");
  if (request.headers.get("x-client-app") !== "admin-web") {
    return jsonError(403, "Admin web client required");
  }

  const accessToken = getAccessToken(request.headers.get("cookie"));
  if (!accessToken) return jsonError(401, "Authentication required");

  const origin = resolveStagingOrigin(
    runtime.targetOrigin ?? process.env.SABOREXPRESS_STAGING_API_ORIGIN,
  );
  if (!origin) return jsonError(503, "Local staging API proxy is not configured safely");

  const incomingUrl = new URL(request.url);
  const upstreamUrl = buildNotificationHubUrl(origin, path, incomingUrl.search, method);
  if (!upstreamUrl) return hubProxyError(400, "Invalid notification hub path or query");

  const headers = new Headers();
  for (const name of ["accept", "content-type", "accept-language"] as const) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Bridge the HttpOnly cookie to the fixed upstream over TLS. The JWT is not
  // returned to browser JavaScript, placed in a URL, or written to logs.
  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set("X-Client-App", "admin-web");

  // Preserve the browser's actual Origin. The local same-origin check above is
  // the trust boundary for this dev-only BFF request. Backend JWT and hub
  // authorization still run upstream; no origin is forged or added to CORS.
  const browserOrigin = request.headers.get("origin");
  if (browserOrigin) headers.set("Origin", browserOrigin);
  const referer = request.headers.get("referer");
  if (referer) headers.set("Referer", referer);

  const init: RequestInit & { duplex?: "half" } = {
    method,
    headers,
    redirect: "manual",
    cache: "no-store",
    signal: request.signal,
  };
  if (method === "POST" && request.body) {
    init.body = request.body;
    init.duplex = "half";
  }

  try {
    const upstream = await (runtime.fetcher ?? fetch)(upstreamUrl, init);
    if (upstream.status >= 300 && upstream.status < 400) {
      return jsonError(502, "Staging notification hub returned an unexpected redirect");
    }

    const responseHeaders = new Headers({
      "Cache-Control": "no-store",
      "X-SaborExpress-Hub-Response": "staging",
    });
    for (const name of ["content-type", "retry-after", "x-request-id"] as const) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    const bodyForbidden = method === "DELETE" || [204, 205, 304].includes(upstream.status);
    return new Response(bodyForbidden ? null : upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return hubProxyError(502, "Staging notification hub is temporarily unavailable");
  }
}

import { NextRequest, NextResponse } from "next/server";

function isLocalDevelopmentHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (normalized === "localhost" || normalized.endsWith(".localhost") || normalized.endsWith(".local")) {
    return true;
  }

  const octets = normalized.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  return octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168);
}

function getApiOrigins(request: NextRequest, isDevelopment: boolean) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return { http: "", websocket: "" };

  try {
    const api = new URL(apiUrl);
    const httpOrigins = new Set([api.origin]);
    const websocketOrigins = new Set([
      `${api.protocol === "https:" ? "wss:" : "ws:"}//${api.host}`,
    ]);

    if (
      isDevelopment &&
      request.nextUrl.protocol === api.protocol &&
      isLocalDevelopmentHost(api.hostname) &&
      isLocalDevelopmentHost(request.nextUrl.hostname)
    ) {
      const sameHostApi = new URL(apiUrl);
      sameHostApi.hostname = request.nextUrl.hostname;
      httpOrigins.add(sameHostApi.origin);
      websocketOrigins.add(
        `${sameHostApi.protocol === "https:" ? "wss:" : "ws:"}//${sameHostApi.host}`,
      );
    }

    return {
      http: [...httpOrigins].join(" "),
      websocket: [...websocketOrigins].join(" "),
    };
  } catch {
    return { http: "", websocket: "" };
  }
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDevelopment = process.env.NODE_ENV === "development";
  const apiOrigins = getApiOrigins(request, isDevelopment);
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${apiOrigins.http} ${apiOrigins.websocket}`.trim(),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (!isDevelopment) {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

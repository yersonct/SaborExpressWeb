import assert from "node:assert/strict";
import test from "node:test";
import {
  proxyStagingApiRequest,
  proxyStagingHealthRequest,
  proxyStagingNotificationHubRequest,
} from "./staging-api-proxy.ts";
import { shouldUseLocalStagingLongPolling } from "../features/Dashboard/realtime-transport.ts";

const targetOrigin = "https://saborexpressback-staging.onrender.com";

function makeRequest(path = "/api/Auth/login", init = {}) {
  return new Request(`http://localhost:3000${path}`, {
    ...init,
    headers: {
      origin: "http://localhost:3000",
      ...(init.headers ?? {}),
    },
  });
}

function makeHubRequest(method, path, origin, accessToken, body) {
  const headers = { origin, "X-Client-App": "admin-web" };
  if (accessToken) {
    headers.cookie = `sabor-admin-access=${accessToken}; sabor-admin-refresh=refresh-value`;
  }
  if (body) headers["content-type"] = "text/plain;charset=UTF-8";
  return new Request(`http://localhost:3000${path}`, { method, headers, body });
}

test("forwards API path, query, admin client header, and only auth cookies", async () => {
  let forwardedUrl;
  let forwardedInit;
  const request = makeRequest("/api/Auth/session?locale=es", {
    headers: {
      "X-Client-App": "admin-web",
      cookie: "theme=dark; sabor-admin-access=access-value; sabor-admin-refresh=refresh-value",
      "accept-language": "es",
    },
  });

  const response = await proxyStagingApiRequest(request, ["Auth", "session"], {
    nodeEnv: "development",
    targetOrigin,
    fetcher: async (url, init) => {
      forwardedUrl = url;
      forwardedInit = init;
      return Response.json({ userId: 9 }, { status: 200 });
    },
  });

  assert.equal(response.status, 200);
  assert.equal(forwardedUrl.href, `${targetOrigin}/api/Auth/session?locale=es`);
  assert.equal(forwardedInit.headers.get("X-Client-App"), "admin-web");
  assert.equal(
    forwardedInit.headers.get("cookie"),
    "sabor-admin-access=access-value; sabor-admin-refresh=refresh-value",
  );
  assert.equal(forwardedInit.headers.get("origin"), "http://localhost:3000");
  assert.equal(forwardedInit.redirect, "manual");
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("keeps HttpOnly, Secure, and SameSite flags while localizing auth cookie scope", async () => {
  const upstreamHeaders = new Headers();
  upstreamHeaders.append(
    "Set-Cookie",
    "sabor-admin-access=opaque; Domain=saborexpressback-staging.onrender.com; Path=/; HttpOnly; Secure; SameSite=Lax",
  );
  upstreamHeaders.append(
    "Set-Cookie",
    "unrelated=value; Domain=saborexpressback-staging.onrender.com; Path=/",
  );

  const response = await proxyStagingApiRequest(makeRequest(), ["Auth", "login"], {
    nodeEnv: "development",
    targetOrigin,
    fetcher: async () => new Response(null, { status: 200, headers: upstreamHeaders }),
  });

  const cookies = response.headers.getSetCookie();
  assert.equal(cookies.length, 1);
  assert.match(cookies[0], /^sabor-admin-access=opaque;/);
  assert.doesNotMatch(cookies[0], /Domain=/i);
  assert.match(cookies[0], /HttpOnly/i);
  assert.match(cookies[0], /Secure/i);
  assert.match(cookies[0], /SameSite=Lax/i);
});

test("preserves legitimate 401 responses without retrying or redirecting", async () => {
  const response = await proxyStagingApiRequest(makeRequest("/api/Auth/session"), ["Auth", "session"], {
    nodeEnv: "development",
    targetOrigin,
    fetcher: async () => Response.json({ error: "Unauthorized" }, { status: 401 }),
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized" });
});

test("forwards login request bodies without logging or changing credentials", async () => {
  let forwardedUrl;
  let forwardedBody;
  const request = makeRequest("/api/Auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "X-Client-App": "admin-web" },
    body: JSON.stringify({ identifier: "owner@example.test", attempt: "synthetic-body" }),
  });
  const response = await proxyStagingApiRequest(request, ["Auth", "login"], {
    nodeEnv: "development",
    targetOrigin,
    fetcher: async (url, init) => {
      forwardedUrl = url;
      forwardedBody = await new Response(init.body).json();
      return Response.json({ userId: 12, roles: ["GERENTE"] });
    },
  });

  assert.equal(response.status, 200);
  assert.equal(forwardedUrl.href, `${targetOrigin}/api/Auth/login`);
  assert.deepEqual(forwardedBody, {
    identifier: "owner@example.test",
    attempt: "synthetic-body",
  });
});

test("keeps the backend health probe same-origin and does not forward auth cookies", async () => {
  let forwardedUrl;
  let forwardedHeaders;
  const request = makeRequest("/health", {
    headers: { cookie: "sabor-admin-access=should-not-forward" },
  });
  const response = await proxyStagingHealthRequest(request, {
    nodeEnv: "development",
    targetOrigin,
    fetcher: async (url, init) => {
      forwardedUrl = url;
      forwardedHeaders = init.headers;
      return Response.json({ status: "Healthy" }, { status: 200 });
    },
  });

  assert.equal(forwardedUrl.href, `${targetOrigin}/health`);
  assert.equal(forwardedHeaders.has("cookie"), false);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "Healthy" });
});

test("proxies negotiate, LongPolling GET/POST, and stop with the HttpOnly access cookie", async () => {
  const calls = [];
  const origin = "http://localhost:3000";
  const accessToken = "synthetic.jwt.value";
  const requests = [
    makeHubRequest("POST", "/hubs/notifications/negotiate?negotiateVersion=1", origin, accessToken),
    makeHubRequest("GET", "/hubs/notifications?id=connection-id&_=1730800000000", origin, accessToken),
    makeHubRequest("POST", "/hubs/notifications?id=connection-id", origin, accessToken, "synthetic-signalr-frame"),
    makeHubRequest("DELETE", "/hubs/notifications?id=connection-id", origin, accessToken),
  ];
  const paths = [["negotiate"], [], [], []];
  const statuses = [200, 200, 200, 202];

  for (let index = 0; index < requests.length; index += 1) {
    const response = await proxyStagingNotificationHubRequest(requests[index], paths[index], {
      nodeEnv: "development",
      targetOrigin,
      fetcher: async (url, init) => {
        const body = init.body ? await new Response(init.body).text() : null;
        calls.push({ url, init, body });
        return new Response(null, { status: statuses[index] });
      },
    });
    assert.equal(response.status, statuses[index]);
  }

  assert.deepEqual(calls.map(({ url }) => url.href), [
    `${targetOrigin}/hubs/notifications/negotiate?negotiateVersion=1`,
    `${targetOrigin}/hubs/notifications?id=connection-id&_=1730800000000`,
    `${targetOrigin}/hubs/notifications?id=connection-id`,
    `${targetOrigin}/hubs/notifications?id=connection-id`,
  ]);
  for (const { init } of calls) {
    assert.equal(init.headers.get("authorization"), `Bearer ${accessToken}`);
    assert.equal(init.headers.get("cookie"), null);
    assert.equal(init.headers.get("origin"), origin);
    assert.equal(init.headers.get("X-Client-App"), "admin-web");
    assert.equal(init.redirect, "manual");
  }
  assert.equal(calls[2].body, "synthetic-signalr-frame");
  assert.ok(calls.every(({ url }) => !url.searchParams.has("access_token")));
});

test("identifies local query rejection separately from a Staging 400 without exposing query values", async () => {
  const origin = "http://localhost:3000";
  const invalidCacheBuster = await proxyStagingNotificationHubRequest(
    makeHubRequest("GET", "/hubs/notifications?id=synthetic-id&_=not-a-timestamp", origin, "synthetic-token"),
    [],
    {
      nodeEnv: "development",
      targetOrigin,
      fetcher: async () => assert.fail("invalid local query must not reach Staging"),
    },
  );

  assert.equal(invalidCacheBuster.status, 400);
  assert.equal(invalidCacheBuster.headers.get("x-saborexpress-hub-response"), "local-proxy");
  assert.doesNotMatch(await invalidCacheBuster.text(), /synthetic-id|synthetic-token/);

  const stagingBadRequest = await proxyStagingNotificationHubRequest(
    makeHubRequest("GET", "/hubs/notifications?id=synthetic-id&_=1730800000000", origin, "synthetic-token"),
    [],
    {
      nodeEnv: "development",
      targetOrigin,
      fetcher: async () => new Response("", { status: 400 }),
    },
  );

  assert.equal(stagingBadRequest.status, 400);
  assert.equal(stagingBadRequest.headers.get("x-saborexpress-hub-response"), "staging");
  assert.equal(await stagingBadRequest.text(), "");
});

test("blocks unauthenticated, cross-origin, or non-admin hub requests before forwarding", async () => {
  let upstreamCalls = 0;
  const options = {
    nodeEnv: "development",
    targetOrigin,
    fetcher: async () => {
      upstreamCalls += 1;
      return new Response(null, { status: 200 });
    },
  };
  const sameOrigin = "http://localhost:3000";

  const noCookie = await proxyStagingNotificationHubRequest(
    makeHubRequest("POST", "/hubs/notifications/negotiate", sameOrigin, null),
    ["negotiate"],
    options,
  );
  const crossOrigin = await proxyStagingNotificationHubRequest(
    makeHubRequest("POST", "/hubs/notifications/negotiate", "https://attacker.example", "synthetic"),
    ["negotiate"],
    options,
  );
  const missingClientHeader = await proxyStagingNotificationHubRequest(
    new Request("http://localhost:3000/hubs/notifications/negotiate", {
      method: "POST",
      headers: { origin: sameOrigin, cookie: "sabor-admin-access=synthetic" },
    }),
    ["negotiate"],
    options,
  );
  const missingOrigin = await proxyStagingNotificationHubRequest(
    new Request("http://localhost:3000/hubs/notifications?id=connection-id", {
      method: "GET",
      headers: { "X-Client-App": "admin-web", cookie: "sabor-admin-access=synthetic" },
    }),
    [],
    options,
  );
  const wrongLocalPort = await proxyStagingNotificationHubRequest(
    new Request("http://localhost:3001/hubs/notifications/negotiate", {
      method: "POST",
      headers: { origin: "http://localhost:3001", "X-Client-App": "admin-web", cookie: "sabor-admin-access=synthetic" },
    }),
    ["negotiate"],
    options,
  );
  const traversal = await proxyStagingNotificationHubRequest(
    makeHubRequest("GET", "/hubs/notifications/..", sameOrigin, "synthetic"),
    [".."],
    options,
  );
  const tokenQuery = await proxyStagingNotificationHubRequest(
    makeHubRequest("GET", "/hubs/notifications?id=connection-id&access_token=should-not-forward", sameOrigin, "synthetic"),
    [],
    options,
  );

  assert.equal(noCookie.status, 401);
  assert.equal(crossOrigin.status, 403);
  assert.equal(missingClientHeader.status, 403);
  assert.equal(missingOrigin.status, 403);
  assert.equal(wrongLocalPort.status, 403);
  assert.equal(traversal.status, 400);
  assert.equal(tokenQuery.status, 400);
  assert.equal(upstreamCalls, 0);
});

test("hub proxy is disabled outside local development", async () => {
  const response = await proxyStagingNotificationHubRequest(
    makeHubRequest("POST", "/hubs/notifications/negotiate", "http://localhost:3000", "synthetic"),
    ["negotiate"],
    {
      nodeEnv: "production",
      targetOrigin,
      fetcher: async () => assert.fail("production must not contact staging through this route"),
    },
  );
  assert.equal(response.status, 404);
});

test("enables LongPolling only for the local development proxy", () => {
  assert.equal(shouldUseLocalStagingLongPolling("development", "http://localhost:3000"), true);
  assert.equal(shouldUseLocalStagingLongPolling("development", "http://127.0.0.1:3000"), true);
  assert.equal(shouldUseLocalStagingLongPolling("production", "http://localhost:3000"), false);
  assert.equal(shouldUseLocalStagingLongPolling("development", targetOrigin), false);
  assert.equal(shouldUseLocalStagingLongPolling("development", "http://localhost:5000"), false);
});

test("blocks cross-origin writes before contacting staging", async () => {
  let contactedUpstream = false;
  const request = new Request("http://localhost:3000/api/Auth/login", {
    method: "POST",
    headers: { origin: "https://attacker.example" },
    body: "{}",
  });

  const response = await proxyStagingApiRequest(request, ["Auth", "login"], {
    nodeEnv: "development",
    targetOrigin,
    fetcher: async () => {
      contactedUpstream = true;
      return Response.json({});
    },
  });

  assert.equal(response.status, 403);
  assert.equal(contactedUpstream, false);
});

test("refuses production use, arbitrary targets, traversal paths, and upstream redirects", async () => {
  const production = await proxyStagingApiRequest(makeRequest(), ["Auth", "login"], {
    nodeEnv: "production",
    targetOrigin,
    fetcher: async () => assert.fail("must not contact upstream"),
  });
  assert.equal(production.status, 404);

  const arbitraryTarget = await proxyStagingApiRequest(makeRequest(), ["Auth", "login"], {
    nodeEnv: "development",
    targetOrigin: "https://example.com",
    fetcher: async () => assert.fail("must reject arbitrary target"),
  });
  assert.equal(arbitraryTarget.status, 503);

  const traversal = await proxyStagingApiRequest(makeRequest(), ["..", "admin"], {
    nodeEnv: "development",
    targetOrigin,
    fetcher: async () => assert.fail("must reject traversal path"),
  });
  assert.equal(traversal.status, 400);

  let redirectMode;
  const redirect = await proxyStagingApiRequest(makeRequest(), ["Auth", "login"], {
    nodeEnv: "development",
    targetOrigin,
    fetcher: async (_url, init) => {
      redirectMode = init.redirect;
      return new Response(null, { status: 302, headers: { location: "https://attacker.example" } });
    },
  });
  assert.equal(redirectMode, "manual");
  assert.equal(redirect.status, 502);
  assert.equal(redirect.headers.has("location"), false);
});

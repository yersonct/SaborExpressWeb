import axios, {
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

type LatencyObservation = {
  method: string;
  route: string;
  statusCode: number;
  clientDurationMs: number;
  serverDurationMs: number;
};

type MeasuredRequestConfig = InternalAxiosRequestConfig & {
  saborMetricsStartedAt?: number;
};

const MAX_BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 15_000;
const MAX_DURATION_MS = 120_000;
const observations: LatencyObservation[] = [];
let apiBaseUrl: string | undefined;
let canReport = () => false;
let flushTimer: ReturnType<typeof setTimeout> | undefined;

export function configureClientLatencyMetrics(
  baseUrl: string | undefined,
  hasSession: () => boolean,
) {
  apiBaseUrl = baseUrl;
  canReport = hasSession;
}

export function markClientRequestStart(config: InternalAxiosRequestConfig) {
  if (typeof window !== "undefined" && !isTelemetryRequest(config.url)) {
    (config as MeasuredRequestConfig).saborMetricsStartedAt = performance.now();
  }
  return config;
}

export function recordClientResponse(response: AxiosResponse) {
  const config = response.config as MeasuredRequestConfig;
  const serverTiming = readHeader(response.headers, "server-timing");
  enqueueObservation(config, serverTiming, response.status);
}

export function recordClientFailure(
  config: InternalAxiosRequestConfig | undefined,
  headers: AxiosResponse["headers"] | undefined,
  statusCode: number | undefined,
) {
  if (!config || !headers || !statusCode) return;
  enqueueObservation(
    config as MeasuredRequestConfig,
    readHeader(headers, "server-timing"),
    statusCode,
  );
}

function enqueueObservation(
  config: MeasuredRequestConfig,
  serverTiming: string | undefined,
  statusCode: number,
) {
  const startedAt = config.saborMetricsStartedAt;
  if (
    typeof window === "undefined" ||
    !apiBaseUrl ||
    !canReport() ||
    startedAt === undefined ||
    isTelemetryRequest(config.url)
  ) {
    return;
  }

  const serverMeasurement = parseServerTiming(serverTiming);
  if (!serverMeasurement) return;

  const clientDurationMs = performance.now() - startedAt;
  if (
    !Number.isFinite(clientDurationMs) ||
    clientDurationMs < serverMeasurement.durationMs ||
    clientDurationMs > MAX_DURATION_MS
  ) {
    return;
  }

  observations.push({
    method: (config.method ?? "get").toUpperCase(),
    route: serverMeasurement.route,
    statusCode,
    clientDurationMs,
    serverDurationMs: serverMeasurement.durationMs,
  });

  if (observations.length >= MAX_BATCH_SIZE) {
    void flushClientLatencyMetrics();
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = undefined;
      void flushClientLatencyMetrics();
    }, FLUSH_INTERVAL_MS);
  }
}

async function flushClientLatencyMetrics() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = undefined;
  }
  if (!apiBaseUrl || !canReport() || observations.length === 0) return;

  const batch = observations.splice(0, MAX_BATCH_SIZE);
  try {
    await axios.post(
      `${apiBaseUrl}/api/telemetry/client-latency`,
      { measurements: batch },
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
        timeout: 5_000,
      },
    );
  } catch {
    // Client telemetry is best effort and must never affect application requests.
  }

  if (observations.length > 0 && !flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = undefined;
      void flushClientLatencyMetrics();
    }, FLUSH_INTERVAL_MS);
  }
}

function parseServerTiming(value: string | undefined) {
  if (!value) return null;
  const match = value.match(/(?:^|,)\s*app;dur=([\d.]+);desc="([^"\r\n]{1,256})"/i);
  if (!match) return null;

  const durationMs = Number(match[1]);
  const route = match[2].startsWith("/") ? match[2] : `/${match[2]}`;
  if (!Number.isFinite(durationMs) || durationMs < 0 || !route.startsWith("/api/")) {
    return null;
  }
  return { durationMs, route };
}

function readHeader(headers: AxiosResponse["headers"], name: string) {
  const headerSource = headers as unknown as {
    get?: (headerName: string) => unknown;
    [headerName: string]: unknown;
  };
  const value = typeof headerSource.get === "function"
    ? headerSource.get(name)
    : headerSource[name.toLowerCase()];
  return typeof value === "string" ? value : undefined;
}

function isTelemetryRequest(url: string | undefined) {
  return url?.includes("/telemetry/client-latency") ?? false;
}

export function shouldUseLocalStagingLongPolling(
  nodeEnv: string | undefined,
  apiBaseUrl: string | undefined,
): boolean {
  if (nodeEnv !== "development" || !apiBaseUrl) return false;

  try {
    const url = new URL(apiBaseUrl);
    return url.protocol === "http:" && url.port === "3000" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

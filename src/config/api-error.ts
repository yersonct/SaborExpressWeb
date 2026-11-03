type ApiErrorPayload = Record<string, unknown>;

export interface SanitizedServerError {
  message: string;
  data: ApiErrorPayload;
}

export function sanitizeServerError(
  status: number,
  payload: unknown,
  translate: (message: string) => string,
): SanitizedServerError | null {
  if (status < 500) return null;

  const message = translate("No se pudo completar la solicitud.");
  const traceId =
    payload !== null && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>).traceId
      : undefined;

  return {
    message,
    data: {
      code: "INTERNAL_ERROR",
      message,
      error: message,
      ...(typeof traceId === "string" && traceId.length <= 128 ? { traceId } : {}),
    },
  };
}

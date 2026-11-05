import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeServerError } from "./api-error.ts";

test("server errors redact response details while retaining a bounded trace id", () => {
  const sanitized = sanitizeServerError(
    500,
    {
      code: "DATABASE_FAILURE",
      message: "NpgsqlException: private-database-host",
      detail: "at PaymentService.Process() in /srv/source.cs:line 42",
      traceId: "0HNPPNNM1DR6A",
      stackTrace: "private stack",
    },
    (message) => `translated:${message}`,
  );

  assert.deepEqual(sanitized, {
    message: "translated:No se pudo completar la solicitud.",
    data: {
      code: "INTERNAL_ERROR",
      message: "translated:No se pudo completar la solicitud.",
      error: "translated:No se pudo completar la solicitud.",
      traceId: "0HNPPNNM1DR6A",
    },
  });
  assert.doesNotMatch(JSON.stringify(sanitized), /private-database|stackTrace|PaymentService/);
});

test("error sanitization does not replace useful client errors", () => {
  assert.equal(
    sanitizeServerError(409, { code: "CONFLICT", message: "La caja ya está cerrada." }, String),
    null,
  );
});

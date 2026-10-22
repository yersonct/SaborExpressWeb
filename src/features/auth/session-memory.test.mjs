import assert from "node:assert/strict";
import test from "node:test";
import {
  getInMemorySession,
  hasInMemorySession,
  setInMemorySession,
} from "./session-memory.ts";

test("session metadata exists only in memory and can be cleared", () => {
  const session = {
    userId: 12,
    identifier: "manager@example.com",
    roles: ["GERENTE"],
    employeeId: 5,
  };

  setInMemorySession(session);
  assert.equal(hasInMemorySession(), true);
  assert.deepEqual(getInMemorySession(), session);
  assert.equal("token" in getInMemorySession(), false);
  assert.equal("refreshToken" in getInMemorySession(), false);

  setInMemorySession(null);
  assert.equal(hasInMemorySession(), false);
  assert.equal(getInMemorySession(), null);
});

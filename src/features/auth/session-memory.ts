import type { UserSession } from "./types/auth.types";

let currentSession: UserSession | null = null;

export function getInMemorySession() {
  return currentSession;
}

export function setInMemorySession(session: UserSession | null) {
  currentSession = session;
}

export function hasInMemorySession() {
  return currentSession !== null;
}

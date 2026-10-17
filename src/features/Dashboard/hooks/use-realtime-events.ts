"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import * as signalR from "@microsoft/signalr";
import { notificationService } from "@/features/Notifications/services/notification.service";
import {
  reportNetworkAvailable,
  reportNetworkUnavailable,
} from "@/config/api";

const HUB_URL = `${(process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "")}/hubs/notifications`;
const SESSION_KEY = "sabor-express-session";
type EventCallback = (eventName?: string, ...args: unknown[]) => void;
type ReconnectCallback = () => void;
export type RealtimeConnectionStatus = "disconnected" | "connecting" | "connected";

type RealtimeSubscriber = {
  userId: number;
  connection: signalR.HubConnection;
  handlers: Map<string, (...args: unknown[]) => void>;
  onReconnected: ReconnectCallback;
};

// Una sola conexión SignalR sirve a todas las vistas del panel; cada vista
// conserva sus propios listeners y sigue pudiendo desmontarse sin fugas.
const subscribers = new Set<RealtimeSubscriber>();
let sharedConnection: signalR.HubConnection | null = null;
let sharedUserId: number | null = null;
const startingConnections = new WeakSet<signalR.HubConnection>();
let retryAttempt = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
const connectionStatuses = new Map<number, RealtimeConnectionStatus>();
const statusListeners = new Map<number, Set<() => void>>();

function getConnectionStatus(userId: number): RealtimeConnectionStatus {
  return connectionStatuses.get(userId) ?? "disconnected";
}

function setConnectionStatus(userId: number, status: RealtimeConnectionStatus) {
  if (getConnectionStatus(userId) === status) return;
  connectionStatuses.set(userId, status);
  statusListeners.get(userId)?.forEach((listener) => listener());
}

function subscribeToConnectionStatus(userId: number, listener: () => void) {
  let listeners = statusListeners.get(userId);
  if (!listeners) {
    listeners = new Set();
    statusListeners.set(userId, listeners);
  }
  listeners.add(listener);
  return () => {
    listeners?.delete(listener);
    if (listeners?.size === 0) statusListeners.delete(userId);
  };
}

function isUnauthorizedSignalrError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    statusCode?: unknown;
    status?: unknown;
    response?: { status?: unknown };
    message?: unknown;
  };
  return candidate.statusCode === 401 ||
    candidate.status === 401 ||
    candidate.response?.status === 401 ||
    (typeof candidate.message === "string" && /\b401\b|unauthorized/i.test(candidate.message));
}

function hasStoredSession(): boolean {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return Boolean(raw && JSON.parse(raw)?.token);
  } catch {
    return false;
  }
}

function notifyReconnected(userId: number) {
  subscribers.forEach((subscriber) => {
    if (subscriber.userId === userId) subscriber.onReconnected();
  });
}

function scheduleRetry(connection: signalR.HubConnection, userId: number) {
  if (
    retryTimer ||
    sharedConnection !== connection ||
    subscribers.size === 0 ||
    !hasStoredSession()
  ) return;
  const delays = [1000, 2000, 5000, 15000, 30000];
  const delay = delays[Math.min(retryAttempt, delays.length - 1)];
  retryAttempt += 1;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void startConnection(connection, userId);
  }, delay);
}

async function startConnection(
  connection: signalR.HubConnection,
  userId: number,
) {
  if (!hasStoredSession()) {
    setConnectionStatus(userId, "disconnected");
    return;
  }
  if (
    sharedConnection !== connection ||
    startingConnections.has(connection) ||
    connection.state !== signalR.HubConnectionState.Disconnected
  ) {
    return;
  }

  setConnectionStatus(userId, "connecting");
  startingConnections.add(connection);
  try {
    // Start the socket immediately; refresh through HTTP only after a 401.
    try {
      await connection.start();
    } catch (error) {
      if (!isUnauthorizedSignalrError(error)) throw error;
      if (!hasStoredSession()) return;
      await notificationService.getUnreadCount(userId);
      if (sharedConnection !== connection || !hasStoredSession()) return;
      await connection.start();
    }
    retryAttempt = 0;
    reportNetworkAvailable();
    setConnectionStatus(userId, "connected");
    // Sincroniza después de conectar para cubrir cambios ocurridos mientras
    // cada vista hacía su carga HTTP inicial.
    notifyReconnected(userId);
  } catch (error) {
    if (sharedConnection !== connection) return;
    // A revoked session or a logout event can race with SignalR's startup.
    // Don't report that expected 401 as a network outage or keep retrying it.
    if (!hasStoredSession() || isUnauthorizedSignalrError(error)) {
      setConnectionStatus(userId, "disconnected");
      return;
    }
    setConnectionStatus(userId, "disconnected");
    reportNetworkUnavailable(error);
    scheduleRetry(connection, userId);
  } finally {
    startingConnections.delete(connection);
  }
}

function createConnection(userId: number) {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => {
        const raw = localStorage.getItem("sabor-express-session");
        return raw ? (JSON.parse(raw).token ?? "") : "";
      },
      withCredentials: false,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Critical)
    .build();

  connection.onreconnected(() => {
    retryAttempt = 0;
    reportNetworkAvailable();
    setConnectionStatus(userId, "connected");
    notifyReconnected(userId);
  });
  connection.onreconnecting(() => {
    setConnectionStatus(userId, "connecting");
  });
  connection.onclose((error) => {
    if (sharedConnection !== connection) return;
    setConnectionStatus(userId, "disconnected");
    if (error) reportNetworkUnavailable(error);
    scheduleRetry(connection, userId);
  });

  sharedConnection = connection;
  sharedUserId = userId;
  return connection;
}

function subscribe(
  userId: number,
  events: string[],
  onEvent: EventCallback,
  onReconnected: ReconnectCallback,
) {
  if (sharedConnection && sharedUserId !== userId) {
    const previous = sharedConnection;
    if (sharedUserId != null) setConnectionStatus(sharedUserId, "disconnected");
    sharedConnection = null;
    sharedUserId = null;
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = null;
    retryAttempt = 0;
    void previous.stop();
  }

  const connection = sharedConnection ?? createConnection(userId);
  const handlers = new Map<string, (...args: unknown[]) => void>();
  const subscriber: RealtimeSubscriber = {
    userId,
    connection,
    handlers,
    onReconnected,
  };

  events.forEach((eventName) => {
    const handler = (...args: unknown[]) => onEvent(eventName, ...args);
    handlers.set(eventName, handler);
    connection.on(eventName, handler);
  });
  subscribers.add(subscriber);
  if (connection.state === signalR.HubConnectionState.Connected) {
    void Promise.resolve().then(() => {
      if (subscribers.has(subscriber) && sharedConnection === connection) {
        subscriber.onReconnected();
      }
    });
  } else {
    void startConnection(connection, userId);
  }

  return () => {
    handlers.forEach((handler, eventName) => connection.off(eventName, handler));
    subscribers.delete(subscriber);
    if (subscribers.size !== 0 || sharedConnection !== connection) return;

    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = null;
    setConnectionStatus(userId, "disconnected");
    sharedConnection = null;
    sharedUserId = null;
    void connection.stop();
  };
}

export function useRealtimeEvents(
  userId: number | null,
  events: string[],
  onEvent: EventCallback,
  onReconnected?: ReconnectCallback,
) {
  const onEventRef = useRef(onEvent);
  const onReconnectedRef = useRef(onReconnected);

  useEffect(() => {
    onEventRef.current = onEvent;
    onReconnectedRef.current = onReconnected;
  }, [onEvent, onReconnected]);

  const eventsKey = events.join("|");

  useEffect(() => {
    if (!userId) return;
    return subscribe(
      userId,
      eventsKey.split("|"),
      (eventName, ...args) => onEventRef.current(eventName, ...args),
      () => onReconnectedRef.current?.(),
    );
  }, [userId, eventsKey]);
}

export function useRealtimeConnectionStatus(userId: number | null) {
  const subscribeStatus = useCallback(
    (listener: () => void) => userId == null
      ? () => undefined
      : subscribeToConnectionStatus(userId, listener),
    [userId],
  );
  const getSnapshot = useCallback(
    () => userId == null ? "disconnected" : getConnectionStatus(userId),
    [userId],
  );

  return useSyncExternalStore(
    subscribeStatus,
    getSnapshot,
    () => "disconnected",
  );
}

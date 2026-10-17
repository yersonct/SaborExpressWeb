"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRealtimeEvents } from "./use-realtime-events";

function normalizeModule(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

export function useAdminDataChanged(
  userId: number | null,
  modules: string[],
  onChanged: () => void,
  onReconnected?: () => void,
) {
  const onChangedRef = useRef(onChanged);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modulesKey = modules
    .map((module) => module === "*" ? "*" : normalizeModule(module))
    .sort()
    .join("|");

  useEffect(() => {
    onChangedRef.current = onChanged;
  }, [onChanged]);

  useEffect(() => () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, [modulesKey]);

  const handleChange = useCallback(
    (eventName?: string, ...args: unknown[]) => {
      if (eventName !== "AdminDataChanged") return;
      const payload = args[0];
      if (payload === null || typeof payload !== "object") return;
      const moduleName = (payload as { module?: unknown }).module;
      if (typeof moduleName !== "string") return;

      const changedModule = normalizeModule(moduleName);
      const subscribedModules = modulesKey.split("|");
      if (!subscribedModules.includes("*") && !subscribedModules.includes(changedModule)) {
        return;
      }

      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        refreshTimerRef.current = null;
        onChangedRef.current();
      }, 75);
    },
    [modulesKey],
  );

  useRealtimeEvents(
    userId,
    ["AdminDataChanged"],
    handleChange,
    onReconnected,
  );
}

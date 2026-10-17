"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "./use-auth";
import { useRealtimeEvents } from "@/features/Dashboard/hooks/use-realtime-events";

// El hub cierra esta sesión si cambió el rol/turno o si se inició sesión en otro dispositivo.
export function useForceLogout() {
  const { session, logout } = useAuth();
  const router = useRouter();

  useRealtimeEvents(
    session?.userId ?? null,
    ["ForceLogout", "SessionReplaced"],
    (eventName, reasonArg) => {
      logout();
      const reason =
        typeof reasonArg === "string" ? reasonArg : "shift-changed";
      router.replace(
        eventName === "SessionReplaced"
          ? "/login?reason=session-replaced"
          : `/login?reason=${encodeURIComponent(reason)}`,
      );
    },
  );
}

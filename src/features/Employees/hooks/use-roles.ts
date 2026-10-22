"use client";

import { useCallback, useEffect, useState } from "react";
import { deferEffect } from "@/lib/defer-effect";
import { http } from "@/config/api";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useAdminDataChanged } from "@/features/Dashboard/hooks/use-admin-data-changed";
import { useRealtimeConnectionStatus } from "@/features/Dashboard/hooks/use-realtime-events";

export interface Role {
  id: number;
  name: string;
  description: string;
  requiresCv: boolean;
  status: boolean;
}

export function useRoles() {
  const { session } = useAuth();
  const userId = session?.userId ?? null;
  const realtimeStatus = useRealtimeConnectionStatus(userId);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRoles = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const { data } = await http.get<Role[]>("/Roles");
      setRoles(data);
      setError("");
    } catch (err) {
      if (!silent) {
        setError(
          err instanceof Error ? err.message : "No se pudieron cargar los roles",
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => deferEffect(() => void fetchRoles()), [fetchRoles]);

  const refreshAfterChange = useCallback(() => {
    void fetchRoles(true);
  }, [fetchRoles]);
  useAdminDataChanged(userId, ["Roles", "RolePermissions", "UserRoles"], refreshAfterChange, refreshAfterChange);

  // El backend exige el objeto completo (Name, Description, RequiresCv,
  // Status) en el PUT, así que mandamos los valores actuales del rol y
  // solo cambiamos requiresCv, para no pisar nada por accidente.
  const updateRequiresCv = async (role: Role, requiresCv: boolean) => {
    await http.put(`/Roles/${role.id}`, {
      name: role.name,
      description: role.description,
      requiresCv,
      status: role.status,
    });
    if (realtimeStatus !== "connected") await fetchRoles(true);
  };

  // Un solo botón que aplica el mismo valor a un grupo de roles a la vez
  // (ej. los 4 roles operativos), en vez de tocarlos uno por uno.
  // No hay endpoint bulk en el backend, así que se dispara un PUT por rol
  // en paralelo y se refresca una sola vez al final.
  const updateRequiresCvBulk = async (
    rolesToUpdate: Role[],
    requiresCv: boolean,
  ) => {
    await Promise.all(
      rolesToUpdate.map((role) =>
        http.put(`/Roles/${role.id}`, {
          name: role.name,
          description: role.description,
          requiresCv,
          status: role.status,
        }),
      ),
    );
    if (realtimeStatus !== "connected") await fetchRoles(true);
  };

  return {
    roles,
    loading,
    error,
    updateRequiresCv,
    updateRequiresCvBulk,
    refetch: fetchRoles,
  };
}

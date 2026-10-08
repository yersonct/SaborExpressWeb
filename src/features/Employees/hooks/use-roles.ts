"use client";

import { useCallback, useEffect, useState } from "react";
import { http } from "@/config/api";

export interface Role {
  id: number;
  name: string;
  description: string;
  requiresCv: boolean;
  status: boolean;
}

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await http.get<Role[]>("/Roles");
      setRoles(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar los roles",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

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
    await fetchRoles();
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
    await fetchRoles();
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

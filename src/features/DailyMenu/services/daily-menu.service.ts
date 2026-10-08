import { http } from "@/config/api";
import type {
  DailyMenuItem,
  CreateDailyMenuItemPayload,
  UpdateDailyMenuItemPayload,
  BulkSetDailyMenuPayload,
} from "../types/daily-menu.types";

export const dailyMenuService = {
  // GET /api/daily-menu/branch/{branchId}/date/{date}?period= — Gerente/Administrador
  getByBranchAndDate: async (
    branchId: number,
    date: string,
    period?: string,
  ): Promise<DailyMenuItem[]> => {
    const { data } = await http.get<DailyMenuItem[]>(
      `/daily-menu/branch/${branchId}/date/${date}`,
      { params: period ? { period } : undefined },
    );
    return data;
  },

  // GET /api/daily-menu/{id} — Gerente/Administrador
  getById: async (id: number): Promise<DailyMenuItem> => {
    const { data } = await http.get<DailyMenuItem>(`/daily-menu/${id}`);
    return data;
  },

  // POST /api/daily-menu — Gerente/Administrador
  create: async (
    payload: CreateDailyMenuItemPayload,
  ): Promise<DailyMenuItem> => {
    const { data } = await http.post<DailyMenuItem>("/daily-menu", payload);
    return data;
  },

  // POST /api/daily-menu/bulk — Gerente/Administrador
  // Reemplaza de una vez todo el menú de esa sede + fecha + franja
  bulkSet: async (
    payload: BulkSetDailyMenuPayload,
  ): Promise<DailyMenuItem[]> => {
    const { data } = await http.post<DailyMenuItem[]>(
      "/daily-menu/bulk",
      payload,
    );
    return data;
  },

  // PUT /api/daily-menu/{id} — Gerente/Administrador
  update: async (
    id: number,
    payload: UpdateDailyMenuItemPayload,
  ): Promise<DailyMenuItem> => {
    const { data } = await http.put<DailyMenuItem>(
      `/daily-menu/${id}`,
      payload,
    );
    return data;
  },

  // PATCH /api/daily-menu/{id}/toggle — Gerente/Administrador/Cocinero
  toggleAvailability: async (id: number): Promise<DailyMenuItem> => {
    const { data } = await http.patch<DailyMenuItem>(
      `/daily-menu/${id}/toggle`,
    );
    return data;
  },

  // DELETE /api/daily-menu/{id} — Gerente/Administrador
  remove: async (id: number): Promise<void> => {
    await http.delete(`/daily-menu/${id}`);
  },
};

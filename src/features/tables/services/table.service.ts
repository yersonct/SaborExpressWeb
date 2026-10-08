  import { http } from "@/config/api";
  import {
    type Table,
    type CreateTablePayload,
    type UpdateTablePayload,
    type UpdateTableStatusPayload,
    TableStatus,
  } from "../types/table.types";

  export const tableService = {
    // GET /api/Tables/branch/{branchId}
    getByBranch: async (branchId: number): Promise<Table[]> => {
      const { data } = await http.get<Table[]>(`/Tables/branch/${branchId}`);
      return data;
    },

    // GET /api/Tables/{id}
    getById: async (id: number): Promise<Table> => {
      const { data } = await http.get<Table>(`/Tables/${id}`);
      return data;
    },

    // POST /api/Tables — Gerente/Administrador
    create: async (payload: CreateTablePayload): Promise<Table> => {
      const { data } = await http.post<Table>("/Tables", payload);
      return data;
    },

    // PUT /api/Tables/{id} — Gerente/Administrador
    update: async (id: number, payload: UpdateTablePayload): Promise<Table> => {
      const { data } = await http.put<Table>(`/Tables/${id}`, payload);
      return data;
    },

    // PATCH /api/Tables/{id}/status — Gerente/Administrador/Mesero
    // El backend espera el enum como número (índice), no como string.
    updateStatus: async (
      id: number,
      payload: UpdateTableStatusPayload,
    ): Promise<Table> => {
      const statusIndex = Object.values(TableStatus).indexOf(payload.status);
      const { data } = await http.patch<Table>(`/Tables/${id}/status`, {
        status: statusIndex,
      });
      return data;
    },

    remove: async (id: number): Promise<void> => {
      await http.delete(`/Tables/${id}`);
    },
  };

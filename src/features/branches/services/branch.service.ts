import { http } from "@/config/api";
import type {
  Branch,
  CreateBranchPayload,
  UpdateBranchPayload,
} from "../types/branch.types";

export const branchService = {
  // GET /api/Branches — solo Gerente
  getAll: async (): Promise<Branch[]> => {
    const { data } = await http.get<Branch[]>("/Branches");
    return data;
  },

  // GET /api/Branches/{id} — solo Gerente
  getById: async (id: number): Promise<Branch> => {
    const { data } = await http.get<Branch>(`/Branches/${id}`);
    return data;
  },

  // GET /api/Branches/mine — Gerente o Administrador
  getMine: async (): Promise<Branch> => {
    const { data } = await http.get<Branch>("/Branches/mine");
    return data;
  },

  // POST /api/Branches — solo Gerente
  create: async (payload: CreateBranchPayload): Promise<Branch> => {
    const { data } = await http.post<Branch>("/Branches", payload);
    return data;
  },

  // PUT /api/Branches/{id} — Gerente (cualquiera) o Administrador (solo la suya)
  update: async (id: number, payload: UpdateBranchPayload): Promise<Branch> => {
    const { data } = await http.put<Branch>(`/Branches/${id}`, payload);
    return data;
  },

  // DELETE /api/Branches/{id} — solo Gerente
  remove: async (id: number): Promise<void> => {
    await http.delete(`/Branches/${id}`);
  },
};

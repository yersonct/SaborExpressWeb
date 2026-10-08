import { http } from "@/config/api";
import type {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "../types/category.types";

export const categoryService = {
  // GET /api/Categories — cualquier usuario autenticado
  getAll: async (): Promise<Category[]> => {
    const { data } = await http.get<Category[]>("/Categories");
    return data;
  },

  // GET /api/Categories/{id} — cualquier usuario autenticado
  getById: async (id: number): Promise<Category> => {
    const { data } = await http.get<Category>(`/Categories/${id}`);
    return data;
  },

  // POST /api/Categories — Gerente/Administrador
  create: async (payload: CreateCategoryPayload): Promise<Category> => {
    const { data } = await http.post<Category>("/Categories", payload);
    return data;
  },

  // PUT /api/Categories/{id} — Gerente/Administrador (devuelve 204, sin body)
  update: async (id: number, payload: UpdateCategoryPayload): Promise<void> => {
    await http.put(`/Categories/${id}`, payload);
  },

  // DELETE /api/Categories/{id} — Gerente/Administrador
  remove: async (id: number): Promise<void> => {
    await http.delete(`/Categories/${id}`);
  },
};

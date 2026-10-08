import { http } from "@/config/api";
import type {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
} from "../types/product.types";

function buildProductFormData(
  payload: CreateProductPayload | UpdateProductPayload,
): FormData {
  const formData = new FormData();
  formData.append("categoryId", payload.categoryId.toString());

  // Solo lo mandamos si hay un valor real; si queda sin elegir, el backend
  // lo interpreta como "global" (visible en todas las sedes).
  if (payload.branchId !== undefined && payload.branchId !== null) {
    formData.append("branchId", payload.branchId.toString());
  }

  formData.append("name", payload.name);
  formData.append("description", payload.description);
  formData.append("price", payload.price.toString());
  formData.append(
    "preparationTimeInMinutes",
    payload.preparationTimeInMinutes.toString(),
  );

  if ("status" in payload) {
    formData.append("status", payload.status.toString());
  }

  if (payload.photo) {
    formData.append("photo", payload.photo);
  }

  return formData;
}

export const productService = {
  // GET /api/Products?branchId= — cualquier autenticado
  // branchId opcional: filtra productos de esa sede + los globales
  getAll: async (branchId?: number): Promise<Product[]> => {
    const { data } = await http.get<Product[]>("/Products", {
      params: branchId ? { branchId } : undefined,
    });
    return data;
  },

  // GET /api/Products/{id} — cualquier autenticado
  getById: async (id: number): Promise<Product> => {
    const { data } = await http.get<Product>(`/Products/${id}`);
    return data;
  },

  // GET /api/Products/category/{categoryId} — cualquier autenticado
  getByCategory: async (categoryId: number): Promise<Product[]> => {
    const { data } = await http.get<Product[]>(
      `/Products/category/${categoryId}`,
    );
    return data;
  },

  // POST /api/Products (multipart/form-data) — Gerente/Administrador
  create: async (payload: CreateProductPayload): Promise<Product> => {
    const formData = buildProductFormData(payload);
    const { data } = await http.post<Product>("/Products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  // PUT /api/Products/{id} (multipart/form-data) — Gerente/Administrador (devuelve 204)
  update: async (id: number, payload: UpdateProductPayload): Promise<void> => {
    const formData = buildProductFormData(payload);
    await http.put(`/Products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // DELETE /api/Products/{id} — Gerente/Administrador
  remove: async (id: number): Promise<void> => {
    await http.delete(`/Products/${id}`);
  },

  // PATCH /api/Products/{id}/status — Gerente/Administrador/Cocinero
  updateStatus: async (id: number, status: boolean): Promise<void> => {
    await http.patch(`/Products/${id}/status`, { status });
  },
};

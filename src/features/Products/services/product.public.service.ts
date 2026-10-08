import { publicHttp } from "@/config/api";
import type { Product } from "../types/product.types";

export const productPublicService = {
  getAll: async (branchId?: number): Promise<Product[]> => {
    const { data } = await publicHttp.get<Product[]>("/Products", {
      params: branchId ? { branchId } : undefined,
    });
    return data;
  },
};

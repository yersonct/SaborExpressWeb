import { publicHttp } from "@/config/api";
import type { Category } from "../types/category.types";

export const categoryPublicService = {
  getAll: async (): Promise<Category[]> => {
    const { data } = await publicHttp.get<Category[]>("/Categories");
    return data;
  },
};

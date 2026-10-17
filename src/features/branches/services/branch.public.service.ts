import { publicHttp } from "@/config/api";
import type { PublicBranchInfo } from "../types/branch.types";

export const branchPublicService = {
  getAll: async (): Promise<PublicBranchInfo[]> => {
    const { data } = await publicHttp.get<PublicBranchInfo[]>("/Branches/public");
    return data;
  },
};

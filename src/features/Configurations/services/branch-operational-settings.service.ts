import { http } from "@/config/api";
import type {
  BranchOperationalSettings,
  UpdateBranchOperationalSettingsPayload,
} from "../types/branch-operational-settings.types";

export const branchOperationalSettingsService = {
  // GET /api/branch-settings/{branchId}
  get: async (branchId: number): Promise<BranchOperationalSettings> => {
    const { data } = await http.get<BranchOperationalSettings>(
      `/branch-settings/${branchId}`,
    );
    return data;
  },

  // PUT /api/branch-settings/{branchId}
  update: async (
    branchId: number,
    payload: UpdateBranchOperationalSettingsPayload,
  ): Promise<BranchOperationalSettings> => {
    const { data } = await http.put<BranchOperationalSettings>(
      `/branch-settings/${branchId}`,
      payload,
    );
    return data;
  },
};

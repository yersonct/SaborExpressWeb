import { http } from "@/config/api";

export interface MyProfile {
  id: number;
  name: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  branchId: number | null;
  branchName: string | null;
  roleNames: string[];
  vehicle: string | null;
  plate: string | null;
}

export interface UpdateMyProfilePayload {
  name: string;
  lastName?: string;
  phone?: string;
  vehicle?: string;
  plate?: string;
}

export const employeeMeService = {
  // GET /api/Employees/me
  get: async (): Promise<MyProfile> => {
    const { data } = await http.get<MyProfile>("/Employees/me");
    return data;
  },

  // PUT /api/Employees/me
  update: async (payload: UpdateMyProfilePayload): Promise<MyProfile> => {
    const { data } = await http.put<MyProfile>("/Employees/me", payload);
    return data;
  },
};

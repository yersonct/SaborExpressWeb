import { http } from "@/config/api";

export interface UserSettings {
  theme: "light" | "dark" | "system";
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundNotifications: boolean;
  timeZone: string;
  updatedAt: string | null;
  isDefault: boolean;
}

export type UpdateUserSettingsPayload = Omit<
  UserSettings,
  "updatedAt" | "isDefault"
>;

export const userSettingsService = {
  getMine: async (): Promise<UserSettings> => {
    const { data } = await http.get<UserSettings>("/user-settings/me");
    return data;
  },
  updateMine: async (
    payload: UpdateUserSettingsPayload,
  ): Promise<UserSettings> => {
    const { data } = await http.put<UserSettings>("/user-settings/me", payload);
    return data;
  },
};

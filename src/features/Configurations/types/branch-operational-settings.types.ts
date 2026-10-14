export interface BranchOperationalSettings {
  branchId: number;
  openingTime: string; // "HH:mm" o "" si aún no se configura
  closingTime: string;
  taxRate: number;
  deliveryFee: number;
  deliveryRadiusKm: number;
  maxActiveDeliveriesPerCourier: number;
  updatedAt: string | null;
  isDefault: boolean;
}

export type UpdateBranchOperationalSettingsPayload = Omit<
  BranchOperationalSettings,
  "branchId" | "updatedAt" | "isDefault"
>;

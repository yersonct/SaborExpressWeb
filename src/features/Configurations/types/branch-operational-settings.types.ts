export interface BranchOperationalSettings {
  branchId: number;
  openingTime: string; // "HH:mm"
  closingTime: string;
  taxRate: number;
  deliveryFee: number;
  suggestedTipPercent: number;
  deliveryRadiusKm: number;
  minOrderAmount: number;
  acceptsDelivery: boolean;
  acceptsDineIn: boolean;
  updatedAt: string | null;
  isDefault: boolean;
}

export type UpdateBranchOperationalSettingsPayload = Omit<
  BranchOperationalSettings,
  "branchId" | "updatedAt" | "isDefault"
>;

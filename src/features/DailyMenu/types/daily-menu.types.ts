export type MealPeriod = "Desayuno" | "Almuerzo" | "Cena";

export const MEAL_PERIODS: MealPeriod[] = ["Desayuno", "Almuerzo", "Cena"];

export interface DailyMenuItem {
  id: number;
  branchId: number;
  branchName: string;
  productId: number;
  productName: string;
  categoryName: string;
  productPrice: number;
  date: string; // ISO date (yyyy-MM-dd)
  mealPeriod: string;
  isAvailable: boolean;
  createdAt: string;
}

export interface CreateDailyMenuItemPayload {
  branchId: number;
  productId: number;
  date: string;
  mealPeriod: MealPeriod;
  isAvailable?: boolean;
}

export interface UpdateDailyMenuItemPayload {
  date: string;
  mealPeriod: MealPeriod;
  isAvailable: boolean;
}

export interface BulkSetDailyMenuPayload {
  branchId: number;
  date: string;
  mealPeriod: MealPeriod;
  productIds: number[];
}

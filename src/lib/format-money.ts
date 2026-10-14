import { getCurrentLocale } from "@/config/copy-translations";

export function formatMoney(amount: number, locale = getCurrentLocale()): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

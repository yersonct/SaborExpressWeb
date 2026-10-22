import {
  addColombiaDays,
  getColombiaDayKey,
  getColombiaDayStartUtc,
} from "@/lib/colombia-date";

export type DateRangeOption = "hoy" | "ayer" | "semana" | "mes";

export function buildDateRange(option: DateRangeOption, today = getColombiaDayKey()!): {
  fromDate: string;
  toDate: string;
} {
  const firstDay =
    option === "hoy"
      ? today
      : option === "ayer"
        ? addColombiaDays(today, -1)
        : addColombiaDays(today, option === "semana" ? -6 : -29);
  const lastDay = option === "ayer" ? firstDay : today;
  const fromDate = getColombiaDayStartUtc(firstDay);
  const toDate = new Date(
    getColombiaDayStartUtc(addColombiaDays(lastDay, 1)).getTime() - 1,
  );

  return { fromDate: fromDate.toISOString(), toDate: toDate.toISOString() };
}

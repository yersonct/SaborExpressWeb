export type DateRangeOption = "hoy" | "ayer" | "semana" | "mes";

export function buildDateRange(option: DateRangeOption): {
  fromDate: string;
  toDate: string;
} {
  const now = new Date();

  if (option === "hoy") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { fromDate: start.toISOString(), toDate: now.toISOString() };
  }

  if (option === "ayer") {
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { fromDate: start.toISOString(), toDate: end.toISOString() };
  }

  if (option === "semana") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return { fromDate: start.toISOString(), toDate: now.toISOString() };
  }

  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  start.setHours(0, 0, 0, 0);
  return { fromDate: start.toISOString(), toDate: now.toISOString() };
}

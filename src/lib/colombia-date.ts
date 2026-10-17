export const COLOMBIA_TIME_ZONE = "America/Bogota";

// Colombia permanece en UTC-5 y no aplica horario de verano.
const COLOMBIA_UTC_OFFSET_MS = -5 * 60 * 60 * 1000;

function toDate(value: Date | string | number): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function getColombiaDayKey(value: Date | string | number = new Date()): string | null {
  const date = toDate(value);
  if (!date) return null;

  const colombiaWallTime = new Date(date.getTime() + COLOMBIA_UTC_OFFSET_MS);
  const year = colombiaWallTime.getUTCFullYear();
  const month = String(colombiaWallTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(colombiaWallTime.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addColombiaDays(dayKey: string, days: number): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return [
    shifted.getUTCFullYear(),
    String(shifted.getUTCMonth() + 1).padStart(2, "0"),
    String(shifted.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function getColombiaDayStartUtc(dayKey: string): Date {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 5));
}

export function formatColombiaDateTime(
  value: Date | string | number,
  locale?: string,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = toDate(value);
  if (!date) return "";
  return date.toLocaleString(locale, {
    ...options,
    timeZone: COLOMBIA_TIME_ZONE,
  });
}

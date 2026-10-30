import { getCurrentLocale } from "@/config/copy-translations";
import type { CreateEmployeeSchedulePayload } from "../types/employee-schedule.types";
import type { Employee } from "@/features/Employees/types/employee.types";

export const emptyForm: CreateEmployeeSchedulePayload = {
  employeeId: 0,
  roleId: 0,
  branchId: 0,
  shiftDate: getColombiaNow().dateISO,
  startTime: "08:00",
  endTime: "17:00",
};

export type BranchEmployee = Pick<
  Employee,
  "id" | "name" | "lastName" | "branchId" | "hasCv" | "roleNames"
>;

// Normaliza valores del API (HH:mm:ss) al formato que acepta <input type="time">.
export function toTimeInputValue(time: string): string {
  const [hours = "00", minutes = "00"] = time.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

// Convierte "HH:mm" o "HH:mm:ss" a formato 12h con AM/PM, ej: "08:00" -> "8:00 a. m."
export function formatTime12h(time: string): string {
  const [hoursStr, minutesStr] = toTimeInputValue(time).split(":");
  const hours = Number(hoursStr);
  const minutes = minutesStr ?? "00";
  const date = new Date();
  date.setHours(hours, Number(minutes), 0, 0);
  return date.toLocaleTimeString(getCurrentLocale(), {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Ya no es un arreglo fijo — se calcula según el día real de cada fecha,
// porque la semana ahora puede arrancar en cualquier día (no solo lunes).
export function formatDayLabel(date: Date): string {
  const label = date.toLocaleDateString(getCurrentLocale(), { weekday: "short" });
  // Ej: "dom." -> "Dom", "lun." -> "Lun"
  const clean = label.replace(".", "");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}



export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatDayHeader(date: Date): string {
  return date.toLocaleDateString(getCurrentLocale(), { day: "2-digit", month: "short" });
}
// Detecta si un empleado tiene rol Gerente, sin importar cómo venga
// estructurado el campo en el objeto (roleName, role.name, role, etc.)
// Solo es el Gerente semilla si tiene el rol GERENTE y NO tiene sede.
// Un Gerente asignado por turno sí tiene sede, así que se muestra.
export function isGerenteRole(emp: Employee): boolean {
  const roles: string[] = emp.roleNames ?? [];
  return (
    roles.some((r) => r.toUpperCase().includes("GERENTE")) &&
    (emp.branchId === null || emp.branchId === undefined)
  );
}

export function isManagementRoleName(name: string | null | undefined): boolean {
  const normalizedName = name?.toUpperCase();
  return normalizedName === "GERENTE" || normalizedName === "ADMINISTRADOR";
}
export function isPastDate(dateISO: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateISO}T00:00:00`);
  return target < today;
}

// Fecha y hora actuales en Colombia, igual que el back (ColombiaTime),
// sin depender de la zona horaria del computador del administrador.
export function getColombiaNow(): { dateISO: string; seconds: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return {
    dateISO: `${get("year")}-${get("month")}-${get("day")}`,
    seconds:
      Number(get("hour")) * 3600 +
      Number(get("minute")) * 60 +
      Number(get("second")),
  };
}

// Turno de HOY cuya hora de fin ya pasó
export function isShiftEnded(
  s: { shiftDate: string; endTime: string },
  now: { dateISO: string; seconds: number },
): boolean {
  if (s.shiftDate !== now.dateISO) return false;
  const [h, m, sec] = s.endTime.split(":").map(Number);
  return now.seconds > h * 3600 + m * 60 + (sec || 0);
}

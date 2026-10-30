import type { Employee } from "../types/employee.types";

export type NotifyState = { message: string; type: "success" | "error" } | null;

export const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#111827] placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent transition-all";

export const labelClass =
  "block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2";

export const INITIAL_FORM = {
  name: "",
  lastName: "",
  document: "",
  email: "",
  phone: "",
  address: "",
  branchId: "",
  basePay: "",
  roleIds: [] as number[],
  cv: null as File | null,
};

export const ITEMS_PER_PAGE = 10;

// El rol que se muestra es SOLO el del turno de hoy. "Cliente" nunca.
// Excepción: el Gerente General sembrado no tiene turnos, así que
// sin turno hoy se sigue mostrando como GERENTE.
export const getDisplayRoles = (emp: Employee): string[] => {
  const today = (emp.todayRoleNames ?? []).filter(
    (r) => r.toUpperCase() !== "CLIENTE",
  );
  return today;
};

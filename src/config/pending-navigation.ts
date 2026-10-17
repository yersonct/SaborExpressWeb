export const pendingNavigationKeys = {
  order: "sabor-express:navigation:open-order",
  scheduleEmployee: "sabor-express:navigation:schedule-employee",
  editEmployee: "sabor-express:navigation:edit-employee",
} as const;

export function rememberNavigationTarget(key: string, id: number) {
  if (typeof window === "undefined" || !Number.isSafeInteger(id) || id <= 0) {
    return;
  }

  window.sessionStorage.setItem(key, String(id));
}

export function consumeNavigationTarget(key: string): number | null {
  if (typeof window === "undefined") return null;

  const value = window.sessionStorage.getItem(key);
  if (value === null) return null;

  window.sessionStorage.removeItem(key);
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

"use client";

import { Dialog } from "@/components/ui/dialog";
import { useEmployees } from "@/features/Employees/hooks/use-employees";
import type { Branch } from "../types/branch.types";

interface BranchEmployeesModalProps {
  branch: Branch | null;
  onClose: () => void;
}

export const BranchEmployeesModal = ({
  branch,
  onClose,
}: BranchEmployeesModalProps) => {
  // Reutilizamos el mismo hook de siempre; solo hace falta traer activos.
  const { employees, loading } = useEmployees("activo");

  const branchEmployees = branch
    ? employees.filter((emp: any) => emp.branchId === branch.id)
    : [];

  return (
    <Dialog
      isOpen={!!branch}
      title={branch ? `Empleados de ${branch.name}` : "Empleados"}
      subtitle={
        branch
          ? `${branchEmployees.length} ${branchEmployees.length === 1 ? "empleado activo" : "empleados activos"}`
          : undefined
      }
      onClose={onClose}
    >
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : branchEmployees.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          Esta sede aún no tiene empleados activos asignados.
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {branchEmployees.map((emp: any) => (
            <div
              key={emp.id}
              className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#111827] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111827]">
                    {emp.name} {emp.lastName ?? ""}
                  </p>
                  <p className="text-xs text-gray-500">
                    {emp.roleNames?.length > 0
                      ? emp.roleNames.join(", ")
                      : "Sin rol asignado"}
                  </p>
                </div>
              </div>
              {emp.phone && (
                <span className="text-xs text-gray-400">{emp.phone}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </Dialog>
  );
};

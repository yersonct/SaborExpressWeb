"use client";

import type { Branch } from "../types/branch.types";

interface BranchCardProps {
  branch: Branch;
  index: number;
  onEdit: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
}

export const BranchCard = ({
  branch,
  index,
  onEdit,
  onDelete,
}: BranchCardProps) => {
  return (
    <div className="border border-gray-200 rounded-xl bg-white p-6 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#111827] text-white flex items-center justify-center text-sm font-bold">
            {branch.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#111827] leading-tight">
              {branch.name}
            </h3>
            <p className="text-xs text-gray-400">
              {branch.address || "Sin dirección"}
            </p>
          </div>
        </div>

        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
            branch.status
              ? "bg-gray-100 text-gray-700"
              : "bg-gray-50 text-gray-400"
          }`}
        >
          {branch.status ? "Activa" : "Inactiva"}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3 mb-4">
        <span>{branch.phone || "Sin teléfono"}</span>
        <span>
          {branch.employeeCount}{" "}
          {branch.employeeCount === 1 ? "empleado" : "empleados"}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(branch)}
          className="flex-1 py-2 rounded-lg text-xs font-semibold text-[#111827] border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(branch)}
          className="flex-1 py-2 rounded-lg text-xs font-semibold text-[#EA1D2C] border border-red-100 hover:bg-red-50 transition-colors"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};

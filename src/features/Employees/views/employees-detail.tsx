"use client";

import { translateCopy } from "@/config/copy-translations";
import { formatMoney } from "@/lib/format-money";
import { Dialog } from "@/components/ui/dialog";
import { getDisplayRoles } from "./employees-utils";
import type { EmployeesModel } from "./employees-model";
export function EmployeeDetail({ model }: { model: EmployeesModel }) {
  const { isViewOpen, setIsViewOpen, selectedEmployee, loadingCv, handleViewCv, handleDownloadCv } = model;
  return (<>
        {/* MODAL: VER DETALLES */}
        <Dialog
          isOpen={isViewOpen}
          title={translateCopy("Detalles del Empleado")}
          onClose={() => setIsViewOpen(false)}
        >
          {selectedEmployee && (
            <div>
              <div className="flex flex-col items-center mb-6 text-center">
                <div className="w-20 h-20 rounded-full bg-[#111827] text-white flex items-center justify-center font-black text-3xl mb-4 shadow-lg">
                  {selectedEmployee.name.substring(0, 2).toUpperCase()}
                </div>
                <h2 className="text-2xl font-black text-[#111827]">
                  {selectedEmployee.name} {selectedEmployee.lastName ?? ""}
                </h2>
                <div className="flex flex-wrap gap-1 justify-center mt-2">
                  {getDisplayRoles(selectedEmployee).map((role) => (
                    <span
                      key={role}
                      className="text-xs font-bold text-[#EA1D2C]"
                    >
                      {translateCopy(role)}
                    </span>
                  ))}
                </div>
                <span
                  className={`mt-3 inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full ${
                    selectedEmployee.status === "Activo"
                      ? "bg-green-50 text-green-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {selectedEmployee.status}
                </span>
              </div>

              <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">
                     {translateCopy("Documento")} </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {selectedEmployee.document}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">
                     {translateCopy("Teléfono")} </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {selectedEmployee.phone ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">
                     {translateCopy("Correo")} </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {selectedEmployee.email ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">
                     {translateCopy("Salario Base")} </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {formatMoney(selectedEmployee.basePay)}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">
                       {translateCopy("Hoja de Vida")} </span>
                    <span className="text-sm font-semibold text-gray-800">
                      {selectedEmployee.hasCv ? translateCopy("Cargada ✅") : translateCopy("No cargada")}
                    </span>
                  </div>
                  {selectedEmployee.hasCv && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleViewCv(selectedEmployee)}
                        disabled={loadingCv}
                        className="flex-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg py-2 hover:bg-blue-100 transition-colors disabled:opacity-50"
                      >
                        {loadingCv ? translateCopy("Cargando...") : translateCopy("👁️ Ver")}
                      </button>
                      <button
                        onClick={() => handleDownloadCv(selectedEmployee)}
                        disabled={loadingCv}
                        className="flex-1 text-xs font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded-lg py-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {loadingCv ? translateCopy("Cargando...") : translateCopy("⬇️ Descargar")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Dialog>
  </>);
}

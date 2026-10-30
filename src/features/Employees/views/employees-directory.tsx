"use client";

import { translateCopy } from "@/config/copy-translations";
import type { EmployeeStatusFilter } from "../types/employee.types";
import { ITEMS_PER_PAGE, getDisplayRoles } from "./employees-utils";
import type { EmployeesModel } from "./employees-model";
export function EmployeesDirectory({ model }: { model: EmployeesModel }) {
  const { estado, setEstado, loading, error, isGerente, isAdmin, branches, setConfirmDeactivate, setConfirmReactivate, setConfirmDeleteEmployee, currentPage, setCurrentPage, saving, visibleEmployees, totalPages, startIndex, paginatedEmployees, openEdit, openView } = model;
  return (<>
        {/* TABLA */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-3 bg-gray-50/50">
            <div>
              <h2 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#EA1D2C]"></span>{" "}
                 {translateCopy("Directorio de Empleados")} </h2>
              <p className="text-xs font-semibold text-[#EA1D2C] mt-1">
                {visibleEmployees.length}{" "}
                {visibleEmployees.length === 1 ? translateCopy("empleado") : translateCopy("empleados")}
                {estado === "activo" && translateCopy(" activos")}
                {estado === "retirado" && translateCopy(" retirados")}
                {estado === "todos" && translateCopy(" en total")}
              </p>
            </div>
            <select
              value={estado}
              onChange={(e) => {
                setEstado(e.target.value as EmployeeStatusFilter);
                setCurrentPage(1);
              }}
              className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
            >
              <option value="activo">{translateCopy("Activos")}</option>
              <option value="retirado">{translateCopy("Retirados")}</option>
              <option value="todos">{translateCopy("Todos")}</option>
            </select>
          </div>

          {loading ? (
            <div className="p-10 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl bg-gray-100 animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">{translateCopy(error)}</div>
          ) : visibleEmployees.length === 0 ? (
            <div className="p-6 text-center sm:p-16">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-gray-400 font-medium">
                 {translateCopy("No hay empleados")}{" "}
                {estado === "activo"
                  ? translateCopy("activos")
                  : estado === "retirado"
                    ? translateCopy("retirados")
                    : ""}{" "}
                 {translateCopy("registrados.")} </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-100">
                      <th className="p-4 font-bold">{translateCopy("Empleado")}</th>
                      <th className="p-4 font-bold">{translateCopy("Contacto")}</th>
                      <th className="p-4 font-bold">{translateCopy("Rol / Sede")}</th>
                      <th className="p-4 font-bold text-center">{translateCopy("Estado")}</th>
                      <th className="p-4 font-bold text-center">{translateCopy("Acciones")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedEmployees.map((emp) => {
                      const branch = branches.find(
                        (b) => b.id === emp.branchId,
                      );
                      return (
                        <tr
                          key={emp.id}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex gap-3 items-center">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                                {emp.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-[#111827]">
                                  {emp.name} {emp.lastName ?? ""}
                                </h4>
                                <p className="text-xs text-gray-500">
                                   {translateCopy("CC:")} {emp.document}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="text-xs text-gray-700">
                              {emp.email ?? "—"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {emp.phone ?? "—"}
                            </p>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {getDisplayRoles(emp).map((role) => (
                                <span
                                  key={role}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700"
                                >
                                  {translateCopy(role)}
                                </span>
                              ))}
                            </div>
                            {getDisplayRoles(emp).length === 0 && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  emp.todayShiftState === "Ended"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {emp.todayShiftState === "Ended"
                                  ? translateCopy("Turno terminado")
                                  : translateCopy("Sin turno hoy")}
                              </span>
                            )}
                            <p className="text-[10px] text-gray-500 mt-1">
                              {emp.todayBranchName ?? branch?.name ?? translateCopy("Sin sede")}
                            </p>
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
                                emp.status === "Activo"
                                  ? "bg-green-50 text-green-600 border border-green-200"
                                  : "bg-red-50 text-red-600 border border-red-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${emp.status === "Activo" ? "bg-green-500" : "bg-red-500"}`}
                              ></span>
                              {translateCopy(emp.status)}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openView(emp)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                              >
                                 {translateCopy("Ver")} </button>
                              <button
                                onClick={() => openEdit(emp)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors"
                              >
                                 {translateCopy("Editar")} </button>
                              <button
                                onClick={() => {
                                  if (emp.status === "Activo") {
                                    setConfirmDeactivate(emp);
                                  } else {
                                    setConfirmReactivate(emp);
                                  }
                                }}
                                disabled={saving}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200 transition-colors disabled:opacity-50"
                              >
                                {translateCopy(emp.status === "Activo" ? "Suspender" : "Reactivar")}
                              </button>
                              {(isGerente || isAdmin) && (
                                <button
                                  onClick={() => setConfirmDeleteEmployee(emp)}
                                  disabled={saving}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#EA1D2C] border border-[#EA1D2C] hover:bg-[#EA1D2C] hover:text-white transition-colors disabled:opacity-50"
                                >
                                  {translateCopy("Eliminar")}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <p className="text-xs text-gray-500">
                     {translateCopy("Mostrando")} {startIndex + 1}–
                    {Math.min(startIndex + ITEMS_PER_PAGE, visibleEmployees.length)}  {translateCopy("de")}{" "}
                    {visibleEmployees.length}
                  </p>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                       {translateCopy("Anterior")} </button>
                    <span className="px-3 py-1.5 text-xs font-bold text-gray-500">
                       {translateCopy("Página")} {currentPage}  {translateCopy("de")} {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                       {translateCopy("Siguiente")} </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
  </>);
}

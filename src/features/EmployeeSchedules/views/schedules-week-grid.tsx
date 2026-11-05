"use client";

import { translateCopy } from "@/config/copy-translations";
import { formatTime12h, formatDayLabel, toISODate, formatDayHeader, isManagementRoleName, isPastDate, isShiftEnded } from "./schedules-utils";
import type { SchedulesModel } from "./schedules-model";
export function SchedulesWeekGrid({ model }: { model: SchedulesModel }) {
  const { isGerente, now, branchId, PAGE_SIZE, setPage, loading, openCreateModal, weekDays, historicalEmployeeIds, branchEmployees, filteredEmployees, totalPages, currentPage, visibleEmployees, scheduleLookup, selectedBranchHours, openEditModal, setConfirmDeleteId, openTransferModal } = model;
  return (<>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <p className="text-center py-10 text-gray-400">{translateCopy("Cargando turnos...")}</p>
        ) : branchEmployees.length === 0 ? (
          <p className="text-center py-10 text-gray-400">
             {translateCopy("No hay empleados activos en esta sede.")} </p>
        ) : (
          <table className="w-full min-w-[1000px] text-sm xl:text-base table-fixed">
            <thead className="bg-gray-50 text-gray-500 uppercase text-sm">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 text-left px-3 xl:px-4 py-4 w-36 xl:w-44">
                   {translateCopy("Empleado")} </th>
                {weekDays.map((d, i) => (
                  <th key={i} className="text-center px-2 py-4">
                    <div className="text-sm">{formatDayLabel(d)}</div>
                    <div className="text-xs font-normal normal-case text-gray-400 mt-0.5">
                      {formatDayHeader(d)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleEmployees.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                     {translateCopy("Ningún empleado coincide con la búsqueda.")} </td>
                </tr>
              )}
              {visibleEmployees.map((emp) => (
                <tr key={emp.id} className="border-t border-gray-100">
                  <td className="sticky left-0 z-10 bg-white px-3 xl:px-4 py-4">
                    <p className="font-semibold text-[#081A38] text-sm xl:text-base">
                      {emp.name} {emp.lastName ?? ""}
                    </p>
                    {historicalEmployeeIds.has(emp.id) && (
                      <p className="text-[10px] text-gray-400 italic">
                         {translateCopy("Trasladado a otra sede — solo historial")} </p>
                    )}
                    {isGerente && emp.branchId === branchId && (
                      <button
                        onClick={() => openTransferModal(emp)}
                        className="text-[10px] font-semibold text-gray-400 hover:text-[#EA1D2C] transition-colors mt-0.5"
                      >
                         {translateCopy("Trasladar de sede")} </button>
                    )}
                  </td>
                  {weekDays.map((d, i) => {
                    const dateISO = toISODate(d);
                    const dayShifts =
                      scheduleLookup.get(`${emp.id}_${dateISO}`) ?? [];
                    return (
                      <td key={i} className="text-center px-1 py-2">
                        {dayShifts.length === 0 ? (
                          historicalEmployeeIds.has(emp.id) ? null : (
                            <button
                              onClick={() => {
                                if (isPastDate(dateISO)) return; // no se crean turnos en fechas pasadas
                                openCreateModal(emp.id, branchId ?? 0, dateISO);
                              }}
                              disabled={isPastDate(dateISO)}
                              className="w-full text-gray-300 hover:text-[#EA1D2C] text-lg py-3 rounded-md hover:bg-red-50 transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          )
                        ) : (
                          dayShifts.map((s) => {
                            const locked = isPastDate(s.shiftDate);
                            const usesCurrentBranchHours =
                              selectedBranchHours !== null &&
                              s.shiftDate >= now.dateISO;
                            const startTime = usesCurrentBranchHours
                              ? selectedBranchHours.open
                              : s.startTime;
                            const endTime = usesCurrentBranchHours
                              ? selectedBranchHours.close
                              : s.endTime;
                            const endedToday =
                              !locked &&
                              isShiftEnded({ shiftDate: s.shiftDate, endTime }, now);
                            return (
                              <div
                                key={s.id}
                                title={
                                  s.isOwnLockedShift
                                    ? translateCopy("No puedes editar ni eliminar tus propios turnos como Gerente o Administrador.")
                                    : endedToday
                                    ? translateCopy("Turno de hoy finalizado")
                                    : undefined
                                }
                                className={`rounded-lg px-1 py-1.5 xl:px-2 xl:py-2 text-xs xl:text-sm leading-tight break-words font-semibold mb-1 ${
                                  locked
                                    ? "bg-gray-100 text-gray-400"
                                    : endedToday
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-[#0F2F6B]/10 text-[#0F2F6B]"
                                }`}
                              >
                                <div className="flex flex-col gap-0.5 break-words">
                                  <span>{formatTime12h(startTime)}</span>
                                  <span aria-hidden="true">–</span>
                                  <span>{formatTime12h(endTime)}</span>
                                </div>
                                <div
                                  className={`text-xs font-normal mt-0.5 ${
                                    locked
                                      ? "text-gray-400"
                                      : endedToday
                                        ? "text-amber-700/70"
                                        : "text-[#0F2F6B]/70"
                                  }`}
                                >
                                  {translateCopy(s.roleName)}
                                </div>
                                {!locked && !s.isOwnLockedShift &&
                                  (isGerente || !isManagementRoleName(s.roleName)) && (
                                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                                    <button
                                      onClick={() => openEditModal(s)}
                                      className="h-8 w-8 shrink-0 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-[#0F2F6B] hover:border-[#0F2F6B]/40 text-xs flex items-center justify-center"
                                      aria-label={translateCopy("Editar turno")}
                                    >
                                      ✎
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(s.id)}
                                      className="h-8 w-8 shrink-0 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 text-xs flex items-center justify-center"
                                      aria-label={translateCopy("Eliminar turno")}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filteredEmployees.length > PAGE_SIZE && (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-sm text-gray-500">
          <span>
             {translateCopy("Mostrando")} {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filteredEmployees.length)}  {translateCopy("de")}{" "}
            {filteredEmployees.length}  {translateCopy("empleados")} </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
               {translateCopy("← Anterior")} </button>
            <span className="font-semibold text-[#081A38]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
               {translateCopy("Siguiente →")} </button>
          </div>
        </div>
      )}
  </>);
}

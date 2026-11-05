"use client";

import { translateCopy } from "@/config/copy-translations";
import { formatTime12h, formatDayLabel, toISODate, formatDayHeader, isPastDate } from "./schedules-utils";
import type { SchedulesModel } from "./schedules-model";
export function SchedulesBulkForm({ model }: { model: SchedulesModel }) {
  const { branchHours, isBulkModalOpen, setIsBulkModalOpen, bulkForm, setBulkForm, bulkSaving, bulkError, bulkFieldErrors, setBulkFieldErrors, weekDays, branchEmployees, operationalRoles, handleBulkSubmit, toggleBulkDay } = model;
  return (<>
      {isBulkModalOpen && (
        <div
          onClick={() => setIsBulkModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative my-auto w-full max-w-md max-h-[90dvh] overflow-y-auto bg-white rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.25)] border border-[#E5E7EB] px-5 py-6 sm:px-8 sm:py-10"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#EA1D2C] to-[#F87171]" />

            <h2 className="text-2xl font-extrabold text-[#111827] mb-1">
               {translateCopy("Asignar semana completa")} </h2>
            <p className="text-xs text-gray-500 mb-6">
               {translateCopy("Crea el mismo turno para uno o varios días de esta semana.")} </p>

            {bulkError.length > 0 && (
              <div className="bg-red-100 text-[#EF4444] px-4 py-3 rounded-xl mb-4 text-sm font-medium whitespace-pre-wrap">
                {bulkError.map((message, index) => (
                  <p key={`${index}-${message}`}>{translateCopy(message)}</p>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500">
                   {translateCopy("Empleado")} </label>
                <select
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                  value={bulkForm.employeeId}
                  onChange={(e) =>
                    setBulkForm({
                      ...bulkForm,
                      employeeId: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>{translateCopy("Todos los empleados de esta sede")}</option>
                  {branchEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.lastName ?? ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500">
                   {translateCopy("Rol del turno")} </label>
                <select
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                  value={bulkForm.roleId}
                  onChange={(e) => { setBulkForm({ ...bulkForm, roleId: Number(e.target.value) }); setBulkFieldErrors((current) => ({ ...current, roleId: "" })); }}
                  aria-invalid={!!bulkFieldErrors.roleId}
                >
                  <option value={0}>{translateCopy("Selecciona...")}</option>
                  {operationalRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {translateCopy(role.name)}
                    </option>
                  ))}
                </select>
                {bulkFieldErrors.roleId && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(bulkFieldErrors.roleId)}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500">
                     {translateCopy("Hora inicio")} </label>
                  <input
                    type="time"
                    disabled
                    step={60}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-500 bg-gray-100 cursor-not-allowed"
                    value={bulkForm.startTime}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">
                     {translateCopy("Hora fin")} </label>
                  <input
                    type="time"
                    disabled
                    step={60}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-500 bg-gray-100 cursor-not-allowed"
                    value={bulkForm.endTime}
                  />
                </div>
              </div>
              {branchHours && (
                <p className="text-[11px] text-gray-400 -mt-2">
                  {translateCopy("Horario de la sede:")} {formatTime12h(branchHours.open)} –{" "}
                  {formatTime12h(branchHours.close)}
                </p>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-2">
                   {translateCopy("Días de esta semana")} </label>
                <div className="flex gap-1.5 flex-wrap">
                  {weekDays.map((d, i) => {
                    const past = isPastDate(toISODate(d));
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={past}
                        onClick={() => toggleBulkDay(i)}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                          bulkForm.days.includes(i)
                            ? "bg-[#EA1D2C] text-white border-[#EA1D2C]"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {formatDayLabel(d)} {formatDayHeader(d)}
                      </button>
                    );
                  })}
                </div>
                {bulkFieldErrors.days && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(bulkFieldErrors.days)}</p>}
                <p className="text-[10px] text-gray-400 mt-2">
                   {translateCopy("Si un empleado ya tiene turno en alguno de estos días, ese día se omite automáticamente (no se duplica).")} </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-gray-500 font-semibold hover:bg-gray-100"
              >
                 {translateCopy("Cancelar")} </button>
              <button
                onClick={handleBulkSubmit}
                disabled={bulkSaving}
                className="px-6 py-2.5 rounded-xl bg-[#EA1D2C] text-white font-bold shadow-sm hover:shadow-md hover:bg-[#D91B29] transition-all disabled:opacity-40"
              >
                {bulkSaving ? translateCopy("Asignando...") : translateCopy("Asignar turnos")}
              </button>
            </div>
          </div>
        </div>
      )}
  </>);
}

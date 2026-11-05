"use client";

import { translateCopy } from "@/config/copy-translations";
import { formatTime12h } from "./schedules-utils";
import type { SchedulesModel } from "./schedules-model";
export function SchedulesForm({ model }: { model: SchedulesModel }) {
  const { isGerente, myBranch, allBranches, employees, branchHours, setNoHoursAlert, loadBranchHours, isModalOpen, setIsModalOpen, editingId, setEditingId, form, setForm, saving, formError, setFormError, scheduleFieldErrors, setScheduleFieldErrors, operationalRoles, employeesWithoutSchedule, selectedEmployee, selectedRole, needsCvWarning, handleSubmit } = model;
  return (<>
      {isModalOpen && (
        <div
          onClick={() => {
            setIsModalOpen(false);
            setEditingId(null);
          }}
          className={`
          fixed inset-0 z-50 flex items-center justify-center overflow-y-auto
          bg-black/50 p-3 backdrop-blur-sm
          transition-all duration-300
        `}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`
            relative my-auto w-full max-w-md max-h-[90dvh] overflow-y-auto bg-white rounded-3xl
            shadow-[0_20px_80px_rgba(0,0,0,0.25)]
            border border-[#E5E7EB]
            px-5 py-6 sm:px-8 sm:py-10
            transition-all duration-300
            scale-100 translate-y-0 opacity-100
          `}
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#EA1D2C] to-[#F87171]" />

            <h2 className="text-2xl font-extrabold text-[#111827] mb-6">
              {editingId ? translateCopy("Editar turno") : translateCopy("Nuevo turno")}
            </h2>
            {form.employeeId !== 0 && selectedEmployee && (
              <p className="text-sm font-semibold text-gray-500 -mt-4 mb-6">
                {selectedEmployee.name} {selectedEmployee.lastName ?? ""}
              </p>
            )}

            {formError && (
              <div className="bg-red-100 text-[#EF4444] px-4 py-3 rounded-xl mb-4 text-sm font-medium">
                {translateCopy(formError)}
              </div>
            )}

            <div className="space-y-4">
              <div className={form.employeeId !== 0 ? "hidden" : ""}>
                <label className="text-xs font-semibold text-gray-500">
                   {translateCopy("Empleado")} </label>
                <select
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                  value={form.employeeId}
                  onChange={(e) => {
                    const empId = Number(e.target.value);
                    const selected = employees.find(
                      (emp) => emp.id === empId,
                    );
                    setForm({
                      ...form,
                      employeeId: empId,
                      branchId: isGerente
                        ? (selected?.branchId ?? form.branchId)
                        : (myBranch?.id ?? 0),
                    });
                    setFormError("");
                    setScheduleFieldErrors((current) => ({ ...current, employeeId: "", branchId: "" }));
                  }}
                  aria-invalid={!!scheduleFieldErrors.employeeId}
                >
                  <option value={0}>{translateCopy("Selecciona...")}</option>
                  {employeesWithoutSchedule.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.lastName ?? ""}
                    </option>
                  ))}
                </select>
                {scheduleFieldErrors.employeeId && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(scheduleFieldErrors.employeeId)}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">
                   {translateCopy("Sede")} </label>
                {isGerente ? (
                  <select
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                    value={form.branchId}
                    onChange={async (e) => {
                      const newId = Number(e.target.value);
                      setForm((f) => ({ ...f, branchId: newId }));
                      setScheduleFieldErrors((current) => ({ ...current, branchId: "" }));
                      if (!newId) return;
                      const hours = await loadBranchHours(newId);
                      if (!hours) {
                        setNoHoursAlert(true);
                        return;
                      }
                      setForm((f) => ({
                        ...f,
                        startTime: hours.open,
                        endTime: hours.close,
                      }));
                    }}
                  >
                    <option value={0}>{translateCopy("Selecciona...")}</option>
                    {allBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={myBranch?.name ?? translateCopy("Sin sede asignada")}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-500 bg-gray-100"
                  />
                )}
                {scheduleFieldErrors.branchId && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(scheduleFieldErrors.branchId)}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500">
                   {translateCopy("Rol del turno")} </label>
                <select
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                  value={form.roleId}
                  onChange={(e) => { setForm({ ...form, roleId: Number(e.target.value) }); setScheduleFieldErrors((current) => ({ ...current, roleId: "" })); }}
                  aria-invalid={!!scheduleFieldErrors.roleId}
                >
                  <option value={0}>{translateCopy("Selecciona...")}</option>
                  {operationalRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {translateCopy(role.name)}
                    </option>
                  ))}
                </select>
                {scheduleFieldErrors.roleId && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(scheduleFieldErrors.roleId)}</p>}
              </div>

              {needsCvWarning && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-xs text-orange-700">
                  <strong>{selectedEmployee?.name}</strong>  {translateCopy("no tiene hoja de vida cargada, y el rol")} <strong>{translateCopy(selectedRole?.name ?? "")}</strong>{" "}
                   {translateCopy("la requiere. Ve a \"Gestión de Talento\", edita a este empleado y sube su CV antes de poder asignarle este turno.")} </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500">
                   {translateCopy("Fecha")} </label>
                <input
                  type="date"
                  disabled
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-500 bg-gray-100 cursor-not-allowed"
                  value={form.shiftDate}
                />
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
                    value={form.startTime}
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
                    value={form.endTime}
                  />
                </div>
              </div>
              {branchHours && (
                <p className="text-[11px] text-gray-400 -mt-2">
                   {translateCopy("Horario de la sede:")} {formatTime12h(branchHours.open)} –{" "}
                  {formatTime12h(branchHours.close)}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                }}
                className="px-4 py-2.5 rounded-xl text-gray-500 font-semibold hover:bg-gray-100"
              >
                 {translateCopy("Cancelar")} </button>
              <button
                onClick={handleSubmit}
                disabled={saving || needsCvWarning}
                className="px-6 py-2.5 rounded-xl bg-[#EA1D2C] text-white font-bold shadow-sm hover:shadow-md hover:bg-[#D91B29] transition-all disabled:opacity-40"
              >
                {saving
                  ? translateCopy("Guardando...")
                  : editingId
                    ? translateCopy("Guardar cambios")
                    : translateCopy("Crear turno")}
              </button>
            </div>
          </div>
        </div>
      )}
  </>);
}

"use client";

import { translateCopy } from "@/config/copy-translations";
import { Dialog } from "@/components/ui/dialog";
import { inputClass, labelClass, getDisplayRoles } from "./employees-utils";
import type { EmployeesModel } from "./employees-model";
export function EmployeesForm({ model }: { model: EmployeesModel }) {
  const { isAdmin, branches, isFormOpen, setIsFormOpen, editingEmployee, saving, form, setForm, formStep, stepError, fieldErrors, setFieldErrors, goToNextStep, goToPrevStep, handleSave } = model;
  return (<>
        {/* MODAL: CREAR / EDITAR */}
        <Dialog
          isOpen={isFormOpen}
          title={
            editingEmployee ? translateCopy("Editar Empleado") : translateCopy("Registrar Nuevo Empleado")
          }
          subtitle={
            editingEmployee
              ? `${translateCopy("Actualizando a")} ${editingEmployee.name}`
              : translateCopy("El sistema enviará un código de activación al correo.")
          }
          onClose={() => setIsFormOpen(false)}
        >
          <div
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (formStep < 3) {
                  goToNextStep();
                }
              }
            }}
            className="space-y-5"
          >
            {/* INDICADOR DE PASOS */}
            <div className="flex items-center justify-center gap-2 pb-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      formStep === step
                        ? "bg-[#111827] text-white"
                        : formStep > step
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {formStep > step ? "✓" : step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-8 h-0.5 ${formStep > step ? "bg-green-500" : "bg-gray-200"}`}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
              {formStep === 1 && translateCopy("Paso 1 de 3 — Datos Personales")}
              {formStep === 2 && translateCopy("Paso 2 de 3 — Asignación Laboral")}
              {formStep === 3 && translateCopy("Paso 3 de 3 — Documentación")}
            </p>

            {stepError && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-xl px-4 py-3">
                {translateCopy(stepError)}
              </div>
            )}

            {/* PASO 1 — DATOS PERSONALES */}
            {formStep === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>{translateCopy("Nombre *")}</label>
                    <input
                      id="employee-name"
                      type="text"
                      value={form.name}
                      maxLength={120}
                      aria-invalid={!!fieldErrors.name}
                      onChange={(e) =>
                        { setForm({ ...form, name: e.target.value }); setFieldErrors((current) => ({ ...current, name: "" })); }
                      }
                      className={inputClass}
                      placeholder={translateCopy("Ej. Juan")}
                    />
                    {fieldErrors.name && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(fieldErrors.name)}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>{translateCopy("Apellido")}</label>
                    <input
                      id="employee-last-name"
                      type="text"
                      value={form.lastName}
                      maxLength={80}
                      aria-invalid={!!fieldErrors.lastName}
                      onChange={(e) =>
                        { setForm({ ...form, lastName: e.target.value }); setFieldErrors((current) => ({ ...current, lastName: "" })); }
                      }
                      className={inputClass}
                      placeholder={translateCopy("Ej. Pérez")}
                    />
                    {fieldErrors.lastName && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(fieldErrors.lastName)}</p>}
                  </div>
                </div>

                {!editingEmployee && (
                  <div>
                    <label className={labelClass}>
                       {translateCopy("Documento de Identidad *")} </label>
                    <input
                      id="employee-document"
                      type="text"
                      value={form.document}
                      maxLength={20}
                      aria-invalid={!!fieldErrors.document}
                      onChange={(e) =>
                        { setForm({ ...form, document: e.target.value }); setFieldErrors((current) => ({ ...current, document: "" })); }
                      }
                      className={inputClass}
                      placeholder={translateCopy("Ej. 123456789")}
                    />
                    {fieldErrors.document && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(fieldErrors.document)}</p>}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>
                       {translateCopy("Correo Electrónico")} {!editingEmployee && "*"}
                    </label>
                    <input
                      id="employee-email"
                      type="email"
                      value={form.email}
                      maxLength={254}
                      autoComplete="email"
                      aria-invalid={!!fieldErrors.email}
                      onChange={(e) =>
                        { setForm({ ...form, email: e.target.value }); setFieldErrors((current) => ({ ...current, email: "" })); }
                      }
                      className={inputClass}
                      placeholder={translateCopy("ejemplo@saborexpress.com")}
                    />
                    {fieldErrors.email && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(fieldErrors.email)}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>{translateCopy("Teléfono")}</label>
                    <input
                      id="employee-phone"
                      type="tel"
                      value={form.phone}
                      maxLength={10}
                      inputMode="numeric"
                      aria-invalid={!!fieldErrors.phone}
                      onChange={(e) =>
                        { setForm({ ...form, phone: e.target.value.replace(/\D/g, "") }); setFieldErrors((current) => ({ ...current, phone: "" })); }
                      }
                      className={inputClass}
                      placeholder={translateCopy("Ej. 3001234567")}
                    />
                    {fieldErrors.phone && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(fieldErrors.phone)}</p>}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>{translateCopy("Dirección")}</label>
                  <input
                    id="employee-address"
                    type="text"
                    value={form.address}
                    maxLength={255}
                      aria-invalid={!!fieldErrors.address}
                    onChange={(e) =>
                        { setForm({ ...form, address: e.target.value }); setFieldErrors((current) => ({ ...current, address: "" })); }
                    }
                    className={inputClass}
                    placeholder={translateCopy("Ej. Calle 123 #45-67")}
                  />
                    {fieldErrors.address && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(fieldErrors.address)}</p>}
                </div>
              </div>
            )}

            {/* PASO 2 — ASIGNACIÓN LABORAL */}
            {formStep === 2 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>{translateCopy("Sede")}</label>
                    <select
                      value={form.branchId}
                      onChange={(e) =>
                        setForm({ ...form, branchId: e.target.value })
                      }
                      disabled={isAdmin}
                      className={`${inputClass} ${isAdmin ? "bg-gray-100 opacity-80 cursor-not-allowed" : ""}`}
                    >
                      {!isAdmin && (
                        <option value="">{translateCopy("Sin sede asignada")}</option>
                      )}
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{translateCopy("Salario Base *")}</label>
                    <input
                      id="employee-base-pay"
                      type="number"
                      value={form.basePay}
                      onChange={(e) =>
                        { setForm({ ...form, basePay: e.target.value }); setFieldErrors((current) => ({ ...current, basePay: "" })); }
                      }
                      min={1}
                      step={1}
                      aria-invalid={!!fieldErrors.basePay}
                      className={inputClass}
                      placeholder={translateCopy("Ej. 1300000")}
                    />
                    {fieldErrors.basePay && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(fieldErrors.basePay)}</p>}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-4 text-xs text-blue-700">
                   {translateCopy("La Sede es la sede base del empleado (la que usa su dispositivo móvil para operar). Los roles operativos (Mesero, Cajero, Cocinero, Repartidor) se asignan por separado desde la pantalla de Turnos, al crear su primer turno.")} </div>
              </div>
            )}

            {/* PASO 3 — DOCUMENTACIÓN */}
            {formStep === 3 && (
              <div className="space-y-5">
                {editingEmployee ? (
                  <div>
                    <label className={labelClass}>{translateCopy("Hoja de Vida (CV)")}</label>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      aria-invalid={!!fieldErrors.cv}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setForm({ ...form, cv: file });
                        const error = file && file.type !== "application/pdf"
                          ? "El CV debe ser un archivo PDF"
                          : file && file.size > 5 * 1024 * 1024
                            ? "El PDF no debe superar 5MB"
                            : "";
                        setFieldErrors((current) => ({ ...current, cv: error }));
                      }}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 bg-white
                     file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0
                     file:text-xs file:font-bold file:bg-[#111827] file:text-white
                     hover:file:bg-gray-800 focus:outline-none transition-all cursor-pointer"
                    />
                    {fieldErrors.cv && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(fieldErrors.cv)}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                       {translateCopy("Súbela si el rol que le asignaste en Turnos la requiere. Puedes subirla o actualizarla en cualquier momento.")} </p>
                    {editingEmployee?.hasCv && (
                      <p className="text-xs text-gray-500 mt-1">
                         {translateCopy("Ya existe un CV cargado. Solo sube uno nuevo si deseas reemplazarlo.")} </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-6 text-center">
                    <p className="text-sm text-gray-400">
                       {translateCopy("La hoja de vida se sube después, editando el empleado, una vez le hayas asignado su primer turno.")} </p>
                  </div>
                )}

                {/* RESUMEN antes de guardar */}
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                     {translateCopy("Resumen")} </p>
                  <p className="text-xs text-gray-600">
                    <strong>{translateCopy("Nombre:")}</strong> {form.name} {form.lastName}
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>{translateCopy("Correo:")}</strong> {form.email || "—"}
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>{translateCopy("Roles de hoy:")}</strong>{" "}
                    {editingEmployee && getDisplayRoles(editingEmployee).length
                      ? getDisplayRoles(editingEmployee).map(translateCopy).join(", ")
                      : translateCopy("Sin turno hoy (se asignan desde Turnos)")}
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>{translateCopy("Sede:")}</strong>{" "}
                    {branches.find((b) => String(b.id) === form.branchId)
                      ?.name ?? translateCopy("Sin sede asignada")}
                  </p>
                </div>
              </div>
            )}

            {/* NAVEGACIÓN */}
            <div className="pt-4 border-t border-gray-100 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  if (formStep === 1) {
                    setIsFormOpen(false);
                  } else {
                    goToPrevStep();
                  }
                }}
                className="px-6 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                {formStep === 1 ? translateCopy("Cancelar") : translateCopy("Atrás")}
              </button>

              {formStep < 3 ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="bg-[#111827] hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors shadow-sm"
                >
                   {translateCopy("Siguiente")} </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#111827] hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving
                    ? translateCopy("Guardando...")
                    : editingEmployee
                      ? translateCopy("Guardar Cambios")
                      : translateCopy("Guardar y Generar Acceso")}
                </button>
              )}
            </div>
          </div>
        </Dialog>
  </>);
}

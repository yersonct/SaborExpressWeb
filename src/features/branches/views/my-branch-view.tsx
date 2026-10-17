"use client";

import { translateCopy } from "@/config/copy-translations";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog } from "@/components/ui/dialog";
import { NotificationModal } from "@/components/ui/modal";
import { useMyBranch } from "../hooks/use-my-branch";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { BranchEmployeesModal } from "../components/branch-employees-modal"
import {
  validateBranchForm,
  hasBranchFormErrors,
  type BranchFormErrors,
} from "../utils/validate-branch";;



type NotifyState = { message: string; type: "success" | "error" } | null;

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#111827] placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#EA1D2C] focus:border-transparent transition-all";

const labelClass =
  "block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2";

export const MyBranchView = () => {
  const { t } = useTranslation();
  const { session } = useAuth();
  const isAdministrador = session?.roles.includes("ADMINISTRADOR");
  const isGerente = session?.roles.includes("GERENTE");

  // Solo el Administrador tiene una sede fija; al Gerente ni siquiera
  // le disparamos el fetch a /Branches/mine (por eso el 409 en consola).
  const { branch, loading, saving, error, updateMyBranch } =
    useMyBranch(isAdministrador);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [notify, setNotify] = useState<NotifyState>(null);
  const [showEmployees, setShowEmployees] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState(true);
    const [formErrors, setFormErrors] = useState<BranchFormErrors>({});

  const openEdit = () => {
    if (!branch) return;
    setName(branch.name);
    setAddress(branch.address ?? "");
    setPhone(branch.phone ?? "");
    setStatus(branch.status);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateBranchForm({ name, address, phone });
    setFormErrors(errors);
    if (hasBranchFormErrors(errors)) return;

    try {
      await updateMyBranch({ name, address, phone, status });
      setNotify({ message: translateCopy("Sede actualizada correctamente"), type: "success" });
      setIsFormOpen(false);
    } catch (err) {
      setNotify({
        message:
          err instanceof Error ? translateCopy(err.message) : translateCopy("No se pudo guardar la sede"),
        type: "error",
      });
    }
  };

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6 pb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
            {t("pageTitles.myBranch")}
          </h1>
          <p className="text-gray-500 mt-1">
             {translateCopy("Información de la sede a la que perteneces.")} </p>
        </div>

        {isGerente ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center sm:p-16">
            <p className="text-gray-400 font-medium">
               {translateCopy("Como Gerente administras todas las sedes de la red. Ve a la sección \"Sedes\" para verlas y gestionarlas todas.")} </p>
          </div>
        ) : loading ? (
          <div className="h-56 rounded-xl bg-gray-100 animate-pulse" />
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-sm text-red-600">
            {translateCopy(error)}
          </div>
        ) : !branch ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center sm:p-16">
            <p className="text-gray-400 font-medium">
               {translateCopy("No tienes una sede asignada todavía.")} </p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl bg-white p-6">
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
                    {branch.address || translateCopy("Sin dirección")}
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
                {translateCopy(branch.status ? "Activa" : "Inactiva")}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3 mb-4">
              <span>{branch.phone || translateCopy("Sin teléfono")}</span>
              <span>
                {branch.employeeCount}{" "}
                {branch.employeeCount === 1 ? translateCopy("empleado") : translateCopy("empleados")}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={openEdit}
                className="flex-1 py-2 rounded-lg text-xs font-semibold text-[#111827] border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                 {translateCopy("Editar")} </button>
              <button
                onClick={() => setShowEmployees(true)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-[#111827] hover:bg-gray-800 transition-colors"
              >
                 {translateCopy("Ver empleados")} </button>
            </div>
          </div>
        )}
      </div>

      <Dialog
        isOpen={isFormOpen}
        title={translateCopy("Editar Sede")}
        subtitle={branch ? `${translateCopy("Actualizando")} "${branch.name}"` : undefined}
        onClose={() => setIsFormOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className={labelClass}>{translateCopy("Nombre")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder={translateCopy("Ej: Sede Norte")}
            />
            {formErrors.name && (
              <p className="text-xs text-red-500 mt-1">{translateCopy(formErrors.name)}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>{translateCopy("Dirección")}</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputClass}
              placeholder={translateCopy("Ej: Calle 10 # 5-20")}
            />
            {formErrors.address && (
              <p className="text-xs text-red-500 mt-1">{translateCopy(formErrors.address)}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>{translateCopy("Teléfono")}</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder={translateCopy("Ej: 3001234567")}
            />
            {formErrors.phone && (
              <p className="text-xs text-red-500 mt-1">{translateCopy(formErrors.phone)}</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <p className="text-sm font-bold text-[#111827]">{translateCopy("Sede activa")}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                 {translateCopy("Determina si la sede opera actualmente.")} </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={status}
                onChange={(e) => setStatus(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
               {translateCopy("Cancelar")} </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all disabled:opacity-50"
            >
              {saving ? translateCopy("Guardando...") : translateCopy("Guardar")}
            </button>
          </div>
        </form>
      </Dialog>

      <NotificationModal
        isOpen={!!notify}
        message={notify?.message ?? ""}
        type={notify?.type ?? "success"}
        onClose={() => setNotify(null)}
      />

      <BranchEmployeesModal
        branch={showEmployees ? branch : null}
        onClose={() => setShowEmployees(false)}
      />
    </>
  );
};

"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Dialog } from "@/components/ui/dialog";
import { NotificationModal } from "@/components/ui/modal";
import { useMyBranch } from "../hooks/use-my-branch";



type NotifyState = { message: string; type: "success" | "error" } | null;

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#111827] placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#EA1D2C] focus:border-transparent transition-all";

const labelClass =
  "block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2";

export const MyBranchView = () => {
  const { branch, loading, saving, error, updateMyBranch } = useMyBranch();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [notify, setNotify] = useState<NotifyState>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState(true);

  const openEdit = () => {
    if (!branch) return;
    setName(branch.name);
    setAddress(branch.address ?? "");
    setPhone(branch.phone ?? "");
    setStatus(branch.status);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMyBranch({ name, address, phone, status });
      setNotify({ message: "Sede actualizada correctamente", type: "success" });
      setIsFormOpen(false);
    } catch (err) {
      setNotify({
        message:
          err instanceof Error ? err.message : "No se pudo guardar la sede",
        type: "error",
      });
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6 pb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
            Mi Sede
          </h1>
          <p className="text-gray-500 mt-1">
            Información de la sede a la que perteneces.
          </p>
        </div>

        {loading ? (
          <div className="h-56 rounded-xl bg-gray-100 animate-pulse" />
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-sm text-red-600">
            {error}
          </div>
        ) : !branch ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <p className="text-gray-400 font-medium">
              No tienes una sede asignada todavía.
            </p>
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

            <button
              onClick={openEdit}
              className="w-full py-2 rounded-lg text-xs font-semibold text-[#111827] border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Editar
            </button>
          </div>
        )}
      </div>

      <Dialog
        isOpen={isFormOpen}
        title="Editar Sede"
        subtitle={branch ? `Actualizando "${branch.name}"` : undefined}
        onClose={() => setIsFormOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className={labelClass}>Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputClass}
              placeholder="Ej: Sede Norte"
            />
          </div>
          <div>
            <label className={labelClass}>Dirección</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputClass}
              placeholder="Ej: Calle 10 # 5-20"
            />
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="Ej: 3001234567"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <p className="text-sm font-bold text-[#111827]">Sede activa</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Determina si la sede opera actualmente.
              </p>
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
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
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
    </MainLayout>
  );
};

"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Dialog } from "@/components/ui/dialog";
import { NotificationModal } from "@/components/ui/modal";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useBranches } from "../hooks/use-branches";
import { BranchCard } from "../components/branch-card";
import { MyBranchView } from "./my-branch-view";
import type { Branch } from "../types/branch.types";
import {
  validateBranchForm,
  hasBranchFormErrors,
  type BranchFormErrors,
} from "../utils/validate-branch";

type NotifyState = { message: string; type: "success" | "error" } | null;

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#111827] placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#EA1D2C] focus:border-transparent transition-all";

const labelClass =
  "block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2";

export const BranchesView = () => {
  const { session, isHydrated } = useAuth();
  const isAdmin =
    session?.roles?.some((r) => r.toUpperCase() === "ADMINISTRADOR") ?? false;

  if (!isHydrated) return null; // evita decidir el rol antes de leer localStorage

  // El Administrador solo ve y edita su propia sede
  if (isAdmin) {
    return <MyBranchView />;
  }

  return <BranchesManagerView />;
};

// Vista completa para el Gerente: lista, crea, edita y elimina sedes
const BranchesManagerView = () => {
  const { branches, loading, error, createBranch, updateBranch, deleteBranch } =
    useBranches();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Branch | null>(null);
  const [saving, setSaving] = useState(false);
  const [notify, setNotify] = useState<NotifyState>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState(true);

  // 👇 el hook va DENTRO del componente, no a nivel de módulo
  const [formErrors, setFormErrors] = useState<BranchFormErrors>({});

  const openCreate = () => {
    setEditingBranch(null);
    setName("");
    setAddress("");
    setPhone("");
    setStatus(true);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setName(branch.name);
    setAddress(branch.address ?? "");
    setPhone(branch.phone ?? "");
    setStatus(branch.status);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 👇 nuevo: valida antes de llamar al backend
    const errors = validateBranchForm({ name, address, phone });
    setFormErrors(errors);
    if (hasBranchFormErrors(errors)) return;

    setSaving(true);
    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, { name, address, phone, status });
        setNotify({
          message: "Sede actualizada correctamente",
          type: "success",
        });
      } else {
        await createBranch({ name, address, phone });
        setNotify({ message: "Sede creada correctamente", type: "success" });
      }
      setIsFormOpen(false);
    } catch (err) {
      setNotify({
        message:
          err instanceof Error ? err.message : "No se pudo guardar la sede",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      await deleteBranch(confirmDelete.id);
      setNotify({ message: "Sede eliminada correctamente", type: "success" });
      setConfirmDelete(null);
    } catch (err) {
      setNotify({
        message:
          err instanceof Error ? err.message : "No se pudo eliminar la sede",
        type: "error",
      });
      setConfirmDelete(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
              Sedes
            </h1>
            <p className="text-gray-500 mt-1">
              Administra las sedes registradas en el sistema.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-3 px-6 rounded-xl text-sm transition-all duration-200 shadow-[0_8px_20px_-6px_rgba(234,29,44,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(234,29,44,0.7)] hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> Nueva Sede
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 rounded-3xl bg-gray-100 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-sm text-red-600">
            {error}
          </div>
        ) : branches.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center animate-[popIn_0.4s_ease-out]">
            <div className="text-5xl mb-4">🏢</div>
            <p className="text-gray-400 font-medium">
              No hay sedes registradas todavía.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch, index) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                index={index}
                onEdit={openEdit}
                onDelete={setConfirmDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Formulario crear/editar */}
      <Dialog
        isOpen={isFormOpen}
        title={editingBranch ? "Editar Sede" : "Nueva Sede"}
        subtitle={
          editingBranch
            ? `Actualizando "${editingBranch.name}"`
            : "Registra una nueva sede en el sistema"
        }
        onClose={() => setIsFormOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className={labelClass}>Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Ej: Sede Norte"
            />
            {formErrors.name && (
              <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
            )}
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
            {formErrors.address && (
              <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>
            )}
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
            {formErrors.phone && (
              <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>
            )}
          </div>

          {editingBranch && (
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
          )}

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
              className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-[0_8px_20px_-6px_rgba(234,29,44,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(234,29,44,0.7)] disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Confirmación de borrado */}
      <Dialog
        isOpen={!!confirmDelete}
        title="Eliminar Sede"
        onClose={() => setConfirmDelete(null)}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-xl flex-shrink-0 animate-pulse">
            ⚠️
          </div>
          <p className="text-sm text-gray-600 pt-1.5">
            ¿Seguro que deseas eliminar la sede{" "}
            <strong className="text-[#111827]">{confirmDelete?.name}</strong>?
            Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setConfirmDelete(null)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
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

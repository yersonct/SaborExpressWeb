"use client";

import { translateCopy } from "@/config/copy-translations";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog } from "@/components/ui/dialog";
import { NotificationModal } from "@/components/ui/modal";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useBranches } from "../hooks/use-branches";
import { BranchCard } from "../components/branch-card";
import { MyBranchView } from "./my-branch-view";
import { BranchEmployeesModal } from "../components/branch-employees-modal";
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
  const { t } = useTranslation();
  const { branches, loading, error, createBranch, updateBranch, deleteBranch } =
    useBranches(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Branch | null>(null);
  const [saving, setSaving] = useState(false);
  const [notify, setNotify] = useState<NotifyState>(null);
  const [viewingEmployeesOf, setViewingEmployeesOf] = useState<Branch | null>(
    null,
  );

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
          message: translateCopy("Sede actualizada correctamente"),
          type: "success",
        });
      } else {
        await createBranch({ name, address, phone });
        setNotify({ message: translateCopy("Sede creada correctamente"), type: "success" });
      }
      setIsFormOpen(false);
    } catch (err) {
      setNotify({
        message:
          err instanceof Error ? translateCopy(err.message) : translateCopy("No se pudo guardar la sede"),
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
      setNotify({ message: translateCopy("Sede eliminada correctamente"), type: "success" });
      setConfirmDelete(null);
    } catch (err) {
      setNotify({
        message:
          err instanceof Error ? translateCopy(err.message) : translateCopy("No se pudo eliminar la sede"),
        type: "error",
      });
      setConfirmDelete(null);
    } finally {
      setSaving(false);
    }
  };
  const filteredBranches = branches.filter((b) => {
    const matchesSearch = `${b.name} ${b.address ?? ""} ${b.phone ?? ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? b.status : !b.status);
    return matchesSearch && matchesStatus;
  });
  const totalPages = Math.max(
    1,
    Math.ceil(filteredBranches.length / ITEMS_PER_PAGE),
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBranches = filteredBranches.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  // Si al eliminar o filtrar la página actual deja de existir, retrocede
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);
  return (
    <>
      <div className="space-y-6 pb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              {t("pageTitles.branches")}
            </h1>
            <p className="text-gray-500 mt-1">
               {translateCopy("Administra las sedes registradas en el sistema.")} </p>
            <p className="text-sm font-semibold text-[#EA1D2C] mt-2">
              {branches.length}{" "}
              {branches.length === 1 ? translateCopy("sede registrada") : translateCopy("sedes registradas")}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="w-full sm:w-auto justify-center bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-3 px-6 rounded-xl text-sm transition-all duration-200 shadow-[0_8px_20px_-6px_rgba(234,29,44,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(234,29,44,0.7)] hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span>  {translateCopy("Nueva Sede")} </button>
        </div>

        {branches.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={translateCopy("Buscar por nombre, dirección o teléfono...")}
              className={`${inputClass} sm:max-w-sm`}
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "all" | "active" | "inactive");
                setCurrentPage(1);
              }}
              className={`${inputClass} sm:w-48`}
            >
              <option value="all">{translateCopy("Todas")}</option>
              <option value="active">{translateCopy("Activas")}</option>
              <option value="inactive">{translateCopy("Inactivas")}</option>
            </select>
          </div>
        )}

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
            {translateCopy(error)}
          </div>
        ) : branches.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center animate-[popIn_0.4s_ease-out] sm:p-16">
            <div className="text-5xl mb-4">🏢</div>
            <p className="text-gray-400 font-medium">
               {translateCopy("No hay sedes registradas todavía.")} </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">{translateCopy("Sede")}</th>
                    <th className="px-5 py-3 font-semibold">{translateCopy("Dirección")}</th>
                    <th className="px-5 py-3 font-semibold">{translateCopy("Teléfono")}</th>
                    <th className="px-5 py-3 font-semibold text-center">
                       {translateCopy("Empleados")} </th>
                    <th className="px-5 py-3 font-semibold text-center">
                       {translateCopy("Estado")} </th>
                    <th className="px-5 py-3 font-semibold text-right">
                       {translateCopy("Acciones")} </th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {paginatedBranches.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-10 text-center text-gray-400"
                      >
                         {translateCopy("Ninguna sede coincide con la búsqueda.")} </td>
                    </tr>
                  )}
                  {paginatedBranches.map((branch) => (
                    <tr
                      key={branch.id}
                      onClick={() => setViewingEmployeesOf(branch)}
                      className="hover:bg-red-50/40 hover:shadow-sm transition-all cursor-pointer group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#111827] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {branch.name.charAt(0)}
                          </div>
                          <span className="font-bold text-[#111827] group-hover:text-[#EA1D2C] transition-colors">
                            {branch.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {branch.address ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {branch.phone ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-center text-gray-600">
                        {branch.employeeCount}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                            branch.status
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}
                        >
                          {translateCopy(branch.status ? "Activa" : "Inactiva")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(branch);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                             {translateCopy("Editar")} </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(branch);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                          >
                             {translateCopy("Eliminar")} </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="break-words text-xs text-gray-500">
                   {translateCopy("Mostrando")} {startIndex + 1}–
                  {Math.min(startIndex + ITEMS_PER_PAGE, filteredBranches.length)}  {translateCopy("de")}{" "}
                  {filteredBranches.length}
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
          </div>
        )}
      </div>

      {/* Formulario crear/editar */}
      <Dialog
        isOpen={isFormOpen}
        title={editingBranch ? translateCopy("Editar Sede") : translateCopy("Nueva Sede")}
        subtitle={
          editingBranch
            ? `${translateCopy("Actualizando")} "${editingBranch.name}"`
            : translateCopy("Registra una nueva sede en el sistema")
        }
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

          {editingBranch && (
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
          )}

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
              className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-[0_8px_20px_-6px_rgba(234,29,44,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(234,29,44,0.7)] disabled:opacity-50"
            >
              {saving ? translateCopy("Guardando...") : translateCopy("Guardar")}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Confirmación de borrado */}
      <Dialog
        isOpen={!!confirmDelete}
        title={translateCopy("Eliminar Sede")}
        onClose={() => setConfirmDelete(null)}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-xl flex-shrink-0 animate-pulse">
            ⚠️
          </div>
          <p className="text-sm text-gray-600 pt-1.5">
             {translateCopy("¿Seguro que deseas eliminar la sede")}{" "}
            <strong className="text-[#111827]">{confirmDelete?.name}</strong>{translateCopy("? Esta acción no se puede deshacer.")} </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setConfirmDelete(null)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
             {translateCopy("Cancelar")} </button>
          <button
            onClick={handleDelete}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? translateCopy("Eliminando...") : translateCopy("Eliminar")}
          </button>
        </div>
      </Dialog>

      <NotificationModal
        isOpen={!!notify}
        message={notify?.message ?? ""}
        type={notify?.type ?? "success"}
        onClose={() => setNotify(null)}
      />

      <BranchEmployeesModal
        branch={viewingEmployeesOf}
        onClose={() => setViewingEmployeesOf(null)}
      />
    </>
  );
};

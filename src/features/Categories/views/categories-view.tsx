"use client";

import { useRememberedUiState } from "@/lib/use-remembered-ui-state";
import { localizeCatalogText, translateCopy } from "@/config/copy-translations";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog } from "@/components/ui/dialog";
import { NotificationModal } from "@/components/ui/modal";
import { useCategories } from "../hooks/use-categories";
import type { Category } from "../types/category.types";
import {
  validateCategoryForm,
  hasCategoryFormErrors,
  type CategoryFormErrors,
} from "../utils/validate-category";

type NotifyState = { message: string; type: "success" | "error" } | null;

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#111827] placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#EA1D2C] focus:border-transparent transition-all";

const labelClass =
  "block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2";

const ITEMS_PER_PAGE = 6;
const EMPTY_TRANSLATIONS = {
  nameEn: "",
  namePt: "",
  nameFr: "",
  descriptionEn: "",
  descriptionPt: "",
  descriptionFr: "",
};
export const CategoriesView = () => {
  useTranslation();
  const {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();
  const displayCategoryName = (category: Category) =>
    localizeCatalogText(category.name, {
      en: category.nameEn,
      pt: category.namePt,
      fr: category.nameFr,
    });
  const displayCategoryDescription = (category: Category) =>
    localizeCatalogText(category.description, {
      en: category.descriptionEn,
      pt: category.descriptionPt,
      fr: category.descriptionFr,
    });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [notify, setNotify] = useState<NotifyState>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [translations, setTranslations] = useState(EMPTY_TRANSLATIONS);
  const [status, setStatus] = useState(true);
  const [formErrors, setFormErrors] = useState<CategoryFormErrors>({});
  const [currentPage, setCurrentPage] = useRememberedUiState<number>("categories", "page", 1);

  const openCreate = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setTranslations(EMPTY_TRANSLATIONS);
    setStatus(true);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description);
    setTranslations({
      nameEn: category.nameEn ?? "",
      namePt: category.namePt ?? "",
      nameFr: category.nameFr ?? "",
      descriptionEn: category.descriptionEn ?? "",
      descriptionPt: category.descriptionPt ?? "",
      descriptionFr: category.descriptionFr ?? "",
    });
    setStatus(category.status);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateCategoryForm({
      name,
      description,
      existingCategories: categories,
      editingId: editingCategory?.id,
    });
    setFormErrors(errors);
    if (hasCategoryFormErrors(errors)) return;

    setSaving(true);
    const localizedFields = {
      nameEn: translations.nameEn.trim(),
      namePt: translations.namePt.trim(),
      nameFr: translations.nameFr.trim(),
      descriptionEn: translations.descriptionEn.trim(),
      descriptionPt: translations.descriptionPt.trim(),
      descriptionFr: translations.descriptionFr.trim(),
    };
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name,
          description,
          status,
          ...localizedFields,
        });
        setNotify({
          message: translateCopy("Categoría actualizada correctamente"),
          type: "success",
        });
      } else {
        await createCategory({
          name,
          description,
          ...localizedFields,
        });
        setNotify({
          message: translateCopy("Categoría creada correctamente"),
          type: "success",
        });
      }
      setIsFormOpen(false);
    } catch (err) {
      setNotify({
        message:
          err instanceof Error
            ? translateCopy(err.message)
            : translateCopy("No se pudo guardar la categoría"),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

const totalPages = Math.max(1, Math.ceil(categories.length / ITEMS_PER_PAGE));
useEffect(() => {
  if (!loading && currentPage > totalPages) setCurrentPage(totalPages);
}, [loading, currentPage, totalPages, setCurrentPage]);
const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
const paginatedCategories = categories.slice(
  startIndex,
  startIndex + ITEMS_PER_PAGE,
);

const handleDelete = async () => {
  if (!confirmDelete) return;
  setSaving(true);
  try {
    await deleteCategory(confirmDelete.id);
    setNotify({
      message: translateCopy("Categoría eliminada correctamente"),
      type: "success",
    });
    setConfirmDelete(null);
  } catch (err) {
    setNotify({
      message:
        err instanceof Error ? translateCopy(err.message) : translateCopy("No se pudo eliminar la categoría"),
      type: "error",
    });
    setConfirmDelete(null);
  } finally {
    setSaving(false);
  }
};

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#111827] tracking-tight">
             {translateCopy("Categorías del Menú")} </h2>
          <p className="text-sm text-gray-500 mt-1">
             {translateCopy("Organiza los productos en categorías (ej. Bebidas, Entradas).")} </p>
          <p className="text-sm font-semibold text-[#EA1D2C] mt-2">
            {categories.length}{" "}
            {categories.length === 1
              ? translateCopy("categoría registrada")
              : translateCopy("categorías registradas")}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#EA1D2C] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:scale-[1.02] hover:bg-red-700 sm:w-auto"
        >
          <span className="text-lg leading-none">+</span>  {translateCopy("Nueva Categoría")} </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
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
        ) : categories.length === 0 ? (
          <div className="p-6 text-center sm:p-16">
            <div className="text-5xl mb-4">🏷️</div>
            <p className="text-gray-400 font-medium">
               {translateCopy("No hay categorías registradas todavía.")} </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">{translateCopy("Nombre")}</th>
                    <th className="px-5 py-3 font-semibold">{translateCopy("Descripción")}</th>
                    <th className="px-5 py-3 font-semibold text-center">
                       {translateCopy("Estado")} </th>
                    <th className="px-5 py-3 font-semibold text-right">
                       {translateCopy("Acciones")} </th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {paginatedCategories.map((category) => (
                    <tr
                      key={category.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#111827] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {displayCategoryName(category).charAt(0)}
                          </div>
                          <span className="font-bold text-[#111827]">
                            {displayCategoryName(category)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {displayCategoryDescription(category) || "—"}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                            category.status
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}
                        >
                          {translateCopy(category.status ? "Activa" : "Inactiva")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(category)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                             {translateCopy("Editar")} </button>
                          <button
                            onClick={() => setConfirmDelete(category)}
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
                <p className="text-xs text-gray-500">
                   {translateCopy("Mostrando")} {startIndex + 1}–
                  {Math.min(startIndex + ITEMS_PER_PAGE, categories.length)}  {translateCopy("de")}{" "}
                  {categories.length}
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

      {/* Formulario crear/editar */}
      <Dialog
        isOpen={isFormOpen}
        title={editingCategory ? translateCopy("Editar Categoría") : translateCopy("Nueva Categoría")}
        subtitle={
          editingCategory
            ? `${translateCopy("Actualizando")} "${editingCategory.name}"`
            : translateCopy("Registra una nueva categoría")
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
              placeholder={translateCopy("Ej: Bebidas")}
            />
            {formErrors.name && (
              <p className="text-xs text-red-500 mt-1">{translateCopy(formErrors.name)}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>{translateCopy("Descripción")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder={translateCopy("Ej: Jugos, gaseosas y bebidas frías")}
            />
            {formErrors.description && (
              <p className="text-xs text-red-500 mt-1">
                {translateCopy(formErrors.description)}
              </p>
            )}
          </div>
          {editingCategory && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-[#111827]">
                    {translateCopy("Categoría activa")}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      status
                        ? "bg-green-100 text-green-800"
                        : "bg-slate-600 text-white"
                    }`}
                  >
                    {translateCopy(status ? "Activa" : "Inactiva")}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                   {translateCopy("Determina si aparece disponible en el menú.")} </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={status}
                  onChange={(e) => setStatus(e.target.checked)}
                  role="switch"
                  aria-checked={status}
                  aria-label={translateCopy("Categoría activa")}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                    status ? "bg-emerald-500" : "bg-slate-500"
                  } peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#EA1D2C]`}
                >
                  <span
                    className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      status ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </span>
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
              className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50"
            >
              {translateCopy(saving ? "Guardando..." : "Guardar")}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Confirmación de borrado */}
      <Dialog
        isOpen={!!confirmDelete}
        title={translateCopy("Eliminar Categoría")}
        onClose={() => setConfirmDelete(null)}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-xl flex-shrink-0">
            ⚠️
          </div>
          <p className="text-sm text-gray-600 pt-1.5">
             {translateCopy("¿Seguro que deseas eliminar la categoría")}{" "}
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
    </div>
  );
};

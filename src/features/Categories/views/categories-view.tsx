"use client";

import { useState } from "react";
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

export const CategoriesView = () => {
  const {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [notify, setNotify] = useState<NotifyState>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);
  const [formErrors, setFormErrors] = useState<CategoryFormErrors>({});
  const [currentPage, setCurrentPage] = useState(1);

  const openCreate = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setStatus(true);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description);
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
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name, description, status });
        setNotify({
          message: "Categoría actualizada correctamente",
          type: "success",
        });
      } else {
        await createCategory({ name, description });
        setNotify({
          message: "Categoría creada correctamente",
          type: "success",
        });
      }
      setIsFormOpen(false);
    } catch (err) {
      setNotify({
        message:
          err instanceof Error
            ? err.message
            : "No se pudo guardar la categoría",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE);
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
      message: "Categoría eliminada correctamente",
      type: "success",
    });
    setConfirmDelete(null);
  } catch (err) {
    setNotify({
      message:
        err instanceof Error ? err.message : "No se pudo eliminar la categoría",
      type: "error",
    });
    setConfirmDelete(null);
  } finally {
    setSaving(false);
  }
};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#111827] tracking-tight">
            Categorías del Menú
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Organiza los productos en categorías (ej. Bebidas, Entradas).
          </p>
          <p className="text-sm font-semibold text-[#EA1D2C] mt-2">
            {categories.length}{" "}
            {categories.length === 1
              ? "categoría registrada"
              : "categorías registradas"}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-[#EA1D2C] hover:bg-red-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm shadow-sm transition-all flex items-center gap-2 hover:scale-[1.02]"
        >
          <span className="text-lg leading-none">+</span> Nueva Categoría
        </button>
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
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : categories.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-5xl mb-4">🏷️</div>
            <p className="text-gray-400 font-medium">
              No hay categorías registradas todavía.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">Nombre</th>
                    <th className="px-5 py-3 font-semibold">Descripción</th>
                    <th className="px-5 py-3 font-semibold text-center">
                      Estado
                    </th>
                    <th className="px-5 py-3 font-semibold text-right">
                      Acciones
                    </th>
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
                            {category.name.charAt(0)}
                          </div>
                          <span className="font-bold text-[#111827]">
                            {category.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {category.description || "—"}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                            category.status
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}
                        >
                          {category.status ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(category)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setConfirmDelete(category)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Mostrando {startIndex + 1}–
                  {Math.min(startIndex + ITEMS_PER_PAGE, categories.length)} de{" "}
                  {categories.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1.5 text-xs font-bold text-gray-500">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Formulario crear/editar */}
      <Dialog
        isOpen={isFormOpen}
        title={editingCategory ? "Editar Categoría" : "Nueva Categoría"}
        subtitle={
          editingCategory
            ? `Actualizando "${editingCategory.name}"`
            : "Registra una nueva categoría"
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
              placeholder="Ej: Bebidas"
            />
            {formErrors.name && (
              <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Ej: Jugos, gaseosas y bebidas frías"
            />
            {formErrors.description && (
              <p className="text-xs text-red-500 mt-1">
                {formErrors.description}
              </p>
            )}
          </div>{" "}
          {editingCategory && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div>
                <p className="text-sm font-bold text-[#111827]">
                  Categoría activa
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Determina si aparece disponible en el menú.
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
              className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Confirmación de borrado */}
      <Dialog
        isOpen={!!confirmDelete}
        title="Eliminar Categoría"
        onClose={() => setConfirmDelete(null)}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-xl flex-shrink-0">
            ⚠️
          </div>
          <p className="text-sm text-gray-600 pt-1.5">
            ¿Seguro que deseas eliminar la categoría{" "}
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
    </div>
  );
};

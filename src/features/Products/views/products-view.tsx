"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { SERVER_BASE_URL } from "@/config/api";
import { NotificationModal } from "@/components/ui/modal";
import { useProducts } from "../hooks/use-products";
import { useCategories } from "../../Categories/hooks/use-categories";
import { useBranches } from "../../branches/hooks/use-branches";
import { useMyBranch } from "../../branches/hooks/use-my-branch";
import { useAuth } from "../../auth/hooks/use-auth";
import {
  validateProductForm,
  hasProductFormErrors,
  type ProductFormErrors,
} from "../utils/validate-product";
import type { Product } from "../types/product.types";

type NotifyState = { message: string; type: "success" | "error" } | null;

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#EA1D2C] focus:border-transparent transition-all";

const labelClass =
  "block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2";

const INITIAL_FORM = {
  categoryId: "",
  branchId: "", // "" = producto global (todas las sedes)
  name: "",
  description: "",
  price: "",
  preparationTimeInMinutes: "",
  status: true,
  photo: null as File | null,
};

export const ProductsView = () => {
  const {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleStatus,
  } = useProducts();
  const { categories } = useCategories();
  const { session } = useAuth();
  const isAdministrador = session?.roles.includes("ADMINISTRADOR");
  const isGerente = session?.roles.includes("GERENTE");

  // Gerente: lista completa de sedes para elegir en el formulario (o dejarlo global).
  // Solo se llama a /Branches si es Gerente — ese endpoint da 403 para Administrador.
  const { branches } = useBranches(isGerente);
  // Administrador: su sede fija, sin poder elegir otra
  const { branch: myBranch } = useMyBranch(isAdministrador);

  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [notify, setNotify] = useState<NotifyState>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});
  const [formStep, setFormStep] = useState(1);
  const [stepError, setStepError] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");

  // Solo categorías activas (se usa en el formulario: selector, resumen, y mensaje de aviso)
  const activeCategories = categories.filter((c) => c.status);
  const activeCategoryIds = new Set(activeCategories.map((c) => c.id));

  // Solo mostramos en el listado productos cuya categoría sigue activa
  const visibleByCategory = products.filter((p) =>
    activeCategoryIds.has(p.categoryId),
  );

  // Gerente: ve todo, sin filtrar por sede.
  // Administrador: solo ve los productos de su propia sede + los globales
  // (BranchId null), nunca los que pertenecen a otra sede distinta a la suya.
  const visibleProducts =
    isAdministrador && myBranch
      ? visibleByCategory.filter(
          (p) => p.branchId === null || p.branchId === myBranch.id,
        )
      : visibleByCategory;

  // Y luego aplicamos el filtro de categoría seleccionada sobre visibleProducts, no sobre products
  const filteredProducts = filterCategoryId
    ? visibleProducts.filter((p) => String(p.categoryId) === filterCategoryId)
    : visibleProducts;

  const openCreate = () => {
    setEditingProduct(null);
    setForm({
      ...INITIAL_FORM,
      branchId: isAdministrador && myBranch ? String(myBranch.id) : "",
    });
    setFormErrors({});
    setFormStep(1);
    setStepError("");
    setIsOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      categoryId: String(product.categoryId),
      branchId: isAdministrador && myBranch
        ? String(myBranch.id)
        : product.branchId
          ? String(product.branchId)
          : "",
      name: product.name,
      description: product.description,
      price: String(product.price),
      preparationTimeInMinutes: String(product.preparationTimeInMinutes),
      status: product.status,
      photo: null,
    });
    setFormErrors({});
    setFormStep(1);
    setStepError("");
    setIsOpen(true);
  };

  const validateStep1 = (): string | null => {
    // Reutiliza la misma validación completa (incluye el chequeo de nombre
    // duplicado contra existingProducts) en vez de una versión simplificada
    // que no lo revisaba y dejaba avanzar igual.
    const errors = validateProductForm({
      name: form.name,
      description: form.description,
      price: "1", // aún no se valida en este paso, pasamos algo válido para no interferir
      categoryId: form.categoryId,
      preparationTimeInMinutes: "1", // idem, se valida en el paso 2
      existingProducts: products,
      editingId: editingProduct?.id,
    });

    if (errors.name) return errors.name;
    if (errors.categoryId) return errors.categoryId;
    // El Gerente debe elegir sí o sí una sede (no existe más el producto "global"
    // creado desde cero). El Administrador no pasa por esta validación porque
    // su sede ya viene fija automáticamente, nunca queda vacía.
    if (isGerente && !form.branchId) return "Selecciona una sede";
    if (errors.description) return errors.description;
    return null;
  };

  const validateStep2 = (): string | null => {
    const price = Number(form.price);
    if (!form.price || isNaN(price) || price <= 0)
      return "Ingresa un precio válido mayor a $0";
    const prepTime = Number(form.preparationTimeInMinutes);
    if (!form.preparationTimeInMinutes || isNaN(prepTime) || prepTime <= 0)
      return "Ingresa un tiempo de preparación válido (mayor a 0 minutos)";
    return null;
  };

  const goToNextStep = () => {
    const error = formStep === 1 ? validateStep1() : validateStep2();
    if (error) {
      setStepError(error);
      return;
    }
    setStepError("");
    setFormStep((s) => s + 1);
  };

  const goToPrevStep = () => {
    setStepError("");
    setFormStep((s) => s - 1);
  };

  const handleSave = async () => {
    const errors = validateProductForm({
      name: form.name,
      description: form.description,
      price: form.price,
      categoryId: form.categoryId,
      preparationTimeInMinutes: form.preparationTimeInMinutes,
      existingProducts: products,
      editingId: editingProduct?.id,
    });
    setFormErrors(errors);
    if (hasProductFormErrors(errors)) {
      // si algo falla en la validación final, regresamos al paso correspondiente
      if (errors.name || errors.categoryId || errors.description) {
        setFormStep(1);
      } else {
        setFormStep(2);
      }
      return;
    }

    setSaving(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          categoryId: Number(form.categoryId),
          branchId: form.branchId ? Number(form.branchId) : undefined,
          name: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          preparationTimeInMinutes: Number(form.preparationTimeInMinutes),
          status: form.status,
          photo: form.photo ?? undefined,
        });
        setNotify({
          message: "Producto actualizado correctamente",
          type: "success",
        });
      } else {
        await createProduct({
          categoryId: Number(form.categoryId),
          branchId: form.branchId ? Number(form.branchId) : undefined,
          name: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          preparationTimeInMinutes: Number(form.preparationTimeInMinutes),
          photo: form.photo ?? undefined,
        });
        setNotify({
          message: "Producto creado correctamente",
          type: "success",
        });
      }
      setIsOpen(false);
    } catch (err) {
      setNotify({
        message:
          err instanceof Error ? err.message : "No se pudo guardar el producto",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (product: Product) => {
    setSaving(true);
    try {
      await toggleStatus(product.id, product.status);
    } catch (err) {
      setNotify({
        message:
          err instanceof Error ? err.message : "No se pudo cambiar el estado",
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
      await deleteProduct(confirmDelete.id);
      setNotify({
        message: "Producto eliminado correctamente",
        type: "success",
      });
      setConfirmDelete(null);
    } catch (err) {
      setNotify({
        message:
          err instanceof Error
            ? err.message
            : "No se pudo eliminar el producto",
        type: "error",
      });
      setConfirmDelete(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="bg-[#EA1D2C] hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl shadow-sm transition-all flex items-center gap-2 hover:scale-[1.02]"
        >
          <span className="text-xl">+</span> Crear Producto
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 w-screen h-screen bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 font-bold text-lg p-2"
            >
              ✕
            </button>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-[#111827]">
                {editingProduct ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {editingProduct
                  ? `Actualizando "${editingProduct.name}"`
                  : "Completa los campos para añadir un artículo al menú digital."}
              </p>
            </div>

            <div
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (formStep < 3) goToNextStep();
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
                {formStep === 1 && "Paso 1 de 3 — Información Básica"}
                {formStep === 2 && "Paso 2 de 3 — Precio y Preparación"}
                {formStep === 3 && "Paso 3 de 3 — Imagen"}
              </p>

              {stepError && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-xl px-4 py-3">
                  {stepError}
                </div>
              )}

              {/* PASO 1 — INFORMACIÓN BÁSICA */}
              {formStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>Nombre del Producto</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Ej. Empanada de Carne Crujiente"
                      className={inputClass}
                    />
                    {formErrors.name && (
                      <p className="text-xs text-red-500 mt-1">
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Categoría</label>
                    <select
                      value={form.categoryId}
                      onChange={(e) =>
                        setForm({ ...form, categoryId: e.target.value })
                      }
                      className={inputClass}
                    >
                      <option value="">Selecciona una categoría...</option>
                      {activeCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.categoryId && (
                      <p className="text-xs text-red-500 mt-1">
                        {formErrors.categoryId}
                      </p>
                    )}
                    {activeCategories.length === 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        No hay categorías activas. Crea una primero en la
                        pestaña "Categorías".
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Sede</label>
                    {isGerente ? (
                      <>
                        <select
                          value={form.branchId}
                          onChange={(e) =>
                            setForm({ ...form, branchId: e.target.value })
                          }
                          className={inputClass}
                        >
                          <option value="">Selecciona una sede...</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Todo producto debe pertenecer a una sede específica.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-500">
                          🏬 {myBranch?.name ?? "Cargando tu sede..."}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Como Administrador, este producto se asigna
                          automáticamente a tu sede.
                        </p>
                      </>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>
                      Descripción / Ingredientes
                    </label>
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      placeholder="Describe el producto (ej. carne desmechada, papa tierna, masa de maíz crujiente acompañadas de ají)."
                      className={`${inputClass} resize-none`}
                    ></textarea>
                    {formErrors.description && (
                      <p className="text-xs text-red-500 mt-1">
                        {formErrors.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* PASO 2 — PRECIO Y PREPARACIÓN */}
              {formStep === 2 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Precio de Venta ($)</label>
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) =>
                          setForm({ ...form, price: e.target.value })
                        }
                        placeholder="Ej. 4000"
                        min={0}
                        className={inputClass}
                      />
                      {formErrors.price && (
                        <p className="text-xs text-red-500 mt-1">
                          {formErrors.price}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>
                        Tiempo Preparación (min)
                      </label>
                      <input
                        type="number"
                        value={form.preparationTimeInMinutes}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            preparationTimeInMinutes: e.target.value,
                          })
                        }
                        placeholder="Ej. 15"
                        min={0}
                        className={inputClass}
                      />
                      {formErrors.preparationTimeInMinutes && (
                        <p className="text-xs text-red-500 mt-1">
                          {formErrors.preparationTimeInMinutes}
                        </p>
                      )}
                    </div>
                  </div>

                  {editingProduct && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-sm font-bold text-[#111827]">
                          Producto activo
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Determina si aparece disponible en el menú.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.status}
                          onChange={(e) =>
                            setForm({ ...form, status: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* PASO 3 — IMAGEN */}
              {formStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>Imagen Ilustrativa</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-[#EA1D2C] transition-colors cursor-pointer group bg-gray-50/50">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          if (file) {
                            const validExtensions = [
                              ".jpg",
                              ".jpeg",
                              ".png",
                              ".webp",
                            ];
                            const isValid = validExtensions.some((ext) =>
                              file.name.toLowerCase().endsWith(ext),
                            );
                            if (!isValid) {
                              setStepError("La foto debe ser JPG, PNG o WEBP");
                              e.target.value = "";
                              return;
                            }
                          }
                          setStepError("");
                          setForm({ ...form, photo: file });
                        }}
                        className="hidden"
                        id="product-image"
                      />
                      <label htmlFor="product-image" className="cursor-pointer">
                        <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                          📸
                        </div>
                        <p className="text-xs font-semibold text-gray-600">
                          {form.photo
                            ? form.photo.name
                            : "Seleccionar archivo de imagen"}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Formatos recomendados: PNG, JPG (Max. 5MB)
                        </p>
                      </label>
                    </div>
                    {editingProduct?.photo && !form.photo && (
                      <p className="text-xs text-gray-500 mt-1">
                        Ya existe una imagen cargada. Solo sube una nueva si
                        deseas reemplazarla.
                      </p>
                    )}
                  </div>

                  {/* Vista previa */}
                  {(form.photo || editingProduct?.photo) && (
                    <div>
                      <label className={labelClass}>Vista Previa</label>
                      <div className="w-full h-48 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
                        <img
                          src={
                            form.photo
                              ? URL.createObjectURL(form.photo)
                              : `${SERVER_BASE_URL}${editingProduct?.photo}`
                          }
                          alt="Vista previa"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Resumen antes de guardar */}
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Resumen
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>Nombre:</strong> {form.name || "—"}
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>Categoría:</strong>{" "}
                      {activeCategories.find(
                        (c) => String(c.id) === form.categoryId,
                      )?.name ?? "—"}
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>Sede:</strong>{" "}
                      {isGerente
                        ? form.branchId
                          ? branches.find((b) => String(b.id) === form.branchId)?.name ?? "—"
                          : "Todas las sedes (global)"
                        : myBranch?.name ?? "—"}
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>Precio:</strong> $
                      {Number(form.price || 0).toLocaleString("es-CO")}
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>Preparación:</strong>{" "}
                      {form.preparationTimeInMinutes || "0"} min
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
                      setIsOpen(false);
                    } else {
                      goToPrevStep();
                    }
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-sm transition-colors"
                >
                  {formStep === 1 ? "Cancelar" : "Atrás"}
                </button>

                {formStep < 3 ? (
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="flex-1 bg-[#EA1D2C] hover:bg-red-700 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-sm"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-[#EA1D2C] hover:bg-red-700 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {saving
                      ? "Guardando..."
                      : editingProduct
                        ? "Guardar Cambios"
                        : "Guardar Producto"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-[#111827] tracking-tight">
            Menú Actual
          </h2>
          <select
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
            className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EA1D2C]"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-gray-100 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-sm text-red-600">
            {error}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="text-5xl mb-4">🍽️</div>
            <p className="text-gray-400 font-medium">
              {filterCategoryId
                ? "No hay productos en esta categoría."
                : "No hay productos registrados todavía."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`bg-white rounded-2xl border ${
                  product.status
                    ? "border-gray-100"
                    : "border-red-100 bg-gray-50/50"
                } overflow-hidden shadow-sm hover:shadow-md transition-all group relative`}
              >
                <div
                  className={`h-40 ${
                    product.status ? "bg-gray-50" : "bg-gray-100 opacity-70"
                  } relative flex items-center justify-center text-gray-400 group-hover:scale-[1.01] transition-transform duration-300 p-3`}
                >
                  {product.photo ? (
                    <img
                      src={`${SERVER_BASE_URL}${product.photo}`}
                      alt={product.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-4xl">🍽️</span>
                  )}

                  {!product.status && (
                    <div className="absolute top-3 right-3 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-md border border-red-200">
                      Oculto al usuario
                    </div>
                  )}

                  <button
                    onClick={() => setConfirmDelete(product)}
                    className="absolute top-3 left-3 bg-white/90 text-gray-400 hover:text-red-600 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-gray-200 transition-all z-10"
                    title="Eliminar producto"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4
                        className={`font-bold text-base ${
                          product.status ? "text-gray-900" : "text-gray-500"
                        }`}
                      >
                        {product.name}
                      </h4>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        {product.categoryName}
                        {product.branchName ? ` · ${product.branchName}` : ""}
                      </span>
                    </div>
                    <span className="font-black text-[#111827]">
                      ${product.price.toLocaleString("es-CO")}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2 h-8">
                    {product.description}
                  </p>

                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">⏱️</span>
                      <p className="text-xs font-bold text-gray-500">
                        {product.preparationTimeInMinutes} min
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="text-[10px] font-bold text-gray-500 hover:text-[#EA1D2C] uppercase mr-2"
                      >
                        Editar
                      </button>
                      <span className="text-[10px] font-bold text-gray-500 uppercase">
                        {product.status ? "Activo" : "Inactivo"}
                      </span>
                      <button
                        onClick={() => handleToggle(product)}
                        disabled={saving}
                        className={`w-11 h-6 rounded-full flex items-center transition-colors px-1 disabled:opacity-50 ${
                          product.status ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                            product.status ? "translate-x-5" : "translate-x-0"
                          }`}
                        ></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        isOpen={!!confirmDelete}
        title="Eliminar Producto"
        onClose={() => setConfirmDelete(null)}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-xl flex-shrink-0">
            ⚠️
          </div>
          <p className="text-sm text-gray-600 pt-1.5">
            ¿Seguro que deseas eliminar el producto{" "}
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

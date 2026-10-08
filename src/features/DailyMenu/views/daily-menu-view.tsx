"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { NotificationModal } from "@/components/ui/modal";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useBranches } from "@/features/branches/hooks/use-branches";
import { useMyBranch } from "@/features/branches/hooks/use-my-branch";
import { useProducts } from "@/features/Products/hooks/use-products";
import { useDailyMenu } from "../hooks/use-daily-menu";
import { MEAL_PERIODS, type MealPeriod } from "../types/daily-menu.types";

type NotifyState = { message: string; type: "success" | "error" } | null;

function todayIso() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export const DailyMenuView = () => {
  const { session } = useAuth();
  const isGerente = session?.roles.includes("GERENTE");
  const isAdministrador = session?.roles.includes("ADMINISTRADOR");

  // Gerente elige la sede; Administrador siempre trabaja sobre la suya.
  const { branches } = useBranches(isGerente);
  const { branch: myBranch } = useMyBranch(isAdministrador);

  const [selectedBranchId, setSelectedBranchId] = useState<number | "">("");
  const branchId = isAdministrador
    ? myBranch?.id
    : selectedBranchId || undefined;

  const [date, setDate] = useState(todayIso());
  const [period, setPeriod] = useState<MealPeriod>("Almuerzo");

  const { items, loading, error, bulkSetItems, toggleItem, deleteItem } =
    useDailyMenu(branchId, date, period);

  // Productos disponibles para armar el menú: los de la sede + los globales.
  const { products } = useProducts(branchId);
  const activeProducts = products.filter((p) => p.status);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [notify, setNotify] = useState<NotifyState>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const openForm = () => {
    setSelectedProductIds(items.map((i) => i.productId));
    setIsFormOpen(true);
  };

  const toggleProductSelection = (productId: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const handleSaveMenu = async () => {
    if (!branchId) return;
    setSaving(true);
    try {
      await bulkSetItems({
        branchId,
        date,
        mealPeriod: period,
        productIds: selectedProductIds,
      });
      setNotify({
        message: "Menú del día actualizado correctamente",
        type: "success",
      });
      setIsFormOpen(false);
    } catch (err) {
      setNotify({
        message:
          err instanceof Error ? err.message : "No se pudo guardar el menú",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: number) => {
    setSaving(true);
    try {
      await toggleItem(id);
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
    if (confirmDelete === null) return;
    setSaving(true);
    try {
      await deleteItem(confirmDelete);
      setNotify({ message: "Producto quitado del menú", type: "success" });
      setConfirmDelete(null);
    } catch (err) {
      setNotify({
        message:
          err instanceof Error ? err.message : "No se pudo quitar el producto",
        type: "error",
      });
      setConfirmDelete(null);
    } finally {
      setSaving(false);
    }
  };

  const noBranchSelected = isGerente && !branchId;

  return (
    <>
      <div className="space-y-6 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
              Menú del Día
            </h1>
            <p className="text-gray-500 mt-1">
              Define qué productos están disponibles por sede, fecha y franja
              horaria.
            </p>
          </div>
          <button
            onClick={openForm}
            disabled={!branchId}
            className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-3 px-6 rounded-xl text-sm transition-all duration-200 shadow-[0_8px_20px_-6px_rgba(234,29,44,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(234,29,44,0.7)] hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <span className="text-lg leading-none">+</span> Editar Menú
          </button>
        </div>

        {/* Filtros: sede (solo Gerente), fecha, franja */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-wrap items-end gap-4">
          {isGerente && (
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Sede
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) =>
                  setSelectedBranchId(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#EA1D2C]"
              >
                <option value="">Selecciona una sede...</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#EA1D2C]"
            />
          </div>

          <div className="flex gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
            {MEAL_PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  period === p
                    ? "bg-[#111827] text-white"
                    : "text-gray-500 hover:bg-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {noBranchSelected ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="text-5xl mb-4">🏬</div>
            <p className="text-gray-400 font-medium">
              Selecciona una sede para ver y editar su menú del día.
            </p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-gray-100 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-sm text-red-600">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="text-5xl mb-4">🍽️</div>
            <p className="text-gray-400 font-medium">
              No hay productos asignados al menú de {period.toLowerCase()} para
              esta fecha.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className={`border rounded-xl bg-white p-5 transition-colors ${
                  item.isAvailable
                    ? "border-gray-200 hover:border-gray-300"
                    : "border-red-100 bg-gray-50/50"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#111827] leading-tight">
                      {item.productName}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.categoryName}
                    </p>
                  </div>
                  <span className="font-black text-[#111827] text-sm">
                    ${item.productPrice.toLocaleString("es-CO")}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      {item.isAvailable ? "Disponible" : "Agotado"}
                    </span>
                    <button
                      onClick={() => handleToggle(item.id)}
                      disabled={saving}
                      className={`w-11 h-6 rounded-full flex items-center transition-colors px-1 disabled:opacity-50 ${
                        item.isAvailable ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                          item.isAvailable ? "translate-x-5" : "translate-x-0"
                        }`}
                      ></div>
                    </button>
                  </div>
                  <button
                    onClick={() => setConfirmDelete(item.id)}
                    className="text-[10px] font-bold text-[#EA1D2C] hover:underline uppercase"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulario: elegir productos del menú (reemplaza el día completo) */}
      <Dialog
        isOpen={isFormOpen}
        title="Editar Menú del Día"
        subtitle={`${period} · ${date}`}
        onClose={() => setIsFormOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-400">
            Marca los productos que estarán disponibles en esta franja. Esto
            reemplaza por completo el menú actual de {period.toLowerCase()} para
            esta fecha.
          </p>

          {activeProducts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No hay productos activos para esta sede todavía.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {activeProducts.map((product) => (
                <label
                  key={product.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                      className="w-4 h-4 accent-[#EA1D2C]"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#111827]">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {product.categoryName}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-500">
                    ${product.price.toLocaleString("es-CO")}
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveMenu}
              disabled={saving}
              className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-[0_8px_20px_-6px_rgba(234,29,44,0.5)] disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar Menú"}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Confirmación de quitar producto */}
      <Dialog
        isOpen={confirmDelete !== null}
        title="Quitar Producto del Menú"
        onClose={() => setConfirmDelete(null)}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-xl flex-shrink-0">
            ⚠️
          </div>
          <p className="text-sm text-gray-600 pt-1.5">
            ¿Seguro que deseas quitar este producto del menú de{" "}
            {period.toLowerCase()}? Podrás volver a agregarlo desde "Editar
            Menú".
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
            {saving ? "Quitando..." : "Quitar"}
          </button>
        </div>
      </Dialog>

      <NotificationModal
        isOpen={!!notify}
        message={notify?.message ?? ""}
        type={notify?.type ?? "success"}
        onClose={() => setNotify(null)}
      />
    </>
  );
};

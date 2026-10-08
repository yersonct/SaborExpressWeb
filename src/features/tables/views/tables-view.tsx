"use client";

import { useState, useMemo } from "react";
import { Dialog } from "@/components/ui/dialog";
import { NotificationModal } from "@/components/ui/modal";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useBranches } from "@/features/branches/hooks/use-branches";
import { useMyBranch } from "@/features/branches/hooks/use-my-branch";
import { useTables } from "../hooks/use-tables";
import { TableStatus, type Table } from "../types/table.types";
import { useOrders } from "@/features/Order/hooks/use-orders";
import { useOrderDetail } from "@/features/Order/hooks/use-order-details";
import { useOrderStatusHistory } from "@/features/Order/hooks/use-order-status-history";
import { OrderStatus, type Order } from "@/features/Order/types/order.types";

type NotifyState = { message: string; type: "success" | "error" } | null;

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#111827] placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#EA1D2C] focus:border-transparent transition-all";

const labelClass =
  "block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2";

const STATUS_LABELS: Record<TableStatus, string> = {
  [TableStatus.Available]: "Disponible",
  [TableStatus.Occupied]: "Ocupada",
};

const FALLBACK_THEME = {
  accent: "bg-gray-300",
  badge: "bg-gray-100 text-gray-500 border-gray-200",
  dot: "bg-gray-400",
};

const STATUS_THEME: Record<
  TableStatus,
  { accent: string; badge: string; dot: string }
> = {
  [TableStatus.Available]: {
    accent: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  [TableStatus.Occupied]: {
    accent: "bg-[#EA1D2C]",
    badge: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-[#EA1D2C]",
  },
};

export const TablesView = () => {
  const { session, isHydrated } = useAuth();
  const isGerente = session?.roles?.includes("GERENTE") ?? false;
  const isAdmin = session?.roles?.includes("ADMINISTRADOR") ?? false;
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
const { order: selectedOrder, loading: loadingOrderDetail } = useOrderDetail(selectedOrderId);
const { history: statusHistory, loading: loadingHistory } = useOrderStatusHistory(selectedOrderId);
  const { branches: allBranches } = useBranches(isHydrated && isGerente);
  const { branch: myBranch } = useMyBranch(isHydrated && isAdmin);
  const branches = useMemo(
    () => (isGerente ? allBranches : myBranch ? [myBranch] : []),
    [isGerente, allBranches, myBranch],
  );
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-CO", {
      day: "2-digit",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    [OrderStatus.Pending]: "Pendiente",
    [OrderStatus.Confirmed]: "Confirmado",
    [OrderStatus.InPreparation]: "Preparando",
    [OrderStatus.Ready]: "Listo",
    [OrderStatus.Delivered]: "Entregado",
    [OrderStatus.Cancelled]: "Cancelado",
  };

  const [branchId, setBranchId] = useState<number | null>(null);
const {
  tables,
  loading,
  error,
  createTable,
  updateTable,
  updateStatus,
  deleteTable,
} = useTables(branchId, branches);

// Cruce con Orders: qué mesa tiene un pedido activo ahora mismo y su total.
// Reusamos el mismo filtro de sede que ya usa la tabla de mesas.
const { orders } = useOrders({ branchId: branchId ?? undefined });

const activeOrderByTableId = useMemo(() => {
  const map = new Map<number, (typeof orders)[number]>();
  orders
    .filter(
      (o) =>
        o.tableId !== null &&
        o.status !== OrderStatus.Delivered &&
        o.status !== OrderStatus.Cancelled,
    )
    .forEach((o) => {
      // Si por algún motivo hay más de un pedido activo en la misma mesa,
      // nos quedamos con el más reciente (orders ya viene ordenado desc por id).
      if (!map.has(o.tableId!)) map.set(o.tableId!, o);
    });
  return map;
}, [orders]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Table | null>(null);
  const [number, setNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [notify, setNotify] = useState<NotifyState>(null);
  const [statusFilter, setStatusFilter] = useState<TableStatus | "all">("all");

  const openCreate = () => {
    setEditingTable(null);
    setNumber("");
    setIsFormOpen(true);
  };

  const openEdit = (table: Table) => {
    setEditingTable(table);
    setNumber(String(table.number));
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(number);
    if (!number || isNaN(num) || num <= 0) {
      setNotify({ message: "Ingresa un número de mesa válido", type: "error" });
      return;
    }
    if (!editingTable && !branchId) {
      setNotify({ message: "Selecciona una sede primero", type: "error" });
      return;
    }

    setSaving(true);
    try {
      if (editingTable) {
        await updateTable(editingTable.id, { number: num });
        setNotify({
          message: "Mesa actualizada correctamente",
          type: "success",
        });
      } else {
        await createTable({ branchId: branchId!, number: num });
        setNotify({ message: "Mesa creada correctamente", type: "success" });
      }
      setIsFormOpen(false);
    } catch (err) {
      setNotify({
        message:
          err instanceof Error ? err.message : "No se pudo guardar la mesa",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (table: Table, status: TableStatus) => {
    setSaving(true);
    try {
      await updateStatus(table.id, { status });
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
      await deleteTable(confirmDelete.id);
      setNotify({ message: "Mesa eliminada correctamente", type: "success" });
      setConfirmDelete(null);
    } catch (err) {
      setNotify({
        message:
          err instanceof Error ? err.message : "No se pudo eliminar la mesa",
        type: "error",
      });
      setConfirmDelete(null);
    } finally {
      setSaving(false);
    }
  };

  // Conteo por estado para el resumen superior
  const summary = Object.values(TableStatus).map((status) => ({
    status,
    count: tables.filter((t) => t.status === status).length,
  }));

  const visibleTables =
    statusFilter === "all"
      ? tables
      : tables.filter((t) => t.status === statusFilter);

  // Si cambias de sede y el filtro activo ya no aplica, no lo dejamos "colgado"
  const handleBranchChange = (value: string) => {
    setBranchId(value ? Number(value) : null);
    setStatusFilter("all");
  };

  return (
    <>
      <div className="space-y-6 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
              Mesas
            </h1>
            <p className="text-gray-500 mt-1">
              Administra las mesas registradas por sede.
            </p>
          </div>
          <button
            onClick={openCreate}
            disabled={!branchId}
            className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> Nueva Mesa
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <label className={labelClass}>Sede</label>
          <select
            value={branchId ?? ""}
            onChange={(e) => handleBranchChange(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled className="text-gray-900 bg-white">
              Selecciona una sede
            </option>
            {branches.map((b) => (
              <option
                key={b.id}
                value={b.id}
                className="text-gray-900 bg-white"
              >
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* RESUMEN / FILTRO — panorama rápido del piso, y clic para filtrar */}
        {tables.length > 0 && (
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setStatusFilter("all")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all border ${
                statusFilter === "all"
                  ? "bg-[#111827] text-white border-[#111827] shadow-sm"
                  : "bg-white text-gray-500 border-gray-100 hover:border-gray-200 shadow-sm"
              }`}
            >
              Todas
              <span
                className={
                  statusFilter === "all" ? "text-gray-100" : "text-gray-400 "
                }
              >
                {tables.length}
              </span>
            </button>

            {summary.map(({ status, count }) => {
              const isActive = statusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-bold border transition-all shadow-sm ${
                    isActive
                      ? "bg-[#111827] text-white border-[#111827]"
                      : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${STATUS_THEME[status].dot}`}
                  />
                  {STATUS_LABELS[status]}
                  <span
                    className={isActive ? "text-gray-100" : "text-gray-400"}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {!branchId ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="text-5xl mb-4">🏬</div>
            <p className="text-gray-400 font-medium">
              Selecciona una sede para ver sus mesas.
            </p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-36 rounded-2xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-sm text-red-600">
            {error}
          </div>
        ) : tables.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="text-5xl mb-4">🪑</div>
            <p className="text-gray-400 font-medium">
              {branchId
                ? "No hay mesas registradas en esta sede."
                : "No hay mesas registradas en ninguna sede."}
            </p>
          </div>
        ) : visibleTables.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-400 font-medium">
              No hay mesas con este estado.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
            {visibleTables.map((table) => {
              const theme = STATUS_THEME[table.status] ?? FALLBACK_THEME;
              const activeOrder = activeOrderByTableId.get(table.id);
              return (
                <div
                  key={table.id}
                  className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  {/* Barra de acento: identifica el estado sin leer el texto */}
                  <div className={`h-1.5 ${theme.accent}`} />

                  <div className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-2xl font-black text-[#111827]">
                          Mesa {table.number}
                        </span>
                        {!branchId && table.branchName && (
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">
                            {table.branchName}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setConfirmDelete(table)}
                        className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Eliminar mesa"
                      >
                        ✕
                      </button>
                    </div>

                    {activeOrder && (
                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(activeOrder.id)}
                        className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 hover:bg-orange-100 transition-colors text-left"
                      >
                        <span className="text-[11px] font-bold text-orange-700">
                          Pedido #{activeOrder.id} activo
                        </span>
                        <span className="text-xs font-black text-orange-700">
                          ${(activeOrder.total ?? 0).toLocaleString("es-CO")}
                        </span>
                      </button>
                    )}

                    <div className="relative">
                      <select
                        value={table.status}
                        onChange={(e) =>
                          handleStatusChange(
                            table,
                            e.target.value as TableStatus,
                          )
                        }
                        disabled={saving}
                        className={`w-full appearance-none text-xs font-bold pl-3 pr-8 py-2 rounded-lg border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${theme.badge}`}
                      >
                        {Object.values(TableStatus).map((s) => (
                          <option
                            key={s}
                            value={s}
                            className="text-gray-900 bg-white"
                          >
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      <svg
                        width="14"
                        height="14"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60"
                        style={{ width: 14, height: 14 }}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>

                    <button
                      onClick={() => openEdit(table)}
                      className="text-xs font-bold text-gray-400 hover:text-[#EA1D2C] text-left transition-colors"
                    >
                      Editar número
                    </button>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        isOpen={isFormOpen}
        title={editingTable ? "Editar Mesa" : "Nueva Mesa"}
        onClose={() => setIsFormOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className={labelClass}>Número de Mesa</label>
            <input
              type="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className={inputClass}
              placeholder="Ej: 5"
              min={1}
            />
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
              className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog
        isOpen={!!confirmDelete}
        title="Eliminar Mesa"
        onClose={() => setConfirmDelete(null)}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-xl flex-shrink-0">
            ⚠️
          </div>
          <p className="text-sm text-gray-600 pt-1.5">
            ¿Seguro que deseas eliminar la mesa{" "}
            <strong className="text-[#111827]">
              Mesa: {confirmDelete?.number}
            </strong>
            ? Se borrará por completo del sistema y esta acción no se puede
            deshacer.
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

      <Dialog
        isOpen={!!selectedOrderId}
        title={selectedOrder ? `Pedido #${selectedOrder.id}` : "Pedido"}
        subtitle={selectedOrder ? "En Mesa" : undefined}
        onClose={() => setSelectedOrderId(null)}
      >
        {loadingOrderDetail ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 rounded-xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : selectedOrder ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">
                  Cliente
                </p>
                <p className="font-semibold text-gray-800">
                  {selectedOrder.customerName ?? "Sin cliente"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">
                  Sede
                </p>
                <p className="font-semibold text-gray-800">
                  {selectedOrder.branchName ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">
                  Mesa
                </p>
                <p className="font-semibold text-gray-800">
                  {selectedOrder.tableNumber
                    ? `#${selectedOrder.tableNumber}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">
                  Empleado
                </p>
                <p className="font-semibold text-gray-800">
                  {selectedOrder.employeeName ?? "Sin asignar"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                Productos
              </p>
              <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                {selectedOrder.orderDetails.length === 0 ? (
                  <p className="p-4 text-sm text-gray-400 text-center">
                    Sin productos agregados aún.
                  </p>
                ) : (
                  selectedOrder.orderDetails.map((detail) => (
                    <div
                      key={detail.id}
                      className="flex justify-between items-center p-3"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          {detail.quantity}x {detail.productName}
                        </p>
                        {detail.notes && (
                          <p className="text-xs text-gray-500">
                            {detail.notes}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-bold text-gray-800">
                        $
                        {(
                          detail.subTotal ?? detail.unitPrice * detail.quantity
                        ).toLocaleString("es-CO")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                Historial de Estados
              </p>
              {loadingHistory ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-10 rounded-lg bg-gray-100 animate-pulse"
                    />
                  ))}
                </div>
              ) : statusHistory.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">
                  Sin historial disponible.
                </p>
              ) : (
                <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                  {statusHistory.map((h, i) => (
                    <div key={h.id} className="flex items-start gap-3 p-3">
                      <div className="flex flex-col items-center pt-0.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            i === statusHistory.length - 1
                              ? "bg-[#EA1D2C]"
                              : "bg-gray-300"
                          }`}
                        />
                        {i < statusHistory.length - 1 && (
                          <span className="w-px flex-1 bg-gray-200 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-bold text-gray-800">
                            {ORDER_STATUS_LABELS[h.status]}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDateTime(h.changedAt)}
                          </span>
                        </div>
                        {h.changedByEmployeeName && (
                          <p className="text-xs text-gray-500">
                            {h.changedByEmployeeName}
                          </p>
                        )}
                        {h.notes && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {h.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>
                  ${(selectedOrder.subTotal ?? 0).toLocaleString("es-CO")}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Impuesto</span>
                <span>${(selectedOrder.tax ?? 0).toLocaleString("es-CO")}</span>
              </div>
              <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>
                  ${(selectedOrder.total ?? 0).toLocaleString("es-CO")}
                </span>
              </div>
            </div>

            {selectedOrder.notes && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                  Notas
                </p>
                <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
              </div>
            )}
          </div>
        ) : null}
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

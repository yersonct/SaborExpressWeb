"use client";

import { useRememberedUiState } from "@/lib/use-remembered-ui-state";
import { translateCopy, getCurrentLocale } from "@/config/copy-translations";
import { formatMoney } from "@/lib/format-money";
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog } from "@/components/ui/dialog";
import { NotificationModal } from "@/components/ui/modal";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useBranches } from "@/features/branches/hooks/use-branches";
import { useMyBranch } from "@/features/branches/hooks/use-my-branch";
import { useTables } from "../hooks/use-tables";
import { TableStatus, type Table, type TableReleaseReview } from "../types/table.types";
import { tableService } from "../services/table.service";
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
  badge: "tbl-status-fallback",
  dot: "bg-gray-400",
};

const STATUS_THEME: Record<
  TableStatus,
  { accent: string; badge: string; dot: string }
> = {
  [TableStatus.Available]: {
    accent: "bg-emerald-500",
    badge: "tbl-status-available",
    dot: "bg-emerald-500",
  },
  [TableStatus.Occupied]: {
    accent: "bg-[#EA1D2C]",
    badge: "tbl-status-occupied",
    dot: "bg-[#EA1D2C]",
  },
};

export const TablesView = () => {
  const { t } = useTranslation();
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
    return new Date(dateString).toLocaleString(getCurrentLocale(), {
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

  const [branchId, setBranchId, branchReady] = useRememberedUiState<number | null>("tables", "branch", null);

  // Al cargar las sedes, se elige la primera automáticamente
  useEffect(() => {
    if (branchReady && branches.length > 0 &&
      (branchId === null || !branches.some((branch) => branch.id === branchId))) {
      setBranchId(branches[0].id);
    }
  }, [branches, branchId, branchReady]);
const {
  tables,
  loading,
  error,
  createTable,
  updateTable,
  updateStatus,
  deleteTable,
  refetch: refetchTables,
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
        o.status !== OrderStatus.Cancelled &&
        tables.some((tb) => tb.id === o.tableId &&
          tb.status === TableStatus.Occupied &&
          (tb.currentSessionId
            ? o.tableSessionId === tb.currentSessionId
            : o.tableSessionId == null)),
    )
    .forEach((o) => {
      // Si por algún motivo hay más de un pedido activo en la misma mesa,
      // nos quedamos con el más reciente (orders ya viene ordenado desc por id).
      if (!map.has(o.tableId!)) map.set(o.tableId!, o);
    });
  return map;
}, [orders, tables]);

  // La lista de ocupaciones anteriores se obtiene del servidor; ninguna fecha
  // se infiere desde table.createdAt, que representa creación de la mesa.
  const [previousReviews, setPreviousReviews] = useState<TableReleaseReview[]>([]);
  const [releaseReview, setReleaseReview] = useState<TableReleaseReview | null>(null);
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [releaseSaving, setReleaseSaving] = useState(false);
  const [releaseReason, setReleaseReason] = useState("");
  const [releaseError, setReleaseError] = useState("");

  useEffect(() => {
    let current = true;
    if (!branchId || !(isGerente || isAdmin)) {
      setPreviousReviews([]);
      return;
    }
    void tableService.getPreviousReleaseReviews(branchId)
      .then((reviews) => { if (current) setPreviousReviews(reviews); })
      .catch(() => { if (current) setPreviousReviews([]); });
    return () => { current = false; };
  }, [branchId, isAdmin, isGerente, tables]);

  const openReleaseReview = async (table: Table) => {
    setReleaseLoading(true);
    setReleaseError("");
    setReleaseReason("");
    try {
      const review = await tableService.getReleaseReview(table.id);
      setReleaseReview(review);
    } catch (err) {
      setNotify({ message: err instanceof Error ? err.message : "No se pudo comprobar la mesa", type: "error" });
    } finally {
      setReleaseLoading(false);
    }
  };

  const confirmPreviousRelease = async () => {
    if (!releaseReview || releaseSaving) return;
    const administrative = !releaseReview.canReleaseNormally;
    if (!releaseReview.isOccupied || (!releaseReview.isPreviousDay && !releaseReview.isOrphan)) return;
    if (administrative && releaseReason.trim().length < 12) {
      setReleaseError("Explica el motivo del cierre administrativo (mínimo 12 caracteres).");
      return;
    }
    setReleaseSaving(true);
    setReleaseError("");
    try {
      await tableService.releasePrevious(releaseReview.tableId, {
        expectedSessionId: releaseReview.currentSessionId,
        administrative,
        reason: administrative ? releaseReason.trim() : undefined,
      });
      setReleaseReview(null);
      setNotify({ message: "Mesa liberada. Los pedidos y sus pagos permanecen en el historial.", type: "success" });
      await refetchTables();
    } catch (err) {
      setReleaseError(err instanceof Error ? err.message : "No se pudo liberar la mesa.");
    } finally {
      setReleaseSaving(false);
    }
  };

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Table | null>(null);
  const [number, setNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [notify, setNotify] = useState<NotifyState>(null);
  const [statusFilter, setStatusFilter] = useRememberedUiState<TableStatus | "all">("tables", "status", "all");

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
      setNotify({ message: translateCopy("Ingresa un número de mesa válido"), type: "error" });
      return;
    }
    if (!editingTable && !branchId) {
      setNotify({ message: translateCopy("Selecciona una sede primero"), type: "error" });
      return;
    }

    setSaving(true);
    try {
      if (editingTable) {
        await updateTable(editingTable.id, { number: num });
        setNotify({
          message: translateCopy("Mesa actualizada correctamente"),
          type: "success",
        });
      } else {
        await createTable({ branchId: branchId!, number: num });
        setNotify({ message: translateCopy("Mesa creada correctamente"), type: "success" });
      }
      setIsFormOpen(false);
    } catch (err) {
      setNotify({
        message:
          err instanceof Error ? translateCopy(err.message) : translateCopy("No se pudo guardar la mesa"),
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
          err instanceof Error ? translateCopy(err.message) : translateCopy("No se pudo cambiar el estado"),
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
      setNotify({ message: translateCopy("Mesa eliminada correctamente"), type: "success" });
      setConfirmDelete(null);
    } catch (err) {
      setNotify({
        message:
          err instanceof Error ? translateCopy(err.message) : translateCopy("No se pudo eliminar la mesa"),
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

  // Los botones de estado solo funcionan con una sede escogida
  const handleStatusFilter = (value: TableStatus | "all") => {
    if (!branchId) {
      setNotify({
        message: translateCopy("Escoge una sede primero para filtrar las mesas."),
        type: "error",
      });
      return;
    }
    setStatusFilter(value);
  };

  return (
    <>
      <Dialog
        isOpen={!!releaseReview}
        title={releaseReview ? `Revisar mesa ${releaseReview.tableNumber}` : "Revisar mesa"}
        onClose={() => { if (!releaseSaving) setReleaseReview(null); }}
      >
        {releaseReview && (
          <div className="space-y-4 text-sm text-gray-800">
            {!releaseReview.isPreviousDay && !releaseReview.isOrphan ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                Es una sesión activa de hoy. No se permite liberarla por esta herramienta.
              </p>
            ) : (
              <>
                <p>{releaseReview.isOrphan
                  ? "No se encontraron pedidos vinculados a esta ocupación. Comprueba físicamente que nadie utiliza la mesa antes del cierre administrativo."
                  : `Se encontraron ${releaseReview.orders.length} pedidos asociados a la sesión previa.`}
                  {" "}Los pedidos y pagos existentes se conservarán.</p>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 p-3 space-y-2">
                  {releaseReview.orders.map((order) => (
                    <p key={order.orderId}>
                      Pedido #{order.orderId} — {order.isPaid ? "Pagado" : "Pago pendiente"} · {order.isDelivered ? "Entregado" : "Entrega pendiente"}
                    </p>
                  ))}
                </div>
                {releaseReview.outstandingAmount > 0 && (
                  <p className="rounded-xl bg-amber-50 p-3 font-semibold text-amber-900">
                    Saldo pendiente: {formatMoney(releaseReview.outstandingAmount)}. Liberar la mesa no lo cobra ni lo cancela.
                  </p>
                )}
                {!releaseReview.canReleaseNormally && (
                  <div>
                    <label className={labelClass} htmlFor="table-release-reason">Motivo obligatorio del cierre administrativo</label>
                    <textarea
                      id="table-release-reason"
                      rows={3}
                      maxLength={500}
                      className={inputClass}
                      value={releaseReason}
                      onChange={(e) => setReleaseReason(e.target.value)}
                      placeholder="Explica por qué debe liberarse esta mesa pese a los pedidos pendientes"
                    />
                  </div>
                )}
              </>
            )}
            {releaseError && <p role="alert" className="text-red-700">{releaseError}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setReleaseReview(null)} disabled={releaseSaving}
                className="rounded-lg border border-gray-200 px-4 py-2">Cancelar</button>
              {(releaseReview.isPreviousDay || releaseReview.isOrphan) && (
                <button type="button" onClick={() => void confirmPreviousRelease()} disabled={releaseSaving}
                  className="rounded-lg bg-[#EA1D2C] px-4 py-2 font-bold text-white disabled:opacity-50">
                  {releaseSaving ? "Guardando..." : releaseReview.canReleaseNormally ? "Liberar mesa anterior" : "Confirmar cierre administrativo"}
                </button>
              )}
            </div>
          </div>
        )}
      </Dialog>
      <div className="space-y-6 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold app-page-title tracking-tight">
              {t("pageTitles.tables")}
            </h1>
            <p className="text-gray-500 mt-1">
               {translateCopy("Administra las mesas registradas por sede.")} </p>
          </div>
          <button
            onClick={openCreate}
            disabled={!branchId}
            className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span>  {translateCopy("Nueva Mesa")} </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <label className={labelClass}>{translateCopy("Sede")}</label>
          <select
            value={branchId ?? ""}
            onChange={(e) => handleBranchChange(e.target.value)}
            className={inputClass}
          >
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
              onClick={() => handleStatusFilter("all")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all border ${
                statusFilter === "all"
                  ? "tbl-filter-active"
                  : "tbl-filter"
              }`}
            >
               {translateCopy("Todas")} <span
                className={
                  "tbl-filter-count"
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
                  onClick={() => handleStatusFilter(status)}
                  className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-bold border transition-all shadow-sm ${
                    isActive
                      ? "tbl-filter-active"
                      : "tbl-filter"
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${STATUS_THEME[status].dot}`}
                  />
                  {translateCopy(STATUS_LABELS[status])}
                  <span
                    className="tbl-filter-count"
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {!branchId ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center sm:p-16">
            <div className="text-5xl mb-4">🏬</div>
            <p className="text-gray-400 font-medium">
               {translateCopy("Selecciona una sede para ver sus mesas.")} </p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-36 rounded-2xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-sm text-red-600">
            {translateCopy(error)}
          </div>
        ) : tables.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center sm:p-16">
            <div className="text-5xl mb-4">🪑</div>
            <p className="text-gray-400 font-medium">
              {branchId
                ? translateCopy("No hay mesas registradas en esta sede.")
                : translateCopy("No hay mesas registradas en ninguna sede.")}
            </p>
          </div>
        ) : visibleTables.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center sm:p-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-400 font-medium">
               {translateCopy("No hay mesas con este estado.")} </p>
          </div>
        ) : (
          <div className="grid max-h-[65vh] grid-cols-1 gap-4 overflow-y-auto p-1 pr-3 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 [scrollbar-width:thin]">
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
                        <span className="text-2xl font-black tbl-card-title">
                           {translateCopy("Mesa")} {table.number}
                        </span>
                        {!branchId && table.branchName && (
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">
                            {table.branchName}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setConfirmDelete(table)}
                        className="tbl-delete-btn transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                        title={translateCopy("Eliminar mesa")}
                      >
                        ✕
                      </button>
                    </div>

                    {activeOrder && (
                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(activeOrder.id)}
                        className="tbl-order-badge flex items-center justify-between border rounded-lg px-3 py-2 transition-colors text-left"
                      >
                        <span className="text-[11px] font-bold">
                          {translateCopy("Pedido activo")}
                        </span>
                        <span className="text-xs font-black">
                          {formatMoney(activeOrder.total ?? 0)}
                        </span>
                      </button>
                    )}

                    {(isAdmin || isGerente) && table.status === TableStatus.Occupied && (
                      <button
                        type="button"
                        disabled={releaseLoading || releaseSaving}
                        onClick={() => void openReleaseReview(table)}
                        className="w-full rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-100 disabled:opacity-50"
                      >
                        {previousReviews.some((review) => review.tableId === table.id)
                          ? "Revisar cierre de jornada anterior"
                          : "Comprobar ocupación"}
                      </button>
                    )}

                    {/* Solo lectura: el estado lo mueven los empleados con sus pedidos */}
                    <div
                      className={`w-full text-center text-xs font-bold px-3 py-2 rounded-lg border ${theme.badge}`}
                    >
                      {translateCopy(STATUS_LABELS[table.status] ?? table.status)}
                    </div>

                    <button
                      onClick={() => openEdit(table)}
                      className="tbl-edit-link text-xs font-bold text-left"
                    >
                       {translateCopy("Editar número")} </button>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        isOpen={isFormOpen}
        title={editingTable ? translateCopy("Editar Mesa") : translateCopy("Nueva Mesa")}
        onClose={() => setIsFormOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className={labelClass}>{translateCopy("Número de Mesa")}</label>
            <input
              type="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className={inputClass}
              placeholder={translateCopy("Ej: 5")}
              min={1}
            />
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
              className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50"
            >
              {saving ? translateCopy("Guardando...") : translateCopy("Guardar")}
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog
        isOpen={!!confirmDelete}
        title={translateCopy("Eliminar Mesa")}
        onClose={() => setConfirmDelete(null)}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-xl flex-shrink-0">
            ⚠️
          </div>
          <p className="text-sm text-gray-600 pt-1.5">
             {translateCopy("¿Seguro que deseas eliminar la mesa")}{" "}
            <strong className="text-[#111827]">
               {translateCopy("Mesa:")} {confirmDelete?.number}
            </strong>
             {translateCopy("? Se borrará por completo del sistema y esta acción no se puede deshacer.")} </p>
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

      <Dialog
        isOpen={!!selectedOrderId}
        title={translateCopy("Pedido")}
        subtitle={selectedOrder ? translateCopy("En Mesa") : undefined}
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
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">
                   {translateCopy("Cliente")} </p>
                <p className="font-semibold text-gray-800">
                  {selectedOrder.customerName ?? translateCopy("Sin cliente")}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">
                   {translateCopy("Sede")} </p>
                <p className="font-semibold text-gray-800">
                  {selectedOrder.branchName ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">
                   {translateCopy("Mesa")} </p>
                <p className="font-semibold text-gray-800">
                  {selectedOrder.tableNumber
                    ? `#${selectedOrder.tableNumber}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">
                   {translateCopy("Empleado")} </p>
                <p className="font-semibold text-gray-800">
                  {selectedOrder.employeeName ?? translateCopy("Sin asignar")}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                 {translateCopy("Productos")} </p>
              <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                {selectedOrder.orderDetails.length === 0 ? (
                  <p className="p-4 text-sm text-gray-400 text-center">
                     {translateCopy("Sin productos agregados aún.")} </p>
                ) : (
                  selectedOrder.orderDetails.map((detail) => (
                    <div
                      key={detail.id}
                      className="flex justify-between items-center p-3"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          {detail.quantity}{translateCopy("x")} {detail.productName}
                        </p>
                        {detail.notes && (
                          <p className="text-xs text-gray-500">
                            {detail.notes}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-bold text-gray-800">
                        {formatMoney(
                          detail.subTotal ?? detail.unitPrice * detail.quantity,
                        )}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                 {translateCopy("Historial de Estados")} </p>
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
                   {translateCopy("Sin historial disponible.")} </p>
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
                            {translateCopy(ORDER_STATUS_LABELS[h.status])}
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
                <span>{translateCopy("Subtotal")}</span>
                <span>
                  {formatMoney(selectedOrder.subTotal ?? 0)}
                </span>
              </div>
              {(selectedOrder.tax ?? 0) > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    {selectedOrder.taxIncludedInPrice
                      ? t("orderBreakdown.taxOnProducts")
                      : translateCopy("Impuesto registrado")}
                    {selectedOrder.taxRate > 0 ? ` (${selectedOrder.taxRate}%)` : ""}
                  </span>
                  <span>{formatMoney(selectedOrder.tax ?? 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-200">
                <span>{translateCopy("Total")}</span>
                <span>
                  {formatMoney(selectedOrder.total ?? 0)}
                </span>
              </div>
            </div>

            {selectedOrder.notes && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                   {translateCopy("Notas")} </p>
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

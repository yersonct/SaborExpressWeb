"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Clock3,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  XCircle,
  LucideIcon,
} from "lucide-react";
import { useOrders } from "../hooks/use-orders";
import { useOrderDetail } from "../hooks/use-order-details";
import { useOrderStatusHistory } from "../hooks/use-order-status-history";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useBranches } from "@/features/branches/hooks/use-branches";
import { Dialog } from "@/components/ui/dialog";
import { NotificationModal } from "@/components/ui/modal";
import { OrderStatus, OrderType, type Order } from "../types/order.types";

type NotifyState = { message: string; type: "success" | "error" } | null;

interface ColumnConfig {
  title: string;
  status: OrderStatus;
  icon: LucideIcon;
  color: string;
}

const BOARD_COLUMNS: ColumnConfig[] = [
  {
    title: "Nuevos",
    status: OrderStatus.Pending,
    icon: Clock3,
    color: "from-sky-500 to-blue-600",
  },
  {
    title: "Confirmados",
    status: OrderStatus.Confirmed,
    icon: CheckCircle2,
    color: "from-indigo-500 to-blue-500",
  },
  {
    title: "Cocina",
    status: OrderStatus.InPreparation,
    icon: ChefHat,
    color: "from-orange-500 to-amber-500",
  },
  {
    title: "Listos",
    status: OrderStatus.Ready,
    icon: PackageCheck,
    color: "from-emerald-500 to-green-600",
  },
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: "bg-sky-100 text-sky-700 border-sky-200",
  [OrderStatus.Confirmed]: "bg-indigo-100 text-indigo-700 border-indigo-200",
  [OrderStatus.InPreparation]:
    "bg-orange-100 text-orange-700 border-orange-200",
  [OrderStatus.Ready]: "bg-emerald-100 text-emerald-700 border-emerald-200",
  [OrderStatus.Delivered]: "bg-zinc-100 text-zinc-700 border-zinc-200",
  [OrderStatus.Cancelled]: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: "Pendiente",
  [OrderStatus.Confirmed]: "Confirmado",
  [OrderStatus.InPreparation]: "Preparando",
  [OrderStatus.Ready]: "Listo",
  [OrderStatus.Delivered]: "Entregado",
  [OrderStatus.Cancelled]: "Cancelado",
};

const TYPE_LABELS: Record<OrderType, string> = {
  [OrderType.DineIn]: "En Mesa",
  [OrderType.ToGo]: "Para Llevar",
  [OrderType.Delivery]: "Domicilio",
  [OrderType.Pickup]: "Recoger",
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
};

const timeAgo = (dateString: string) => {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Justo ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  return `Hace ${diffH} h`;
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Próximo estado válido en el flujo normal (para el botón de avanzar)
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.Pending]: OrderStatus.Confirmed,
  [OrderStatus.Confirmed]: OrderStatus.InPreparation,
  [OrderStatus.InPreparation]: OrderStatus.Ready,
  [OrderStatus.Ready]: OrderStatus.Delivered,
};

export const OrdersView = () => {
  const { session, isHydrated } = useAuth();
  const isGerente = session?.roles?.includes("GERENTE") ?? false;
  const { branches } = useBranches(isHydrated && isGerente);

  const [branchFilter, setBranchFilter] = useState<string>("");
  const [showCancelled, setShowCancelled] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [notify, setNotify] = useState<NotifyState>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const orderIdParam = searchParams.get("orderId");
    if (orderIdParam) {
      setSelectedOrderId(Number(orderIdParam));
    }
  }, [searchParams]);

  const { orders, loading, error, updateStatus, cancelOrder, refetch } =
    useOrders(
      isGerente && branchFilter
        ? { branchId: Number(branchFilter) }
        : undefined,
    );

const { order: selectedOrder, loading: loadingDetail } =
  useOrderDetail(selectedOrderId);
const { history: statusHistory, loading: loadingHistory } =
  useOrderStatusHistory(selectedOrderId);

  const activeOrders = orders.filter((o) => o.status !== OrderStatus.Cancelled);
  const cancelledOrders = orders.filter(
    (o) => o.status === OrderStatus.Cancelled,
  );

  const ordersByStatus = useMemo(() => {
    return activeOrders.reduce(
      (acc, order) => {
        if (!acc[order.status]) acc[order.status] = [];
        acc[order.status].push(order);
        return acc;
      },
      {} as Record<OrderStatus, Order[]>,
    );
  }, [activeOrders]);

  const handleAdvanceStatus = async (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setSaving(true);
    try {
      await updateStatus(order.id, { status: next });
      setNotify({
        message: `Pedido movido a "${STATUS_LABELS[next]}"`,
        type: "success",
      });
    } catch (err) {
      setNotify({
        message:
          err instanceof Error
            ? err.message
            : "No se pudo actualizar el estado",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!confirmCancel || !cancelReason.trim()) {
      setNotify({
        message: "Debes indicar un motivo de cancelación",
        type: "error",
      });
      return;
    }
    setSaving(true);
    try {
      await cancelOrder(confirmCancel.id, { reason: cancelReason.trim() });
      setNotify({ message: "Pedido cancelado correctamente", type: "success" });
      setConfirmCancel(null);
      setCancelReason("");
    } catch (err) {
      setNotify({
        message:
          err instanceof Error ? err.message : "No se pudo cancelar el pedido",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <main className="flex h-full flex-col gap-8 rounded-[32px] bg-[#f5f7fb] p-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-900">
              Centro de Operaciones
            </h1>
            <p className="mt-2 text-zinc-500">
              Monitoreo en tiempo real del flujo de pedidos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isGerente && (
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-xl px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="">Todas las sedes</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-2 shadow-sm">
              <div className="relative flex h-3 w-3 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                Sistema Operativo
              </span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 rounded-3xl bg-white/60 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-sm text-red-600">
            {error}
          </div>
        ) : (
          <>
            <section
              className="grid grid-cols-2 sm:grid-cols-4 gap-4"
              aria-label="Estadísticas de pedidos"
            >
              <StatCard title="Pedidos activos" value={activeOrders.length} />
              <StatCard
                title="En cocina"
                value={ordersByStatus[OrderStatus.InPreparation]?.length || 0}
                valueColor="text-orange-500"
              />
              <StatCard
                title="Listos"
                value={ordersByStatus[OrderStatus.Ready]?.length || 0}
                valueColor="text-emerald-500"
              />
              <StatCard
                title="Cancelados"
                value={cancelledOrders.length}
                valueColor="text-red-500"
              />
            </section>

            <div className="flex gap-6 overflow-x-auto pb-4">
              {BOARD_COLUMNS.map((column) => {
                const columnOrders = ordersByStatus[column.status] || [];

                return (
                  <section key={column.status} className="w-[340px] shrink-0">
                    <header
                      className={`mb-4 rounded-2xl bg-gradient-to-r p-[1px] shadow-lg ${column.color}`}
                    >
                      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                        <div className="flex items-center gap-3">
                          <column.icon size={18} className="text-zinc-700" />
                          <div>
                            <h3 className="font-bold text-zinc-900">
                              {column.title}
                            </h3>
                            <p className="text-xs text-zinc-500">
                              {columnOrders.length} pedidos
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700">
                          {columnOrders.length}
                        </span>
                      </div>
                    </header>

                    <div className="min-h-[300px] space-y-4 rounded-3xl border border-white/50 bg-white/40 p-3 backdrop-blur-sm">
                      {columnOrders.length === 0 ? (
                        <p className="text-center text-xs text-zinc-400 py-8">
                          Sin pedidos aquí
                        </p>
                      ) : (
                        columnOrders.map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            onView={() => setSelectedOrderId(order.id)}
                            onAdvance={() => handleAdvanceStatus(order)}
                            onCancel={() => setConfirmCancel(order)}
                            saving={saving}
                          />
                        ))
                      )}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Cancelados (colapsable) */}
            <div>
              <button
                onClick={() => setShowCancelled((v) => !v)}
                className="text-sm font-bold text-zinc-500 hover:text-zinc-700 flex items-center gap-2"
              >
                <XCircle size={16} />
                {showCancelled ? "Ocultar" : "Ver"} pedidos cancelados (
                {cancelledOrders.length})
              </button>
              {showCancelled && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {cancelledOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onView={() => setSelectedOrderId(order.id)}
                      saving={saving}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* MODAL DETALLE DEL PEDIDO */}
      <Dialog
        isOpen={!!selectedOrderId}
        title={selectedOrder ? `Pedido #${selectedOrder.id}` : "Pedido"}
        subtitle={
          selectedOrder ? TYPE_LABELS[selectedOrder.orderType] : undefined
        }
        onClose={() => setSelectedOrderId(null)}
      >
        {loadingDetail ? (
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
                        {formatCurrency(detail.subTotal)}
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
                            {STATUS_LABELS[h.status]}
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
                <span>{formatCurrency(selectedOrder.subTotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Impuesto</span>
                <span>{formatCurrency(selectedOrder.tax)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatCurrency(selectedOrder.total)}</span>
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

      {/* MODAL CANCELAR */}
      <Dialog
        isOpen={!!confirmCancel}
        title="Cancelar Pedido"
        onClose={() => {
          setConfirmCancel(null);
          setCancelReason("");
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Seguro que deseas cancelar el pedido{" "}
            <strong className="text-[#111827]">#{confirmCancel?.id}</strong>?
            Indica el motivo:
          </p>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            placeholder="Ej: El cliente canceló, producto agotado, etc."
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setConfirmCancel(null);
                setCancelReason("");
              }}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Volver
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? "Cancelando..." : "Cancelar Pedido"}
            </button>
          </div>
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

interface StatCardProps {
  title: string;
  value: string | number;
  valueColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  valueColor = "text-zinc-900",
}) => (
  <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
    <p className="text-sm font-medium text-zinc-500">{title}</p>
    <h2 className={`mt-2 text-3xl font-black ${valueColor}`}>{value}</h2>
  </div>
);

interface OrderCardProps {
  order: Order;
  onView: () => void;
  onAdvance?: () => void;
  onCancel?: () => void;
  saving: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onView,
  onAdvance,
  onCancel,
  saving,
}) => {
  const canAdvance = !!NEXT_STATUS[order.status];

  return (
    <article className="group relative overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,0.08)]">
      <header className="relative mb-4 flex items-start justify-between">
        <div>
          <h4 className="text-[18px] font-black tracking-tight text-zinc-900">
            #{order.id}
          </h4>
          <time className="text-xs font-medium text-zinc-500">
            {timeAgo(order.createdAt)}
          </time>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-700">
          {TYPE_LABELS[order.orderType]}
        </span>
      </header>

      <div className="relative mb-4">
        <p className="text-sm font-medium text-zinc-600">
          {order.customerName ?? "Cliente sin registrar"}
          {order.tableNumber ? ` · Mesa ${order.tableNumber}` : ""}
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          {order.orderDetails?.length ?? 0}{" "}
          {(order.orderDetails?.length ?? 0) === 1 ? "producto" : "productos"}
        </p>
      </div>

      <footer className="relative flex items-center justify-between border-t border-zinc-100 pt-4 mb-3">
        <span
          className={`rounded-full border px-3 py-1.5 text-[11px] font-bold ${STATUS_STYLES[order.status]}`}
        >
          {STATUS_LABELS[order.status]}
        </span>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Total
          </p>
          <span className="text-[20px] font-black tracking-tight text-zinc-900">
            {formatCurrency(order.total)}
          </span>
        </div>
      </footer>

      <div className="flex gap-2">
        <button
          onClick={onView}
          className="flex-1 text-xs font-bold text-zinc-600 border border-zinc-200 rounded-lg py-2 hover:bg-zinc-50 transition-colors"
        >
          Ver detalle
        </button>
        {canAdvance && onAdvance && (
          <button
            onClick={onAdvance}
            disabled={saving}
            className="flex-1 text-xs font-bold text-white bg-zinc-900 rounded-lg py-2 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Avanzar
          </button>
        )}
        {onCancel && order.status !== OrderStatus.Cancelled && (
          <button
            onClick={onCancel}
            disabled={saving}
            className="text-xs font-bold text-red-600 border border-red-200 rounded-lg py-2 px-3 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        )}
      </div>
    </article>
  );
};



"use client";

import { Dialog } from "@/components/ui/dialog";
import { useOrderDetail } from "@/features/Order/hooks/use-order-details";
import { OrderDetailStatus } from "@/features/Order/types/order.types";
import type { Notification } from "../types/notification.types";

const DETAIL_STATUS_LABELS: Record<OrderDetailStatus, string> = {
  [OrderDetailStatus.Pending]: "En espera",
  [OrderDetailStatus.InPreparation]: "En preparación",
  [OrderDetailStatus.Ready]: "Listo",
  [OrderDetailStatus.Delivered]: "Entregado",
  [OrderDetailStatus.Cancelled]: "Cancelado",
  [OrderDetailStatus.Voided]: "Anulado",
};

const DETAIL_STATUS_STYLES: Record<OrderDetailStatus, string> = {
  [OrderDetailStatus.Pending]: "bg-yellow-100 text-yellow-700",
  [OrderDetailStatus.InPreparation]: "bg-orange-100 text-orange-700",
  [OrderDetailStatus.Ready]: "bg-emerald-100 text-emerald-700",
  [OrderDetailStatus.Delivered]: "bg-zinc-100 text-zinc-700",
  [OrderDetailStatus.Cancelled]: "bg-red-100 text-red-700",
  [OrderDetailStatus.Voided]: "bg-red-100 text-red-700",
};

const TYPE_LABELS: Record<string, string> = {
  OrderCreated: "Pedido creado",
  OrderStatusChanged: "Estado de pedido actualizado",
  OrderReady: "Pedido listo",
  DeliveryAssigned: "Domicilio asignado",
  DeliveryInTransit: "Domicilio en camino",
  DeliveryCompleted: "Domicilio entregado",
  ShiftEndingSoon: "Turno por terminar",
  PaymentConfirmed: "Pago confirmado",
  Manual: "Aviso manual",
  System: "Aviso del sistema",
  ReviewReceived: "Nueva calificación",
};

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface NotificationDetailModalProps {
  notification: Notification | null;
  onClose: () => void;
  onMarkAsRead: (id: number) => void;
}

export const NotificationDetailModal = ({
  notification,
  onClose,
  onMarkAsRead,
}: NotificationDetailModalProps) => {
  // Solo pedimos el detalle del pedido cuando la notificación es realmente de un pedido
  const isOrderRelated =
    notification?.relatedEntityType?.toLowerCase() === "order";
  const orderId = isOrderRelated ? notification!.relatedEntityId : null;
  const isReview = String(notification?.type) === "ReviewReceived";
  const { order, loading: loadingOrder } = useOrderDetail(orderId);

  return (
    <Dialog
      isOpen={!!notification}
      title={
        notification
          ? (TYPE_LABELS[notification.type] ?? notification.title)
          : "Notificación"
      }
      subtitle={
        notification ? formatDateTime(notification.createdAt) : undefined
      }
      onClose={onClose}
    >
      {notification && (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-bold text-gray-800">
              {notification.title}
            </p>
            <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
              {notification.message}
            </p>
          </div>

          {isOrderRelated && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                Pedido relacionado
              </p>
              {loadingOrder ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-10 rounded-lg bg-gray-100 animate-pulse"
                    />
                  ))}
                </div>
              ) : order ? (
                <div className="border border-gray-100 rounded-xl p-5 space-y-5">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                        Cliente
                      </p>
                      <p className="font-semibold text-gray-800">
                        {order.customerName ?? "Sin cliente"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                        Sede
                      </p>
                      <p className="font-semibold text-gray-800">
                        {order.branchName ?? "—"}
                      </p>
                    </div>
                    {!isReview && (
                      <>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Mesa
                          </p>
                          <p className="font-semibold text-gray-800">
                            {order.tableNumber ? `#${order.tableNumber}` : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Empleado
                          </p>
                          <p className="font-semibold text-gray-800">
                            {order.employeeName ?? "Sin asignar"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="divide-y divide-gray-100 border-t border-gray-100 pt-4">
                    {order.orderDetails.length === 0 ? (
                      <p className="text-sm text-gray-400 py-2">
                        Sin productos agregados.
                      </p>
                    ) : (
                      order.orderDetails.map((d) => (
                        <div key={d.id} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-sm font-semibold text-gray-800">
                              {d.quantity}x {d.productName}
                            </p>
                            <span className="text-sm font-bold text-gray-800 shrink-0">
                              $
                              {(
                                d.subTotal ?? d.unitPrice * d.quantity
                              ).toLocaleString("es-CO")}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {d.isToGo && (
                              <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-100 text-blue-700">
                                Para Llevar
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold px-2 py-1 rounded ${DETAIL_STATUS_STYLES[d.status]}`}
                            >
                              {DETAIL_STATUS_LABELS[d.status]}
                            </span>
                          </div>
                          {d.notes && (
                            <p className="text-xs text-gray-500 mt-2">
                              📝 {d.notes}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex justify-between text-base font-black text-gray-900 pt-4 border-t border-gray-200">
                    <span>Total</span>
                    <span>${(order.total ?? 0).toLocaleString("es-CO")}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  No se pudo cargar el pedido relacionado.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cerrar
            </button>
            {!notification.isRead && (
              <button
                onClick={() => {
                  onMarkAsRead(notification.id);
                  onClose();
                }}
                className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors"
              >
                Marcar como leída
              </button>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
};

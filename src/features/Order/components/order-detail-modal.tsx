"use client";

import { translateCopy, getCurrentLocale } from "@/config/copy-translations";
import { Dialog } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { useOrderDetail } from "../hooks/use-order-details";
import { useOrderStatusHistory } from "../hooks/use-order-status-history";
import { OrderStatus, OrderType } from "../types/order.types";

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

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat(getCurrentLocale(), {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString(getCurrentLocale(), {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

interface OrderDetailModalProps {
  orderId: number | null;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  orderId,
  onClose,
}) => {
  const { t } = useTranslation();
  const { order: selectedOrder, loading: loadingDetail } =
    useOrderDetail(orderId);
  const { history: statusHistory, loading: loadingHistory } =
    useOrderStatusHistory(orderId);

  return (
    <Dialog
      isOpen={!!orderId}
      title={translateCopy("Pedido")}
      subtitle={
        selectedOrder ? translateCopy(TYPE_LABELS[selectedOrder.orderType]) : undefined
      }
      onClose={onClose}
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
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">
                 {translateCopy("Cliente")} </p>
              <p className="font-semibold text-gray-800">
                {selectedOrder.customerName ?? translateCopy("Sin cliente")}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">{translateCopy("Sede")}</p>
              <p className="font-semibold text-gray-800">
                {selectedOrder.branchName ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">{translateCopy("Mesa")}</p>
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
                        <p className="text-xs text-gray-500">{detail.notes}</p>
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
                          {translateCopy(STATUS_LABELS[h.status])}
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
              <span>{formatCurrency(selectedOrder.subTotal)}</span>
            </div>
            {selectedOrder.tax > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  {selectedOrder.taxIncludedInPrice
                    ? t("orderBreakdown.taxOnProducts")
                    : translateCopy("Impoconsumo adicional")}
                  {selectedOrder.taxRate > 0 ? ` (${selectedOrder.taxRate}%)` : ""}
                </span>
                <span>{formatCurrency(selectedOrder.tax)}</span>
              </div>
            )}
            {selectedOrder.deliveryFee > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>{translateCopy("Domicilio")}</span>
                <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-200">
              <span>{translateCopy("Total")}</span>
              <span>{formatCurrency(selectedOrder.total)}</span>
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
  );
};

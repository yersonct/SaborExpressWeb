"use client";

import { useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { NotificationModal } from "@/components/ui/modal";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useBranches } from "@/features/branches/hooks/use-branches";
import { useMyBranch } from "@/features/branches/hooks/use-my-branch";
import { usePayments } from "@/features/Payments/hooks/use-payments";
import {
  PaymentMethod,
  PaymentStatus,
  type Payment,
} from "@/features/Payments/types/payment.types";
import {
  paymentMethodLabels,
  paymentMethodDotColor,
  paymentStatusLabels,
  paymentStatusBadgeClasses,
} from "@/features/Payments/utils/payment-labels";
import {
  summarizeByMethod,
  summarizeByStatus,
  totalConfirmed,
} from "@/features/Payments/utils/payment-summary";
import {
  buildDateRange,
  type DateRangeOption,
} from "@/features/Payments/utils/date-ranges";

type NotifyState = { message: string; type: "success" | "error" } | null;

export const AuditView = () => {
  const { session, isHydrated } = useAuth();
  const isGerente =
    isHydrated && !!session?.roles?.some((r) => r.toUpperCase() === "GERENTE");
  const isAdministrador =
    isHydrated &&
    !!session?.roles?.some((r) => r.toUpperCase() === "ADMINISTRADOR");

  // Gerente: lista de sedes para el selector
  const { branches } = useBranches(isGerente);
  // Administrador: su sede fija
  const { branch: myBranch, loading: loadingMyBranch } =
    useMyBranch(isAdministrador);

  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(
    undefined,
  );
  const effectiveBranchId = isAdministrador ? myBranch?.id : selectedBranchId;

  // Rango de fechas: el Administrador siempre está fijo en "hoy".
  // El Gerente puede elegir; el valor solo se recalcula cuando cambia la opción, nunca en cada render.
  const [dateOption, setDateOption] = useState<DateRangeOption>("hoy");
  const { fromDate, toDate } = useMemo(
    () => buildDateRange(isAdministrador ? "hoy" : dateOption),
    [isAdministrador, dateOption],
  );

  // Filtro por método de pago (disponible para ambos roles)
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "all">(
    "all",
  );

  const paymentsEnabled = isGerente || (isAdministrador && !!myBranch);

  const { payments, loading, error, refundPayment } = usePayments(
    { branchId: effectiveBranchId, fromDate, toDate },
    paymentsEnabled,
  );

  const filteredPayments =
    methodFilter === "all"
      ? payments
      : payments.filter((p) => p.method === methodFilter);

  const methodBreakdown = summarizeByMethod(filteredPayments);
  const statusBreakdown = summarizeByStatus(filteredPayments);
  const totalToday = totalConfirmed(filteredPayments);

  // Reembolso: disponible para ambos roles
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);
  const [notify, setNotify] = useState<NotifyState>(null);

  const openRefund = (payment: Payment) => {
    setRefundTarget(payment);
    setRefundReason("");
  };

  const handleRefund = async () => {
    if (!refundTarget || !refundReason.trim()) return;
    setRefunding(true);
    try {
      await refundPayment(refundTarget.id, refundReason.trim());
      setNotify({ message: "Pago reembolsado correctamente", type: "success" });
      setRefundTarget(null);
    } catch (err) {
      setNotify({
        message:
          err instanceof Error
            ? err.message
            : "No se pudo procesar el reembolso",
        type: "error",
      });
    } finally {
      setRefunding(false);
    }
  };

  // Exportar: solo Gerente
  const handleExport = () => {
    const rows = filteredPayments.map((p) => ({
      fecha: new Date(p.paidAt).toLocaleString("es-CO"),
      pedido: p.orderId,
      cajero: p.cashierName ?? "",
      metodo: paymentMethodLabels[p.method],
      monto: p.amount,
      estado: paymentStatusLabels[p.status],
    }));
    const csv = [
      Object.keys(rows[0] ?? {}).join(","),
      ...rows.map((r) => Object.values(r).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pagos_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="h-full flex flex-col space-y-8 pb-8">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] tracking-tighter">
              Auditoría de Caja
            </h1>
            <p className="text-gray-500 mt-1 font-medium">
              Consulta de pagos e ingresos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de sede: solo Gerente */}
            {isGerente && (
              <select
                value={selectedBranchId ?? "all"}
                onChange={(e) =>
                  setSelectedBranchId(
                    e.target.value === "all"
                      ? undefined
                      : Number(e.target.value),
                  )
                }
                className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EA1D2C]"
              >
                <option value="all">Todas las sedes</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            {/* Sede fija: solo Administrador */}
            {isAdministrador && (
              <div className="text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-2">
                <span className="text-gray-400">🏬</span>
                {loadingMyBranch
                  ? "Cargando sede..."
                  : (myBranch?.name ?? "Sin sede asignada")}
              </div>
            )}

            {/* Rango de fechas: solo Gerente puede cambiarlo */}
            {isGerente && (
              <select
                value={dateOption}
                onChange={(e) =>
                  setDateOption(e.target.value as DateRangeOption)
                }
                className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EA1D2C]"
              >
                <option value="hoy">Hoy</option>
                <option value="ayer">Ayer</option>
                <option value="semana">Últimos 7 días</option>
                <option value="mes">Últimos 30 días</option>
              </select>
            )}

            {/* Filtro por método: ambos roles */}
            <select
              value={methodFilter}
              onChange={(e) =>
                setMethodFilter(e.target.value as PaymentMethod | "all")
              }
              className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EA1D2C]"
            >
              <option value="all">Todos los métodos</option>
              {Object.values(PaymentMethod).map((m) => (
                <option key={m} value={m}>
                  {paymentMethodLabels[m]}
                </option>
              ))}
            </select>

            {/* Exportar: solo Gerente */}
            {isGerente && (
              <button
                onClick={handleExport}
                disabled={filteredPayments.length === 0}
                className="bg-[#111827] hover:bg-gray-800 text-white font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all text-sm disabled:opacity-40"
              >
                Exportar CSV
              </button>
            )}
          </div>
        </div>

        {/* Total confirmado */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm max-w-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Total Confirmado
            </h3>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg text-lg">
              💻
            </span>
          </div>
          <p className="text-3xl font-black text-[#111827]">
            {loading ? "—" : `$${totalToday.toLocaleString("es-CO")}`}
          </p>
          <p className="text-xs text-gray-500 mt-2 font-medium">
            Suma de todos los pagos confirmados.
          </p>
        </div>

        {/* Desglose por método: ambos roles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {methodBreakdown.map(({ method, total }) => (
            <div
              key={method}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`w-2 h-2 rounded-full ${paymentMethodDotColor[method]}`}
                ></span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {paymentMethodLabels[method]}
                </span>
              </div>
              <p className="text-xl font-black text-[#111827]">
                {loading ? "—" : `$${total.toLocaleString("es-CO")}`}
              </p>
            </div>
          ))}
        </div>

        {/* Conteo por estado: ambos roles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statusBreakdown.map(({ status, count }) => (
            <div
              key={status}
              className={`rounded-2xl p-5 border shadow-sm ${paymentStatusBadgeClasses[status]}`}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-1">
                {paymentStatusLabels[status]}
              </p>
              <p className="text-2xl font-black">{loading ? "—" : count}</p>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex-1">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-base font-bold text-[#111827]">
              Historial de Movimientos
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-6 py-4 font-bold">Hora</th>
                  <th className="px-6 py-4 font-bold">Pedido</th>
                  <th className="px-6 py-4 font-bold">Responsable</th>
                  <th className="px-6 py-4 font-bold">Método</th>
                  <th className="px-6 py-4 font-bold text-right">Ingreso</th>
                  <th className="px-6 py-4 font-bold text-center">Estado</th>
                  <th className="px-6 py-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {loading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-400"
                    >
                      Cargando movimientos...
                    </td>
                  </tr>
                )}
                {error && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-red-500"
                    >
                      {error}
                    </td>
                  </tr>
                )}
                {!loading && !error && filteredPayments.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-400"
                    >
                      Aún no hay pagos registrados.
                    </td>
                  </tr>
                )}
                {filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-xs font-bold text-gray-500">
                      {new Date(p.paidAt).toLocaleTimeString("es-CO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 font-black text-[#111827]">
                      <a
                        href={`/orders?orderId=${p.orderId}`}
                        className="hover:text-[#EA1D2C] hover:underline"
                      >
                        #ORD-{p.orderId}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {p.cashierName ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center gap-1.5 w-fit">
                        <span
                          className={`w-2 h-2 rounded-full ${paymentMethodDotColor[p.method]}`}
                        ></span>
                        {paymentMethodLabels[p.method]}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-gray-900 text-right">
                      +${p.amount.toLocaleString("es-CO")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${paymentStatusBadgeClasses[p.status]}`}
                      >
                        {paymentStatusLabels[p.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.status === PaymentStatus.Completed && (
                        <button
                          onClick={() => openRefund(p)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                        >
                          Reembolsar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de reembolso: ambos roles */}
      <Dialog
        isOpen={!!refundTarget}
        title="Reembolsar Pago"
        subtitle={
          refundTarget
            ? `Pedido #ORD-${refundTarget.orderId} — $${refundTarget.amount.toLocaleString("es-CO")}`
            : ""
        }
        onClose={() => setRefundTarget(null)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Motivo del reembolso
            </label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#EA1D2C]"
              placeholder="Ej: Producto no entregado"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setRefundTarget(null)}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleRefund}
              disabled={refunding || !refundReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {refunding ? "Procesando..." : "Confirmar reembolso"}
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

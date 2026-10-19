"use client";

import { useRememberedUiState } from "@/lib/use-remembered-ui-state";
import { translateCopy, getCurrentLocale } from "@/config/copy-translations";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { NotificationModal } from "@/components/ui/modal";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useBranches } from "@/features/branches/hooks/use-branches";
import { useMyBranch } from "@/features/branches/hooks/use-my-branch";
import { usePayments } from "@/features/Payments/hooks/use-payments";
import { CashClosuresPanel } from "@/features/Payments/components/cash-closures-panel";
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
import { openPaymentsPdf } from "@/features/Payments/utils/payment-pdf";
import {
  formatColombiaDateTime,
  getColombiaDayKey,
} from "@/lib/colombia-date";
import { formatMoney } from "@/lib/format-money";
import {
  pendingNavigationKeys,
  rememberNavigationTarget,
} from "@/config/pending-navigation";

type NotifyState = { message: string; type: "success" | "error" | "warning" } | null;

export const AuditView = () => {
  const { t } = useTranslation();
  const router = useRouter();
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

  const [selectedBranchId, setSelectedBranchId] = useRememberedUiState<number | undefined>(
    "payments", "branch", undefined,
  );
  const effectiveBranchId = isAdministrador ? myBranch?.id : selectedBranchId;

  // Rango de fechas: el Administrador siempre está fijo en "hoy".
  // El Gerente puede elegir; el valor solo se recalcula cuando cambia la opción, nunca en cada render.
  const [dateOption, setDateOption] = useRememberedUiState<DateRangeOption>("payments", "period", "hoy");
  const [colombiaTodayKey, setColombiaTodayKey] = useState(
    () => getColombiaDayKey() ?? "",
  );
  useEffect(() => {
    const timer = setInterval(
      () => setColombiaTodayKey(getColombiaDayKey() ?? ""),
      60_000,
    );
    return () => clearInterval(timer);
  }, []);
  const { fromDate, toDate } = useMemo(
    () => buildDateRange(isAdministrador ? "hoy" : dateOption),
    [isAdministrador, dateOption, colombiaTodayKey],
  );

  // Filtro por método de pago (disponible para ambos roles)
  const [methodFilter, setMethodFilter] = useRememberedUiState<PaymentMethod | "all">(
    "payments", "method", "all",
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

  const handleCancelRefund = () => {
    setRefundTarget(null);
    setRefundReason("");
    setNotify({
      message: translateCopy("Reembolso cancelado. No se hizo ningún cambio en el pago."),
      type: "warning",
    });
  };

  const handleRefund = async () => {
    if (!refundTarget || !refundReason.trim()) return;
    setRefunding(true);
    try {
      await refundPayment(refundTarget.id, refundReason.trim());
      setNotify({ message: translateCopy("Pago reembolsado correctamente"), type: "success" });
      setRefundTarget(null);
    } catch (err) {
      setNotify({
        message:
          err instanceof Error
            ? translateCopy(err.message)
            : translateCopy("No se pudo procesar el reembolso"),
        type: "error",
      });
    } finally {
      setRefunding(false);
    }
  };

  // Exportar: solo Gerente
  const handleExport = () => {
    const headers = ["Fecha", "Cajero", "Método", "Monto", "Estado"]
      .map(translateCopy);
    const rows = filteredPayments.map((p) => [
      formatColombiaDateTime(p.paidAt, getCurrentLocale()),
      p.cashierName ?? "",
      translateCopy(paymentMethodLabels[p.method]),
      p.amount,
      translateCopy(paymentStatusLabels[p.status]),
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${translateCopy("Pagos").toLowerCase()}_${getColombiaDayKey()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const rangeLabels: Record<DateRangeOption, string> = {
      hoy: translateCopy("Hoy"),
      ayer: translateCopy("Ayer"),
      semana: translateCopy("Últimos 7 días"),
      mes: translateCopy("Últimos 30 días"),
    };
    const branchName = isAdministrador
      ? (myBranch?.name ?? "Mi sede")
      : (branches.find((b) => b.id === selectedBranchId)?.name ??
        translateCopy("Todas las sedes"));

    openPaymentsPdf({
      payments: filteredPayments,
      branchName,
      rangeLabel: rangeLabels[isAdministrador ? "hoy" : dateOption],
      methodLabel:
        methodFilter === "all"
          ? translateCopy("Todos")
          : translateCopy(paymentMethodLabels[methodFilter]),
    });
  };

  return (
    <>
      <div className="flex h-full min-w-0 flex-col space-y-8 pb-8">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] tracking-tighter">
            {t("pageTitles.audit")}
            </h1>
            <p className="text-gray-500 mt-1 font-medium">
               {translateCopy("Consulta de pagos e ingresos.")} </p>
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
                <option value="all">{translateCopy("Todas las sedes")}</option>
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
                  ? translateCopy("Cargando sede...")
                  : (myBranch?.name ?? translateCopy("Sin sede asignada"))}
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
                <option value="hoy">{translateCopy("Hoy")}</option>
                <option value="ayer">{translateCopy("Ayer")}</option>
                <option value="semana">{translateCopy("Últimos 7 días")}</option>
                <option value="mes">{translateCopy("Últimos 30 días")}</option>
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
              <option value="all">{translateCopy("Todos los métodos")}</option>
              {[
                PaymentMethod.Cash,
                PaymentMethod.Card,
                PaymentMethod.Transfer,
              ].map((m) => (
                <option key={m} value={m}>
                  {translateCopy(paymentMethodLabels[m])}
                </option>
              ))}
            </select>

            {/* Exportar: solo Gerente */}
            {isGerente && (
              <button
                onClick={handleExportPdf}
                disabled={filteredPayments.length === 0}
                className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all text-sm disabled:opacity-40"
              >
                 {translateCopy("Exportar PDF")} </button>
            )}
          </div>
        </div>

        {/* Total confirmado */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm max-w-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
               {translateCopy("Total Confirmado")} </h3>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg text-lg">
              💻
            </span>
          </div>
          <p className="text-3xl font-black text-[#111827]">
            {loading ? "—" : formatMoney(totalToday)}
          </p>
          <p className="text-xs text-gray-500 mt-2 font-medium">
             {translateCopy("Suma de todos los pagos confirmados.")} </p>
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
                  {translateCopy(paymentMethodLabels[method])}
                </span>
              </div>
              <p className="text-xl font-black text-[#111827]">
                {loading ? "—" : formatMoney(total)}
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
                {translateCopy(paymentStatusLabels[status])}
              </p>
              <p className="text-2xl font-black">{loading ? "—" : count}</p>
            </div>
          ))}
        </div>

        {/* Los cierres son permanentes y no se recalculan con los reembolsos. */}
        {paymentsEnabled && (
          <CashClosuresPanel branchId={effectiveBranchId}
            fromDate={fromDate.slice(0, 10)} toDate={toDate.slice(0, 10)} />
        )}

        {/* Tabla */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex-1">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-base font-bold text-[#111827]">
               {translateCopy("Historial de Movimientos")} </h2>
          </div>
          <div className="max-h-[55vh] overflow-auto [scrollbar-width:thin]">
            <table className="w-full min-w-[760px] text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="bg-white text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-6 py-4 font-bold">{translateCopy("Hora")}</th>
                  <th className="px-6 py-4 font-bold">{translateCopy("Pedido")}</th>
                  <th className="px-6 py-4 font-bold">{translateCopy("Responsable")}</th>
                  <th className="px-6 py-4 font-bold">{translateCopy("Método")}</th>
                  <th className="px-6 py-4 font-bold text-right">{translateCopy("Ingreso")}</th>
                  <th className="px-6 py-4 font-bold text-center">{translateCopy("Estado")}</th>
                  <th className="px-6 py-4 font-bold text-right">{translateCopy("Acciones")}</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {loading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-400"
                    >
                       {translateCopy("Cargando movimientos...")} </td>
                  </tr>
                )}
                {error && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-red-500"
                    >
                      {translateCopy(error)}
                    </td>
                  </tr>
                )}
                {!loading && !error && filteredPayments.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-400"
                    >
                       {translateCopy("Aún no hay pagos registrados.")} </td>
                  </tr>
                )}
                {filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-xs font-bold text-gray-500">
                      {formatColombiaDateTime(p.paidAt, getCurrentLocale(), {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 font-black text-[#111827]">
                      <button
                        type="button"
                        onClick={() => {
                          rememberNavigationTarget(
                            pendingNavigationKeys.order,
                            p.orderId,
                          );
                          router.push("/orders");
                        }}
                        className="hover:text-[#EA1D2C] hover:underline"
                      >
                        {translateCopy("Ver pedido")}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {p.cashierName ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center gap-1.5 w-fit">
                        <span
                          className={`w-2 h-2 rounded-full ${paymentMethodDotColor[p.method]}`}
                        ></span>
                        {translateCopy(paymentMethodLabels[p.method])}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-gray-900 text-right">
                      +{formatMoney(p.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${paymentStatusBadgeClasses[p.status]}`}
                      >
                        {translateCopy(paymentStatusLabels[p.status])}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.status === PaymentStatus.Completed && (
                        <button
                          onClick={() => openRefund(p)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                        >
                           {translateCopy("Reembolsar")} </button>
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
        title={translateCopy("Reembolsar Pago")}
        subtitle={
          refundTarget ? formatMoney(refundTarget.amount) : ""
        }
        onClose={() => setRefundTarget(null)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
               {translateCopy("Motivo del reembolso")} </label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#EA1D2C]"
              placeholder={translateCopy("Ej: Producto no entregado")}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={handleCancelRefund}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
               {translateCopy("Cancelar")} </button>
            <button
              onClick={handleRefund}
              disabled={refunding || !refundReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {refunding ? translateCopy("Procesando...") : translateCopy("Confirmar reembolso")}
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

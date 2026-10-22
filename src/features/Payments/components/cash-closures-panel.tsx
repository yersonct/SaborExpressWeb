"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatMoney } from "@/lib/format-money";
import { COLOMBIA_TIME_ZONE, formatColombiaDateTime, getColombiaDayKey } from "@/lib/colombia-date";
import { Dialog } from "@/components/ui/dialog";
import { cashClosureService, type CashClosure } from "../services/cash-closure.service";
import { getCurrentLocale, translateCopy } from "@/config/copy-translations";

type Props = {
  branchId?: number;
  fromDate?: string;
  toDate?: string;
};

function formatShiftDate(dayKey: string): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 17));
  if (!Number.isFinite(date.getTime())) return dayKey;

  return date.toLocaleDateString(getCurrentLocale(), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: COLOMBIA_TIME_ZONE,
  });
}

// Historial inmutable de cierres, independiente del estado actual de los pagos.
export function CashClosuresPanel({ branchId, fromDate, toDate }: Props) {
  useTranslation();
  const [rows, setRows] = useState<CashClosure[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [reopenTarget, setReopenTarget] = useState<CashClosure | null>(null);
  const [reopenReason, setReopenReason] = useState("");
  const [reopenError, setReopenError] = useState<string | null>(null);
  const [reopening, setReopening] = useState(false);
  const todayInColombia = getColombiaDayKey();

  const confirmReopen = async () => {
    if (!reopenTarget || reopening) return;
    if (reopenReason.trim().length < 10) {
      setReopenError(translateCopy("Describe el motivo con al menos 10 caracteres."));
      return;
    }
    setReopening(true);
    setReopenError(null);
    try {
      await cashClosureService.reopen(reopenTarget.id, reopenReason.trim());
      setReopenTarget(null);
      setReopenReason("");
      await reload();
    } catch (err: unknown) {
      const candidate = err as { response?: { data?: { message?: string } }; message?: string };
      setReopenError(translateCopy(candidate?.response?.data?.message || candidate?.message || "No se pudo reabrir la caja."));
    } finally {
      setReopening(false);
    }
  };
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await cashClosureService.getHistory({ branchId, fromDate, toDate }));
    } catch (err: unknown) {
      setRows([]);
      setError(translateCopy(err instanceof Error ? err.message : "No se pudo consultar el historial de cierres."));
    } finally {
      setLoading(false);
    }
  }, [branchId, fromDate, toDate]);

  useEffect(() => { void reload(); }, [reload]);

  return (
    <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden" aria-label={translateCopy("Cierres de caja")}>
      <div className="flex flex-wrap gap-3 items-center justify-between p-5 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{translateCopy("Historial de cierres de caja")}</h2>
          <p className="text-xs text-gray-500 mt-1">{translateCopy("Cuadres guardados por turno. Las cifras son una fotografía del cierre y no cambian si después hay reembolsos.")}</p>
        </div>
        <button type="button" onClick={() => void reload()} disabled={loading}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50">
          {loading ? translateCopy("Consultando…") : translateCopy("Actualizar cierres")}
        </button>
      </div>
      {error && <p role="alert" className="p-4 text-sm text-red-700 bg-red-50">{error}</p>}
      {!loading && !error && rows.length === 0 && <p className="p-6 text-sm text-gray-500">{translateCopy("No hay cierres registrados para estos filtros.")}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-[940px] w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="p-3">{translateCopy("Fecha / sede")}</th>
              <th className="p-3">{translateCopy("Cajero / turno")}</th>
              <th className="p-3 text-right">{translateCopy("Efectivo esperado")}</th>
              <th className="p-3 text-right">{translateCopy("Contado")}</th>
              <th className="p-3 text-right">{translateCopy("Diferencia")}</th>
              <th className="p-3 text-right">{translateCopy("Ventas")}</th>
              <th className="p-3 text-center">{translateCopy("Detalle")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.id} className="align-top">
                <td className="p-3"><span className="font-semibold">{formatShiftDate(row.shiftDate)}</span><div className="text-xs text-gray-500">{row.branchName}</div></td>
                <td className="p-3"><span className="font-semibold">{row.cashierName}</span><div className="text-xs text-gray-500">{translateCopy(`Turno #${row.scheduleId}`)}</div>
                  <div className={`mt-1 text-xs font-semibold ${row.reopenedAtUtc ? "text-amber-700" : "text-green-700"}`}>
                    {row.reopenedAtUtc ? translateCopy("Reabierto · registro histórico") : translateCopy("Cierre vigente")}
                  </div>
                </td>
                <td className="p-3 text-right">{formatMoney(row.cashExpected)}</td>
                <td className="p-3 text-right">{formatMoney(row.cashCounted)}</td>
                <td className={`p-3 text-right font-bold ${row.cashDifference === 0 ? "text-green-700" : "text-red-700"}`}>
                  {row.cashDifference > 0 ? "+" : ""}{formatMoney(row.cashDifference)}
                </td>
                <td className="p-3 text-right font-semibold">{formatMoney(row.totalSales)}</td>
                <td className="p-3 text-center">
                  <details open={expanded === row.id} onToggle={e => {
                    if (e.currentTarget.open) setExpanded(row.id);
                    else setExpanded(current => current === row.id ? null : current);
                  }}>
                    <summary className="cursor-pointer text-red-600 font-semibold select-none">{translateCopy("Ver cierre")}</summary>
                    {!row.reopenedAtUtc && row.shiftDate === todayInColombia && (
                      <button type="button" onClick={() => { setReopenTarget(row); setReopenReason(""); setReopenError(null); }}
                        className="mt-2 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">
                        {translateCopy("Reabrir caja")}
                      </button>
                    )}
                    <div className="mt-3 w-80 max-w-[80vw] ml-auto text-left p-3 border rounded-xl bg-gray-50 shadow-sm space-y-1 text-xs">
                      <p><strong>{translateCopy("Cerrado:")}</strong> {formatColombiaDateTime(row.closedAtUtc)}</p>
                      <p><strong>{translateCopy("Pagos:")}</strong> {row.paymentsCount}</p>
                      <p><strong>{translateCopy("Datáfono:")}</strong> {formatMoney(row.cardTotal)}</p>
                      <p><strong>{translateCopy("Transferencia:")}</strong> {formatMoney(row.transferTotal)}</p>
                      <p><strong>{translateCopy("Wompi del cajero:")}</strong> {formatMoney(row.wompiTotal)}</p>
                      <p><strong>{translateCopy("Observaciones:")}</strong> {row.notes || translateCopy("Sin observaciones")}</p>
                      {row.reopenedAtUtc && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-900">
                          <p><strong>{translateCopy("Reabierto:")}</strong> {formatColombiaDateTime(row.reopenedAtUtc)}</p>
                          <p><strong>{translateCopy("Usuario autorizado:")}</strong> #{row.reopenedByUserId}</p>
                          <p><strong>{translateCopy("Motivo:")}</strong> {row.reopenReason}</p>
                        </div>
                      )}
                      <div className="pt-2 border-t border-gray-200">
                        <strong>{translateCopy("Pagos guardados:")}</strong>
                        <ul className="mt-1 max-h-40 overflow-y-auto space-y-1">
                          {row.payments.map(p => <li key={p.paymentId}>
                            #{p.paymentId} · {translateCopy(`Pedido #${p.orderId}`)} · {translateCopy(p.method)} · {formatMoney(p.amount)}
                          </li>)}
                        </ul>
                      </div>
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog isOpen={reopenTarget !== null} title={translateCopy("Reabrir caja de la sede")}
        onClose={() => { if (!reopening) setReopenTarget(null); }}>
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            {translateCopy(`Vas a reabrir la caja de ${reopenTarget?.branchName} del ${reopenTarget ? formatShiftDate(reopenTarget.shiftDate) : ""}. Los pagos y el arqueo anteriores no se borrarán. Los empleados deberán iniciar sesión de nuevo y únicamente podrán trabajar dentro de sus turnos vigentes.`)}
          </p>
          <label htmlFor="cash-reopen-reason" className="block text-sm font-semibold text-slate-700">{translateCopy("Motivo obligatorio")}</label>
          <textarea id="cash-reopen-reason" value={reopenReason} maxLength={500} rows={3}
            aria-invalid={Boolean(reopenError) || (reopenReason.trim().length > 0 && reopenReason.trim().length < 10)}
            aria-describedby="cash-reopen-reason-hint"
            onChange={e => { setReopenReason(e.target.value); setReopenError(null); }}
            placeholder={translateCopy("Por ejemplo: el cierre se realizó antes de finalizar la jornada")}
            className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900"
            disabled={reopening} />
          <p id="cash-reopen-reason-hint" className="text-xs text-slate-500">{translateCopy("Describe el motivo con al menos 10 caracteres.")}</p>
          {reopenReason.trim().length > 0 && reopenReason.trim().length < 10 && (
            <p role="alert" className="text-sm text-red-700">{translateCopy("Describe el motivo con al menos 10 caracteres.")}</p>
          )}
          {reopenError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{reopenError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold"
              disabled={reopening} onClick={() => setReopenTarget(null)}>{translateCopy("Cancelar")}</button>
            <button type="button" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={reopening || reopenReason.trim().length < 10} onClick={() => void confirmReopen()}>
              {reopening ? translateCopy("Reabriendo...") : translateCopy("Confirmar reapertura")}
            </button>
          </div>
        </div>
      </Dialog>
      {rows.length >= 200 && <p className="px-5 py-3 text-xs text-amber-700">{translateCopy("Se muestran los últimos 200 cierres. Reduce el rango de fechas para consultar más.")}</p>}
    </section>
  );
}

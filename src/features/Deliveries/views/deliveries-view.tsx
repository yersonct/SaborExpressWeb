"use client";

import { translateCopy } from "@/config/copy-translations";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { NotificationModal } from "@/components/ui/modal";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useBranches } from "@/features/branches/hooks/use-branches";
import { useMyBranch } from "@/features/branches/hooks/use-my-branch";
import { useBranchDeliveries } from "../hooks/use-branch-deliveries";
import type { DeliveryStatus } from "../types/delivery.types";
import { useRealtimeEvents } from "@/features/Dashboard/hooks/use-realtime-events";
type NotifyState = { message: string; type: "success" | "error" } | null;

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  Assigned: "Asignado",
  InTransit: "En camino",
  Delivered: "Entregado",
};

const STATUS_STYLES: Record<DeliveryStatus, string> = {
  Assigned: "bg-blue-50 text-blue-700 border-blue-200",
  InTransit: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Delivered: "bg-green-50 text-green-700 border-green-200",
};

// El único paso hacia adelante disponible desde cada estado.
// "Delivered" es el final, no tiene siguiente.
const NEXT_STATUS: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  Assigned: "InTransit",
  InTransit: "Delivered",
};

export const DeliveriesView = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = (i18n.resolvedLanguage ?? i18n.language)
    .split(/[-_]/)[0]
    .toLowerCase();
  const dateLocale = currentLanguage === "en"
    ? "en-US"
    : currentLanguage === "pt"
      ? "pt-BR"
      : currentLanguage === "fr"
        ? "fr-FR"
        : "es-CO";
  const { session, isHydrated } = useAuth();
  const isAdmin =
    session?.roles?.some((r) => r.toUpperCase() === "ADMINISTRADOR") ?? false;
  const isGerente =
    session?.roles?.some((r) => r.toUpperCase() === "GERENTE") ?? false;

  const { branches } = useBranches(isHydrated && isGerente);
  const { branch: myBranch } = useMyBranch(isHydrated && isAdmin);

  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [notify, setNotify] = useState<NotifyState>(null);
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "All">("All");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (isAdmin && myBranch) {
      setSelectedBranchId(myBranch.id);
    } else if (isGerente && branches.length > 0 && selectedBranchId == null) {
      setSelectedBranchId(branches[0].id);
    }
  }, [isAdmin, myBranch, isGerente, branches, selectedBranchId]);

  const {
    deliveries,
    deliveryPersons,
    loading,
    error,
    savingId,
    updateStatus,
    reload,
  } = useBranchDeliveries(selectedBranchId);

  useRealtimeEvents(
    session?.userId ?? null,
    ["DeliveriesChanged", "OrdersChanged"],
    () => reload(true),
    () => reload(true),
  );

  if (!isHydrated) return null;

  const PAGE_SIZE = 10;
  const STATUS_ORDER: Record<DeliveryStatus, number> = {
    Assigned: 0,
    InTransit: 1,
    Delivered: 2,
  };
  const sorted = [...deliveries].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.id - a.id,
  );
  const filtered =
    statusFilter === "All"
      ? sorted
      : sorted.filter((d) => d.status === statusFilter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleAdvanceStatus = async (deliveryId: number, current: DeliveryStatus) => {
    const next = NEXT_STATUS[current];
    if (!next) return;
    try {
      await updateStatus(deliveryId, next);
      setNotify({
        message: `${translateCopy("Domicilio actualizado a")} "${translateCopy(STATUS_LABELS[next])}"`,
        type: "success",
      });
    } catch (err) {
      setNotify({
        message:
          err instanceof Error ? translateCopy(err.message) : translateCopy("No se pudo actualizar el estado"),
        type: "error",
      });
    }
  };

  return (
    <>
      <div className="space-y-6 pb-10">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] tracking-tight">
              {t("pageTitles.deliveries")}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
               {translateCopy("Seguimiento de las entregas a repartidores.")} </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isGerente && branches.length > 0 && (
              <select
                value={selectedBranchId ?? ""}
                onChange={(e) => {
                  setSelectedBranchId(Number(e.target.value));
                  setPage(1);
                  setStatusFilter("All");
                }}
                className="w-full max-w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#111827] sm:w-auto"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {deliveryPersons.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
               {translateCopy("Repartidores de la sede")} </p>
            <div className="flex flex-wrap gap-3">
              {deliveryPersons.map((p) => (
                <div
                  key={p.employeeId}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${
                    p.isAvailable
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-gray-50 border-gray-200 text-gray-500"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${p.isAvailable ? "bg-green-500" : "bg-gray-400"}`}
                  />
                  {p.name} {p.lastName ?? ""} · {p.activeDeliveryCount}  {translateCopy("activas")} </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {(["All", "Assigned", "InTransit", "Delivered"] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                statusFilter === s
                  ? "bg-[#111827] text-white border-[#111827]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {s === "All" ? translateCopy("Todos") : translateCopy(STATUS_LABELS[s])}
              {" · "}
              {s === "All"
                ? deliveries.length
                : deliveries.filter((d) => d.status === s).length}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-gray-100 animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">{translateCopy(error)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center sm:p-16">
              <div className="text-4xl mb-3">🛵</div>
              <p className="text-gray-400 font-medium">
                 {translateCopy("No hay domicilios registrados para esta sede.")} </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">{translateCopy("Fecha")}</th>
                    <th className="px-5 py-3 font-semibold">{translateCopy("Cliente")}</th>
                    <th className="px-5 py-3 font-semibold">{translateCopy("Dirección")}</th>
                    <th className="px-5 py-3 font-semibold">{translateCopy("Repartidor")}</th>
                    <th className="px-5 py-3 font-semibold text-center">{translateCopy("Estado")}</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {visible.map((d) => {
                    return (
                      <tr key={d.id} className="hover:bg-red-50/30 transition-colors">
                        <td className="px-5 py-4 font-bold text-[#111827]">
                          {new Date(d.assignedAt).toLocaleString(dateLocale)}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-gray-700">{d.customerName ?? "—"}</p>
                          <p className="text-xs text-gray-400">{d.customerPhone ?? ""}</p>
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {d.addressText ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {d.deliveryPersonName ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${STATUS_STYLES[d.status]}`}
                          >
                            {translateCopy(STATUS_LABELS[d.status])}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <span className="break-words">
                     {translateCopy("Página")} {currentPage}  {translateCopy("de")} {totalPages} · {filtered.length}  {translateCopy("domicilios")} </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 font-bold disabled:opacity-40"
                    >
                       {translateCopy("Anterior")} </button>
                    <button
                      onClick={() => setPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 font-bold disabled:opacity-40"
                    >
                       {translateCopy("Siguiente")} </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>


      <NotificationModal
        isOpen={!!notify}
        message={notify?.message ?? ""}
        type={notify?.type ?? "success"}
        onClose={() => setNotify(null)}
      />
    </>
  );
};

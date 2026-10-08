"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { NotificationModal } from "@/components/ui/modal";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useBranches } from "@/features/branches/hooks/use-branches";
import { useMyBranch } from "@/features/branches/hooks/use-my-branch";
import { useBranchDeliveries } from "../hooks/use-branch-deliveries";
import type { DeliveryStatus } from "../types/delivery.types";

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

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#111827] placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#EA1D2C] focus:border-transparent transition-all";

const labelClass =
  "block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2";

export const DeliveriesView = () => {
  const { session, isHydrated } = useAuth();
  const isAdmin =
    session?.roles?.some((r) => r.toUpperCase() === "ADMINISTRADOR") ?? false;
  const isGerente =
    session?.roles?.some((r) => r.toUpperCase() === "GERENTE") ?? false;

  const { branches } = useBranches(isHydrated && isGerente);
  const { branch: myBranch } = useMyBranch(isHydrated && isAdmin);

  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [notify, setNotify] = useState<NotifyState>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [deliveryPersonId, setDeliveryPersonId] = useState("");

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
    assigning,
    assignDelivery,
    updateStatus,
  } = useBranchDeliveries(selectedBranchId);

  if (!isHydrated) return null;

  const openAssign = () => {
    setOrderId("");
    setDeliveryPersonId(deliveryPersons[0] ? String(deliveryPersons[0].employeeId) : "");
    setIsAssignOpen(true);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !deliveryPersonId) return;
    try {
      await assignDelivery(Number(orderId), Number(deliveryPersonId));
      setNotify({ message: "Domicilio asignado correctamente", type: "success" });
      setIsAssignOpen(false);
    } catch (err) {
      setNotify({
        message:
          err instanceof Error ? err.message : "No se pudo asignar el domicilio",
        type: "error",
      });
    }
  };

  const handleAdvanceStatus = async (deliveryId: number, current: DeliveryStatus) => {
    const next = NEXT_STATUS[current];
    if (!next) return;
    try {
      await updateStatus(deliveryId, next);
      setNotify({
        message: `Domicilio actualizado a "${STATUS_LABELS[next]}"`,
        type: "success",
      });
    } catch (err) {
      setNotify({
        message:
          err instanceof Error ? err.message : "No se pudo actualizar el estado",
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
              Domicilios
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Seguimiento y asignación de entregas a repartidores.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isGerente && branches.length > 0 && (
              <select
                value={selectedBranchId ?? ""}
                onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={openAssign}
              disabled={!selectedBranchId || deliveryPersons.length === 0}
              className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              <span className="text-lg leading-none">+</span> Asignar Domicilio
            </button>
          </div>
        </div>

        {deliveryPersons.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Repartidores de la sede
            </p>
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
                  {p.name} {p.lastName ?? ""} · {p.activeDeliveryCount} activas
                </div>
              ))}
            </div>
          </div>
        )}

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
            <div className="p-6 text-sm text-red-600">{error}</div>
          ) : deliveries.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-4xl mb-3">🛵</div>
              <p className="text-gray-400 font-medium">
                No hay domicilios registrados para esta sede.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">Pedido</th>
                    <th className="px-5 py-3 font-semibold">Cliente</th>
                    <th className="px-5 py-3 font-semibold">Dirección</th>
                    <th className="px-5 py-3 font-semibold">Repartidor</th>
                    <th className="px-5 py-3 font-semibold text-center">Estado</th>
                    <th className="px-5 py-3 font-semibold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {deliveries.map((d) => {
                    const next = NEXT_STATUS[d.status];
                    return (
                      <tr key={d.id} className="hover:bg-red-50/30 transition-colors">
                        <td className="px-5 py-4 font-bold text-[#111827]">
                          #{d.orderId}
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
                            {STATUS_LABELS[d.status]}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {next ? (
                            <button
                              onClick={() => handleAdvanceStatus(d.id, d.status)}
                              disabled={savingId === d.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                              {savingId === d.id
                                ? "Actualizando..."
                                : `Marcar "${STATUS_LABELS[next]}"`}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog
        isOpen={isAssignOpen}
        title="Asignar Domicilio"
        subtitle="Vincula un pedido existente con un repartidor de la sede."
        onClose={() => setIsAssignOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleAssign}>
          <div>
            <label className={labelClass}>Número de Pedido</label>
            <input
              type="number"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className={inputClass}
              placeholder="Ej: 128"
            />
            <p className="text-xs text-gray-400 mt-1">
              El pedido debe existir y ser tipo domicilio.
            </p>
          </div>
          <div>
            <label className={labelClass}>Repartidor</label>
            <select
              value={deliveryPersonId}
              onChange={(e) => setDeliveryPersonId(e.target.value)}
              className={inputClass}
            >
              {deliveryPersons.map((p) => (
                <option key={p.employeeId} value={p.employeeId}>
                  {p.name} {p.lastName ?? ""} ({p.activeDeliveryCount} activas)
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAssignOpen(false)}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={assigning}
              className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50"
            >
              {assigning ? "Asignando..." : "Asignar"}
            </button>
          </div>
        </form>
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

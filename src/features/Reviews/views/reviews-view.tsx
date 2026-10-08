"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { NotificationModal } from "@/components/ui/modal";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useBranches } from "@/features/branches/hooks/use-branches";
import { useMyBranch } from "@/features/branches/hooks/use-my-branch";
import { useBranchReviews } from "../hooks/use-branch-reviews";
import type { Review } from "../types/review.types";

type NotifyState = { message: string; type: "success" | "error" } | null;

const Stars = ({ value }: { value: number }) => (
  <span className="text-yellow-400 text-sm">
    {"★".repeat(value)}
    {"☆".repeat(5 - value)}
  </span>
);

const fmt = (n: number | null) => (n == null ? "—" : n.toFixed(1));

export const ReviewsView = () => {
  const { session, isHydrated } = useAuth();
  const isAdmin =
    session?.roles?.some((r) => r.toUpperCase() === "ADMINISTRADOR") ?? false;
  const isGerente =
    session?.roles?.some((r) => r.toUpperCase() === "GERENTE") ?? false;

  // Gerente: elige entre todas las sedes. Administrador: fija, la suya.
  const { branches } = useBranches(isHydrated && isGerente);
  const { branch: myBranch } = useMyBranch(isHydrated && isAdmin);

  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Review | null>(null);
  const [notify, setNotify] = useState<NotifyState>(null);

  useEffect(() => {
    if (isAdmin && myBranch) {
      setSelectedBranchId(myBranch.id);
    } else if (isGerente && branches.length > 0 && selectedBranchId == null) {
      setSelectedBranchId(branches[0].id);
    }
  }, [isAdmin, myBranch, isGerente, branches, selectedBranchId]);

  const { combined, stats, loading, error, deletingId, removeReview } =
    useBranchReviews(selectedBranchId);

  if (!isHydrated) return null;

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await removeReview(confirmDelete.id);
      setNotify({ message: "Reseña eliminada correctamente", type: "success" });
    } catch (err) {
      setNotify({
        message:
          err instanceof Error ? err.message : "No se pudo eliminar la reseña",
        type: "error",
      });
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6 pb-10">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] tracking-tight">
              Reseñas
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Calificaciones y comentarios de clientes sobre pedidos.
            </p>
          </div>

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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Calificación promedio
            </p>
            <p className="text-3xl font-black text-[#111827] mt-1">
              {fmt(stats.average)} <span className="text-yellow-400">★</span>
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Pedido · Repartidor
            </p>
            <p className="text-3xl font-black text-[#111827] mt-1">
              {fmt(stats.orderAverage)}{" "}
              <span className="text-gray-300 font-normal">·</span>{" "}
              {fmt(stats.deliveryAverage)}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Total de reseñas
            </p>
            <p className="text-3xl font-black text-[#111827] mt-1">
              {stats.total}
            </p>
          </div>
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
            <div className="p-6 text-sm text-red-600">{error}</div>
          ) : combined.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-4xl mb-3">⭐</div>
              <p className="text-gray-400 font-medium">
                Todavía no hay reseñas para esta sede.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {combined.map((item) => (
                <div
                  key={item.orderId}
                  className="p-5 flex items-start justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#111827]">
                        {item.customerName ?? "Cliente"}
                      </span>
                      <span className="text-xs text-gray-400">
                        Pedido #{item.orderId}
                        {item.date &&
                          ` · ${new Date(item.date).toLocaleDateString("es-CO")}`}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                          Pedido
                        </span>
                        {item.review ? (
                          <Stars value={item.review.rating} />
                        ) : (
                          <span className="text-xs text-gray-400">
                            Sin reseña
                          </span>
                        )}
                      </div>
                      {item.review?.comment && (
                        <p className="text-sm text-gray-600 mt-0.5">
                          {item.review.comment}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                          Repartidor
                        </span>
                        {item.delivery ? (
                          <>
                            <Stars value={item.delivery.rating} />
                            <span className="text-xs text-gray-500">
                              {item.delivery.deliveryPersonName ?? "—"}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Sin calificación
                          </span>
                        )}
                      </div>
                      {item.delivery?.comment && (
                        <p className="text-sm text-gray-600 mt-0.5">
                          {item.delivery.comment}
                        </p>
                      )}
                    </div>
                  </div>

                  {item.review && (
                    <button
                      onClick={() => setConfirmDelete(item.review)}
                      disabled={deletingId === item.review.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog
        isOpen={!!confirmDelete}
        title="Eliminar Reseña"
        onClose={() => setConfirmDelete(null)}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-xl flex-shrink-0">
            ⚠️
          </div>
          <p className="text-sm text-gray-600 pt-1.5">
            ¿Seguro que deseas eliminar esta reseña de{" "}
            <strong className="text-[#111827]">
              {confirmDelete?.customerName ?? "este cliente"}
            </strong>
            ? Esta acción no se puede deshacer.
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
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm"
          >
            Eliminar
          </button>
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

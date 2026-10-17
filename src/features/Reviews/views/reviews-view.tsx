"use client";

import { useRememberedUiState } from "@/lib/use-remembered-ui-state";
import { translateCopy, getCurrentLocale } from "@/config/copy-translations";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog } from "@/components/ui/dialog";
import { NotificationModal } from "@/components/ui/modal";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useBranches } from "@/features/branches/hooks/use-branches";
import { useMyBranch } from "@/features/branches/hooks/use-my-branch";
import { useBranchReviews } from "../hooks/use-branch-reviews";
import type { Review, CombinedReview } from "../types/review.types";

type NotifyState = { message: string; type: "success" | "error" } | null;

const Stars = ({ value }: { value: number }) => (
  <span className="text-yellow-400 text-sm">
    {"★".repeat(value)}
    {"☆".repeat(5 - value)}
  </span>
);

const BigStars = ({ value }: { value: number }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <span
        key={i}
        className={`text-3xl ${i <= value ? "text-yellow-400" : "text-gray-200"}`}
      >
        ★
      </span>
    ))}
    <span className="ml-2 text-sm font-bold text-gray-500">{value}/5</span>
  </div>
);

const fmt = (n: number | null) => (n == null ? "—" : n.toFixed(1));

export const ReviewsView = () => {
  const { t } = useTranslation();
  const { session, isHydrated } = useAuth();
  const isAdmin =
    session?.roles?.some((r) => r.toUpperCase() === "ADMINISTRADOR") ?? false;
  const isGerente =
    session?.roles?.some((r) => r.toUpperCase() === "GERENTE") ?? false;

  // Gerente: elige entre todas las sedes. Administrador: fija, la suya.
  const { branches } = useBranches(isHydrated && isGerente);
  const { branch: myBranch } = useMyBranch(isHydrated && isAdmin);

  const [selectedBranchId, setSelectedBranchId, branchReady] = useRememberedUiState<number | null>("reviews", "branch", null);
  const [confirmDelete, setConfirmDelete] = useState<Review | null>(null);
  const [selected, setSelected] = useState<CombinedReview | null>(null);
  const [notify, setNotify] = useState<NotifyState>(null);

  useEffect(() => {
    if (!branchReady) return;
    if (isAdmin && myBranch) {
      if (selectedBranchId !== myBranch.id) setSelectedBranchId(myBranch.id);
    } else if (isGerente && branches.length > 0 &&
      (selectedBranchId == null || !branches.some((branch) => branch.id === selectedBranchId))) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branchReady, isAdmin, myBranch, isGerente, branches, selectedBranchId]);

  const { combined, stats, loading, error, deletingId, removeReview } =
    useBranchReviews(selectedBranchId);

  if (!isHydrated) return null;

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await removeReview(confirmDelete.id);
      setNotify({ message: translateCopy("Reseña eliminada correctamente"), type: "success" });
    } catch (err) {
      setNotify({
        message:
          err instanceof Error ? translateCopy(err.message) : translateCopy("No se pudo eliminar la reseña"),
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
            {t("pageTitles.reviews")}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
               {translateCopy("Calificaciones y comentarios de clientes sobre pedidos.")} </p>
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
               {translateCopy("Calificación promedio")} </p>
            <p className="text-3xl font-black text-[#111827] mt-1">
              {fmt(stats.average)} <span className="text-yellow-400">★</span>
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
               {translateCopy("Pedido · Repartidor")} </p>
            <p className="text-3xl font-black text-[#111827] mt-1">
              {fmt(stats.orderAverage)}{" "}
              <span className="text-gray-300 font-normal">·</span>{" "}
              {fmt(stats.deliveryAverage)}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
               {translateCopy("Total de reseñas")} </p>
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
            <div className="p-6 text-sm text-red-600">{translateCopy(error)}</div>
          ) : combined.length === 0 ? (
            <div className="p-6 text-center sm:p-16">
              <div className="text-4xl mb-3">⭐</div>
              <p className="text-gray-400 font-medium">
                 {translateCopy("Todavía no hay reseñas para esta sede.")} </p>
            </div>
          ) : (
            <div className="max-h-[60vh] divide-y divide-gray-50 overflow-y-auto [scrollbar-width:thin]">
              {combined.map((item) => (
                <div
                  key={item.orderId}
                  onClick={() => setSelected(item)}
                  className="review-entry p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#111827]">
                        {item.customerName ?? translateCopy("Cliente")}
                      </span>
                      <span className="text-xs text-gray-400">
                        {item.date &&
                          ` · ${new Date(item.date).toLocaleDateString(getCurrentLocale())}`}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                           {translateCopy("Pedido")} </span>
                        {item.review ? (
                          <Stars value={item.review.rating} />
                        ) : (
                          <span className="text-xs text-gray-400">
                             {translateCopy("Sin reseña")} </span>
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
                           {translateCopy("Repartidor")} </span>
                        {item.delivery ? (
                          <>
                            <Stars value={item.delivery.rating} />
                            <span className="text-xs text-gray-500">
                              {item.delivery.deliveryPersonName ?? "—"}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">
                             {translateCopy("Sin calificación")} </span>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(item.review);
                      }}
                      disabled={deletingId === item.review.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                       {translateCopy("Eliminar")} </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog
        isOpen={!!selected}
        title={translateCopy("Pedido")}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                   {translateCopy("Cliente")} </p>
                <p className="text-base font-bold text-[#111827]">
                  {selected.customerName ?? translateCopy("Cliente")}
                </p>
              </div>
              {selected.date && (
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                     {translateCopy("Fecha")} </p>
                  <p className="text-sm text-gray-600">
                    {new Date(selected.date).toLocaleDateString(getCurrentLocale(), {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                 {translateCopy("Reseña del pedido")} </p>
              {selected.review ? (
                <>
                  <BigStars value={selected.review.rating} />
                  <p className="text-sm text-gray-600 mt-3 whitespace-pre-line">
                    {selected.review.comment || translateCopy("Sin comentario.")}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400">
                   {translateCopy("El cliente no dejó reseña del pedido.")} </p>
              )}
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                 {translateCopy("Calificación del repartidor")} </p>
              {selected.delivery ? (
                <>
                  <p className="text-sm font-semibold text-[#111827] mb-1">
                    {selected.delivery.deliveryPersonName ?? "—"}
                  </p>
                  <BigStars value={selected.delivery.rating} />
                  <p className="text-sm text-gray-600 mt-3 whitespace-pre-line">
                    {selected.delivery.comment || translateCopy("Sin comentario.")}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400">
                   {translateCopy("El cliente no calificó al repartidor.")} </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelected(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                 {translateCopy("Cerrar")} </button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        isOpen={!!confirmDelete}
        title={translateCopy("Eliminar Reseña")}
        onClose={() => setConfirmDelete(null)}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-xl flex-shrink-0">
            ⚠️
          </div>
          <p className="text-sm text-gray-600 pt-1.5">
             {translateCopy("¿Seguro que deseas eliminar esta reseña de")}{" "}
            <strong className="text-[#111827]">
              {confirmDelete?.customerName ?? translateCopy("este cliente")}
            </strong>
             {translateCopy("? Esta acción no se puede deshacer.")} </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setConfirmDelete(null)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
             {translateCopy("Cancelar")} </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm"
          >
             {translateCopy("Eliminar")} </button>
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

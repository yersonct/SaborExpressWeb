"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { reviewService } from "../services/review.service";
import type {
  Review,
  BranchReviewSummary,
  DeliveryRating,
  CombinedReview,
} from "../types/review.types";

export function useBranchReviews(branchId: number | null) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<BranchReviewSummary | null>(null);
  const [deliveryRatings, setDeliveryRatings] = useState<DeliveryRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (branchId == null) {
      setReviews([]);
      setSummary(null);
      setDeliveryRatings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    // allSettled: si un endpoint falla (ej. summary para Administrador),
    // los otros se siguen mostrando.
    const [reviewsRes, summaryRes, ratingsRes] = await Promise.allSettled([
      reviewService.getByBranch(branchId),
      reviewService.getBranchSummary(branchId),
      reviewService.getDeliveryRatings(branchId),
    ]);

    setReviews(reviewsRes.status === "fulfilled" ? reviewsRes.value : []);
    setSummary(summaryRes.status === "fulfilled" ? summaryRes.value : null);
    setDeliveryRatings(
      ratingsRes.status === "fulfilled" ? ratingsRes.value : [],
    );

    if (reviewsRes.status === "rejected" && ratingsRes.status === "rejected") {
      const reason = reviewsRes.reason;
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudieron cargar las reseñas",
      );
    }
    setLoading(false);
  }, [branchId]);

  useEffect(() => {
    load();
  }, [load]);

  const removeReview = useCallback(async (id: number) => {
    setDeletingId(id);
    try {
      await reviewService.remove(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  }, []);

  // Une reseña del pedido + calificación del repartidor por orderId
  const combined = useMemo<CombinedReview[]>(() => {
    const map = new Map<number, CombinedReview>();

    reviews.forEach((r) => {
      map.set(r.orderId, {
        orderId: r.orderId,
        customerName: r.customerName,
        date: r.createdAt,
        review: r,
        delivery: null,
      });
    });

    deliveryRatings.forEach((d) => {
      const existing = map.get(d.orderId);
      if (existing) {
        existing.delivery = d;
        existing.customerName = existing.customerName ?? d.customerName;
      } else {
        map.set(d.orderId, {
          orderId: d.orderId,
          customerName: d.customerName,
          date: d.ratedAt,
          review: null,
          delivery: d,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.orderId - a.orderId);
  }, [reviews, deliveryRatings]);

  const stats = useMemo(() => {
    const avg = (nums: number[]) =>
      nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : null;

    const orderRatings = reviews.map((r) => r.rating);
    const deliveryRates = deliveryRatings.map((d) => d.rating);

    return {
      total: combined.length,
      average: avg([...orderRatings, ...deliveryRates]),
      orderAverage: avg(orderRatings),
      deliveryAverage: avg(deliveryRates),
    };
  }, [combined, reviews, deliveryRatings]);

  return {
    combined,
    stats,
    reviews,
    summary,
    deliveryRatings,
    loading,
    error,
    deletingId,
    removeReview,
    reload: load,
  };
}

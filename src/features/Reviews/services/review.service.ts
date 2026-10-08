import { http } from "@/config/api";
import type {
  Review,
  BranchReviewSummary,
  DeliveryRating,
} from "../types/review.types";

export const reviewService = {
  // GET /api/Reviews/branch/{branchId} — Gerente o Administrador (solo su sede)
  getByBranch: async (branchId: number): Promise<Review[]> => {
    const { data } = await http.get<Review[]>(`/Reviews/branch/${branchId}`);
    return data;
  },

  // GET /api/Reviews/branch/{branchId}/summary — HOY solo Gerente
  getBranchSummary: async (branchId: number): Promise<BranchReviewSummary> => {
    const { data } = await http.get<BranchReviewSummary>(
      `/Reviews/branch/${branchId}/summary`,
    );
    return data;
  },

  // GET /api/Deliveries/branch/{branchId} — solo las que ya fueron calificadas
  getDeliveryRatings: async (branchId: number): Promise<DeliveryRating[]> => {
    const { data } = await http.get<any[]>(`/Deliveries/branch/${branchId}`);
    return data
      .filter((d) => d.customerRating != null)
      .map((d) => ({
        deliveryId: d.id,
        orderId: d.orderId,
        customerName: d.customerName ?? null,
        deliveryPersonName: d.deliveryPersonName ?? null,
        rating: d.customerRating,
        comment: d.customerRatingComment ?? null,
        ratedAt: d.deliveredAt ?? d.assignedAt ?? null,
      }));
  },

  // DELETE /api/Reviews/{id}
  remove: async (id: number): Promise<void> => {
    await http.delete(`/Reviews/${id}`);
  },
};

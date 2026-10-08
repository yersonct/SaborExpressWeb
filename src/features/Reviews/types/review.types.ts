export interface Review {
  id: number;
  orderId: number;
  customerId: number;
  customerName: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface BranchReviewSummary {
  branchId: number;
  averageRating: number;
  totalReviews: number;
}
export interface DeliveryRating {
  deliveryId: number;
  orderId: number;
  customerName: string | null;
  deliveryPersonName: string | null;
  rating: number;
  comment: string | null;
  ratedAt: string | null;
}
export interface CombinedReview {
  orderId: number;
  customerName: string | null;
  date: string | null;
  review: Review | null;
  delivery: DeliveryRating | null;
}
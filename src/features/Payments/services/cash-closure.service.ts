import { http } from "@/config/api";

export interface CashClosurePayment {
  paymentId: number;
  orderId: number;
  method: string;
  amount: number;
  paidAtUtc: string;
}

export interface CashClosure {
  id: number;
  scheduleId: number;
  cashierId: number;
  cashierName: string;
  branchId: number;
  branchName: string;
  shiftDate: string;
  shiftStartedAtUtc: string;
  closedAtUtc: string;
  cashExpected: number;
  cashCounted: number;
  cashDifference: number;
  cardTotal: number;
  transferTotal: number;
  wompiTotal: number;
  totalSales: number;
  paymentsCount: number;
  notes: string | null;
  payments: CashClosurePayment[];
  reopenedAtUtc: string | null;
  reopenedByUserId: number | null;
  reopenReason: string | null;
}

export const cashClosureService = {
  async reopen(id: number, reason: string): Promise<CashClosure> {
    const { data } = await http.post<CashClosure>(`/CashClosures/${id}/reopen`, { reason });
    return data;
  },
  async getHistory(params: { branchId?: number; fromDate?: string; toDate?: string }): Promise<CashClosure[]> {
    const { data } = await http.get<CashClosure[]>("/CashClosures", { params });
    return data;
  },
};

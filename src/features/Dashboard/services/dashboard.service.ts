import { orderService } from "@/features/Order/services/order.service";
import {
  OrderStatus,
  OrderDetailStatus,
  type Order,
} from "@/features/Order/types/order.types";
import { paymentService } from "@/features/Payments/services/payment.service";
import {
  PaymentMethod,
  PaymentStatus,
  type Payment,
} from "@/features/Payments/types/payment.types";
import { productService } from "@/features/Products/services/product.service";
import {
  buildDateRange,
  type DateRangeOption,
} from "@/features/Payments/utils/date-ranges";
import {
  addColombiaDays,
  getColombiaDayKey,
  getColombiaDayStartUtc,
} from "@/lib/colombia-date";

export interface HourlyPerformancePoint {
  hour: string;
  total: number;
  isCurrent: boolean;
}

export interface TopProductStat {
  productName: string;
  quantity: number;
  total: number;
}

export interface PaymentMixSlice {
  method: PaymentMethod;
  label: string;
  amount: number;
  percent: number;
}

export interface DespachoRow {
  id: number;
  method: PaymentMethod;
  methodLabel: string;
  amount: number;
  cashierName: string;
  statusLabel: string;
  statusTone: "blue" | "green" | "yellow" | "red";
}

export interface InactiveProductRow {
  id: number;
  name: string;
}

export interface DashboardStats {
  totalSalesInRange: number;
  salesChangePercent: number | null;
  ordersAttendedInRange: number;
  ordersInProgress: number;
  avgPreparationMinutesInRange: number | null;
  avgMinutesDeltaFromPreviousPeriod: number | null;
  hourlyPerformance: HourlyPerformancePoint[];
  topProducts: TopProductStat[];
  kitchen: {
    queued: number;
    inPreparation: number;
    ready: number;
  };
  cashInRegisterInRange: number;
  paymentMix: PaymentMixSlice[];
  recentDespachos: DespachoRow[];
  inactiveProductsCount: number;
  inactiveProducts: InactiveProductRow[];
}

const ACTIVE_STATUSES = [
  OrderStatus.Pending,
  OrderStatus.Confirmed,
  OrderStatus.InPreparation,
  OrderStatus.Ready,
];

function sumTotals(list: Order[]): number {
  return list
    .filter((order) => order.status !== OrderStatus.Cancelled)
    .reduce((total, order) => total + order.total, 0);
}

function avgPreparationMinutes(list: Order[]): number | null {
  const delivered = list.flatMap((order) => {
    if (order.status !== OrderStatus.Delivered || !order.updatedAt) return [];
    const startedAt = new Date(order.createdAt).getTime();
    const deliveredAt = new Date(order.updatedAt).getTime();
    return Number.isFinite(startedAt) &&
      Number.isFinite(deliveredAt) &&
      deliveredAt >= startedAt
      ? [deliveredAt - startedAt]
      : [];
  });
  if (delivered.length === 0) return null;
  const totalMinutes = delivered.reduce((total, duration) => total + duration / 60000, 0);
  return Math.round(totalMinutes / delivered.length);
}

function isInDayRange(order: Order, fromDay: string, toDay: string): boolean {
  const day = getColombiaDayKey(order.createdAt);
  return day !== null && day >= fromDay && day <= toDay;
}

function getTrend(
  orders: Order[],
  range: DateRangeOption,
  fromDay: string,
  toDay: string,
  now: Date,
): HourlyPerformancePoint[] {
  const points: HourlyPerformancePoint[] = [];
  const currentDay = getColombiaDayKey(now);

  if (range === "hoy" || range === "ayer") {
    const dayStart = getColombiaDayStartUtc(fromDay).getTime();
    const currentHourStart =
      Math.floor((now.getTime() - dayStart) / 3600000) * 3600000 + dayStart;

    for (let hour = 0; hour < 24; hour += 1) {
      const bucketStart = dayStart + hour * 3600000;
      const bucketEnd = bucketStart + 3600000;
      const total = orders
        .filter((order) => {
          const createdAt = new Date(order.createdAt).getTime();
          return (
            createdAt >= bucketStart &&
            createdAt < bucketEnd &&
            order.status !== OrderStatus.Cancelled
          );
        })
        .reduce((sum, order) => sum + order.total, 0);

      points.push({
        hour: `${String(hour).padStart(2, "0")}:00`,
        total,
        isCurrent:
          range === "hoy" &&
          currentDay === fromDay &&
          bucketStart === currentHourStart,
      });
    }
    return points;
  }

  const days = range === "semana" ? 7 : 30;
  for (let index = 0; index < days; index += 1) {
    const day = addColombiaDays(fromDay, index);
    if (day > toDay) break;
    const bucketStart = getColombiaDayStartUtc(day).getTime();
    const bucketEnd = getColombiaDayStartUtc(addColombiaDays(day, 1)).getTime();
    const total = orders
      .filter((order) => {
        const createdAt = new Date(order.createdAt).getTime();
        return (
          createdAt >= bucketStart &&
          createdAt < bucketEnd &&
          order.status !== OrderStatus.Cancelled
        );
      })
      .reduce((sum, order) => sum + order.total, 0);

    points.push({
      hour: `${day.slice(8, 10)}/${day.slice(5, 7)}`,
      total,
      isCurrent: day === currentDay,
    });
  }
  return points;
}

export const dashboardService = {
  getStats: async (
    branchId?: number,
    range: DateRangeOption = "hoy",
  ): Promise<DashboardStats> => {
    const selectedRange = buildDateRange(range);
    const fromDay = getColombiaDayKey(selectedRange.fromDate)!;
    const toDay = getColombiaDayKey(selectedRange.toDate)!;
    const periodLength = range === "hoy" || range === "ayer" ? 1 : range === "semana" ? 7 : 30;
    const previousFromDay = addColombiaDays(fromDay, -periodLength);
    const previousToDay = addColombiaDays(fromDay, -1);
    const now = new Date();
    const todayKey = getColombiaDayKey(now)!;

    // Incluye el periodo seleccionado, su periodo anterior y los pedidos de hoy
    // para que la cocina y los pedidos en curso sigan mostrando el estado actual.
    const ordersFromDay = previousFromDay < todayKey ? previousFromDay : todayKey;
    const ordersToDay = toDay > todayKey ? toDay : todayKey;
    const ordersFromDate = getColombiaDayStartUtc(ordersFromDay).toISOString();
    const ordersToDate = new Date(
      getColombiaDayStartUtc(addColombiaDays(ordersToDay, 1)).getTime() - 1,
    ).toISOString();
    const paymentsPromise = paymentService.getAll({
      ...(branchId ? { branchId } : {}),
      fromDate: selectedRange.fromDate,
      toDate: selectedRange.toDate,
    });

    const [orders, payments, products] = await Promise.all([
      orderService.getAll({
        ...(branchId ? { branchId } : {}),
        fromDate: ordersFromDate,
        toDate: ordersToDate,
      }),
      paymentsPromise,
      productService.getAll(branchId),
    ]);

    const ordersInRange = orders.filter((order) =>
      isInDayRange(order, fromDay, toDay),
    );
    const ordersInPreviousPeriod = orders.filter((order) =>
      isInDayRange(order, previousFromDay, previousToDay),
    );
    const ordersToday = orders.filter((order) =>
      isInDayRange(order, todayKey, todayKey),
    );
    const totalSalesInRange = sumTotals(ordersInRange);
    const totalSalesPreviousPeriod = sumTotals(ordersInPreviousPeriod);
    const salesChangePercent =
      totalSalesPreviousPeriod > 0
        ? ((totalSalesInRange - totalSalesPreviousPeriod) /
            totalSalesPreviousPeriod) *
          100
        : null;

    const avgPreparationMinutesInRange = avgPreparationMinutes(ordersInRange);
    const avgPreparationMinutesPreviousPeriod = avgPreparationMinutes(
      ordersInPreviousPeriod,
    );
    const avgMinutesDeltaFromPreviousPeriod =
      avgPreparationMinutesPreviousPeriod !== null &&
      avgPreparationMinutesInRange !== null
        ? avgPreparationMinutesPreviousPeriod - avgPreparationMinutesInRange
        : null;
    const ordersAttendedInRange = ordersInRange.filter(
      (order) => order.status !== OrderStatus.Cancelled,
    ).length;
    const ordersInProgress = ordersToday.filter((order) =>
      ACTIVE_STATUSES.includes(order.status),
    ).length;

    const hourlyPerformance = getTrend(
      ordersInRange,
      range,
      fromDay,
      toDay,
      now,
    );

    const productMap = new Map<string, TopProductStat>();
    ordersInRange.forEach((order) => {
      if (order.status === OrderStatus.Cancelled) return;
      order.orderDetails
        .filter(
          (detail) =>
            detail.status !== OrderDetailStatus.Cancelled &&
            detail.status !== OrderDetailStatus.Voided,
        )
        .forEach((detail) => {
          const current = productMap.get(detail.productName) ?? {
            productName: detail.productName,
            quantity: 0,
            total: 0,
          };
          const quantity = detail.quantity ?? 0;
          const lineTotal = detail.subTotal ?? (detail.unitPrice ?? 0) * quantity;
          current.quantity += quantity;
          current.total += lineTotal;
          productMap.set(detail.productName, current);
        });
    });
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const kitchen = { queued: 0, inPreparation: 0, ready: 0 };
    ordersToday.forEach((order) => {
      order.orderDetails.forEach((detail) => {
        if (detail.status === OrderDetailStatus.Pending) kitchen.queued += 1;
        else if (detail.status === OrderDetailStatus.InPreparation)
          kitchen.inPreparation += 1;
        else if (detail.status === OrderDetailStatus.Ready) kitchen.ready += 1;
      });
    });

    const paymentsInRange = payments.filter(
      (payment: Payment) => payment.status === PaymentStatus.Completed,
    );
    const cashInRegisterInRange = paymentsInRange
      .filter((payment) => payment.method === PaymentMethod.Cash)
      .reduce((total, payment) => total + payment.amount, 0);

    const methodLabels: Record<PaymentMethod, string> = {
      [PaymentMethod.Cash]: "Efectivo",
      [PaymentMethod.Transfer]: "Transferencia",
      [PaymentMethod.Card]: "Datáfono",
      [PaymentMethod.Wompi]: "Wompi",
    };
    const totalPaidInRange = paymentsInRange.reduce(
      (total, payment) => total + payment.amount,
      0,
    );
    const mixMap = new Map<PaymentMethod, number>();
    paymentsInRange.forEach((payment) => {
      mixMap.set(
        payment.method,
        (mixMap.get(payment.method) ?? 0) + payment.amount,
      );
    });
    const paymentMix: PaymentMixSlice[] = Array.from(mixMap.entries())
      .map(([method, amount]) => ({
        method,
        label: methodLabels[method] ?? method,
        amount,
        percent: totalPaidInRange > 0 ? (amount / totalPaidInRange) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const statusLabels: Record<
      PaymentStatus,
      { label: string; tone: DespachoRow["statusTone"] }
    > = {
      [PaymentStatus.Pending]: { label: "Validando Pago...", tone: "yellow" },
      [PaymentStatus.Completed]: { label: "Pago Confirmado", tone: "green" },
      [PaymentStatus.Failed]: { label: "¡Pago Rechazado!", tone: "red" },
      [PaymentStatus.Refunded]: { label: "Reembolsado", tone: "blue" },
    };
    const recentDespachos: DespachoRow[] = payments
      .sort(
        (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
      )
      .map((payment) => {
        const statusInfo = statusLabels[payment.status];
        return {
          id: payment.id,
          method: payment.method,
          methodLabel: methodLabels[payment.method] ?? payment.method,
          amount: payment.amount,
          cashierName: payment.cashierName ?? "Sin asignar",
          statusLabel: statusInfo.label,
          statusTone: statusInfo.tone,
        };
      });

    const inactiveProducts = products
      .filter((product) => !product.status)
      .map((product) => ({ id: product.id, name: product.name }));

    return {
      totalSalesInRange,
      salesChangePercent,
      ordersAttendedInRange,
      ordersInProgress,
      avgPreparationMinutesInRange,
      avgMinutesDeltaFromPreviousPeriod,
      hourlyPerformance,
      topProducts,
      kitchen,
      cashInRegisterInRange,
      paymentMix,
      recentDespachos,
      inactiveProductsCount: inactiveProducts.length,
      inactiveProducts,
    };
  },
};

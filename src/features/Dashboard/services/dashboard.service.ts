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
  totalSalesToday: number;
  totalSalesYesterday: number;
  totalSalesWeek: number;
  salesChangePercent: number | null;
  ordersAttendedToday: number;
  ordersInProgress: number;
  avgPreparationMinutesToday: number;
  avgMinutesDeltaFromYesterday: number; // positivo = hoy fue más rápido
  hourlyPerformance: HourlyPerformancePoint[];
  topProducts: TopProductStat[];
  kitchen: {
    queued: number;
    inPreparation: number;
    ready: number;
  };
  cashInRegisterToday: number;
  paymentMixToday: PaymentMixSlice[];
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

function isSameDay(dateStr: string, reference: Date): boolean {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
  );
}

function startOfDaysAgo(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
}

function sumTotals(list: Order[]): number {
  return list
    .filter((o) => o.status !== OrderStatus.Cancelled)
    .reduce((acc, o) => acc + o.total, 0);
}

function avgPreparationMinutes(list: Order[]): number {
  const delivered = list.filter(
    (o) => o.status === OrderStatus.Delivered && o.updatedAt,
  );
  if (delivered.length === 0) return 0;
  const totalMin = delivered.reduce((acc, o) => {
    const start = new Date(o.createdAt).getTime();
    const end = new Date(o.updatedAt as string).getTime();
    return acc + (end - start) / 60000;
  }, 0);
  return Math.round(totalMin / delivered.length);
}

export const dashboardService = {
  // Trae TODOS los pedidos (opcionalmente de una sede) y arma las métricas
  // del dashboard en el front. No requiere un endpoint "de dashboard" en el backend.
  getStats: async (branchId?: number): Promise<DashboardStats> => {
    const [orders, payments, products] = await Promise.all([
      orderService.getAll(branchId ? { branchId } : undefined),
      paymentService.getAll(branchId ? { branchId } : undefined),
      productService.getAll(),
    ]);

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const weekAgo = startOfDaysAgo(7);

    const ordersToday = orders.filter((o) => isSameDay(o.createdAt, now));
    const ordersYesterday = orders.filter((o) =>
      isSameDay(o.createdAt, yesterday),
    );
    const ordersWeek = orders.filter((o) => new Date(o.createdAt) >= weekAgo);

    const totalSalesToday = sumTotals(ordersToday);
    const totalSalesYesterday = sumTotals(ordersYesterday);
    const totalSalesWeek = sumTotals(ordersWeek);

    const salesChangePercent =
      totalSalesYesterday > 0
        ? ((totalSalesToday - totalSalesYesterday) / totalSalesYesterday) * 100
        : null;

    const ordersAttendedToday = ordersToday.filter(
      (o) => o.status !== OrderStatus.Cancelled,
    ).length;
    const ordersInProgress = ordersToday.filter((o) =>
      ACTIVE_STATUSES.includes(o.status),
    ).length;

    const avgPreparationMinutesToday = avgPreparationMinutes(ordersToday);
    const avgPreparationMinutesYesterday =
      avgPreparationMinutes(ordersYesterday);
    const avgMinutesDeltaFromYesterday =
      avgPreparationMinutesYesterday - avgPreparationMinutesToday;

    // Rendimiento por hora: últimas 6 horas del día actual
    const hourlyPerformance: HourlyPerformancePoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const bucketDate = new Date(now);
      bucketDate.setHours(now.getHours() - i, 0, 0, 0);
      const bucketHour = bucketDate.getHours();

      const total = ordersToday
        .filter((o) => {
          const d = new Date(o.createdAt);
          return (
            d.getHours() === bucketHour && o.status !== OrderStatus.Cancelled
          );
        })
        .reduce((acc, o) => acc + o.total, 0);

      hourlyPerformance.push({
        hour: `${bucketHour.toString().padStart(2, "0")}:00`,
        total,
        isCurrent: i === 0,
      });
    }

    // Top productos vendidos hoy (por cantidad)
    // Top productos vendidos hoy (por cantidad)
    const productMap = new Map<string, TopProductStat>();
    ordersToday.forEach((o) => {
      o.orderDetails
        .filter(
          (d) =>
            d.status !== OrderDetailStatus.Cancelled &&
            d.status !== OrderDetailStatus.Voided,
        )
        .forEach((d) => {
          const current = productMap.get(d.productName) ?? {
            productName: d.productName,
            quantity: 0,
            total: 0,
          };
          const quantity = d.quantity ?? 0;
          const lineTotal = d.subTotal ?? (d.unitPrice ?? 0) * quantity;

          current.quantity += quantity;
          current.total += lineTotal;
          productMap.set(d.productName, current);
        });
    });
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Cocina: estado de las líneas de pedido de hoy
    const kitchen = { queued: 0, inPreparation: 0, ready: 0 };
    ordersToday.forEach((o) => {
      o.orderDetails.forEach((d) => {
        if (d.status === OrderDetailStatus.Pending) kitchen.queued += 1;
        else if (d.status === OrderDetailStatus.InPreparation)
          kitchen.inPreparation += 1;
        else if (d.status === OrderDetailStatus.Ready) kitchen.ready += 1;
      });
    });

    // --- Payments de hoy ---
    const paymentsToday = payments.filter(
      (p: Payment) =>
        isSameDay(p.paidAt, now) && p.status === PaymentStatus.Completed,
    );

    const cashInRegisterToday = paymentsToday
      .filter((p) => p.method === PaymentMethod.Cash)
      .reduce((acc, p) => acc + p.amount, 0);

    const METHOD_LABELS: Record<PaymentMethod, string> = {
      [PaymentMethod.Cash]: "Efectivo",
      [PaymentMethod.Transfer]: "Transferencia",
      [PaymentMethod.Card]: "Datáfono",
      [PaymentMethod.Wompi]: "Wompi",
    };

    const totalPaidToday = paymentsToday.reduce((acc, p) => acc + p.amount, 0);
    const mixMap = new Map<PaymentMethod, number>();
    paymentsToday.forEach((p) => {
      mixMap.set(p.method, (mixMap.get(p.method) ?? 0) + p.amount);
    });
    const paymentMixToday: PaymentMixSlice[] = Array.from(mixMap.entries())
      .map(([method, amount]) => ({
        method,
        label: METHOD_LABELS[method] ?? method,
        amount,
        percent: totalPaidToday > 0 ? (amount / totalPaidToday) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // --- Auditoría de Despachos: últimos pagos de hoy (cualquier estado) ---
    const STATUS_LABELS: Record<
      PaymentStatus,
      { label: string; tone: DespachoRow["statusTone"] }
    > = {
      [PaymentStatus.Pending]: { label: "Validando Pago...", tone: "yellow" },
      [PaymentStatus.Completed]: { label: "Pago Confirmado", tone: "green" },
      [PaymentStatus.Failed]: { label: "¡Pago Rechazado!", tone: "red" },
      [PaymentStatus.Refunded]: { label: "Reembolsado", tone: "blue" },
    };

    const allPaymentsToday = payments.filter((p) => isSameDay(p.paidAt, now));
    const recentDespachos: DespachoRow[] = allPaymentsToday
      .sort(
        (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
      )
      .slice(0, 6)
      .map((p) => {
        const statusInfo = STATUS_LABELS[p.status];
        return {
          id: p.id,
          method: p.method,
          methodLabel: METHOD_LABELS[p.method] ?? p.method,
          amount: p.amount,
          cashierName: p.cashierName ?? "Sin asignar",
          statusLabel: statusInfo.label,
          statusTone: statusInfo.tone,
        };
      });

    // --- Productos desactivados (status = false) ---
    const inactiveProductsList = products.filter((prod) => !prod.status);
    const inactiveProducts: InactiveProductRow[] = inactiveProductsList.map(
      (p) => ({ id: p.id, name: p.name }),
    );

    return {
      totalSalesToday,
      totalSalesYesterday,
      totalSalesWeek,
      salesChangePercent,
      ordersAttendedToday,
      ordersInProgress,
      avgPreparationMinutesToday,
      avgMinutesDeltaFromYesterday,
      hourlyPerformance,
      topProducts,
      kitchen,
      cashInRegisterToday,
      paymentMixToday,
      recentDespachos,
      inactiveProductsCount: inactiveProducts.length,
      inactiveProducts,
    };
  }
};

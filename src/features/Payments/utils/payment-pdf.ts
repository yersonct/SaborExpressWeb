import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Payment } from "../types/payment.types";
import { paymentMethodLabels, paymentStatusLabels } from "./payment-labels";
import {
  summarizeByMethod,
  summarizeByStatus,
  totalConfirmed,
} from "./payment-summary";
import {
  formatColombiaDateTime,
  getColombiaDayKey,
} from "@/lib/colombia-date";
import { getCurrentLocale, translateCopy } from "@/config/copy-translations";
import { formatMoney } from "@/lib/format-money";

const money = (n: number, locale: string) => formatMoney(n, locale);

type Options = {
  payments: Payment[];
  branchName: string;
  rangeLabel: string;
  methodLabel: string;
};

export function openPaymentsPdf({
  payments,
  branchName,
  rangeLabel,
  methodLabel,
}: Options) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  const locale = getCurrentLocale();
  const t = translateCopy;

  // Encabezado
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("SaborExpress", margin, 34);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(t("Auditoría de Caja"), margin, 54);
  doc.text(
    `${t("Generado:")} ${formatColombiaDateTime(new Date(), locale)}`,
    pageW - margin,
    54,
    { align: "right" },
  );

  // Filtros aplicados
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(10);
  doc.text(
    `${t("Sede:")} ${branchName}   |   ${t("Periodo:")} ${rangeLabel}   |   ${t("Método:")} ${methodLabel}`,
    margin,
    92,
  );

  // Total confirmado
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(t("Total confirmado"), margin, 120);
  doc.setFontSize(22);
  doc.setTextColor(17, 24, 39);
  doc.text(money(totalConfirmed(payments), locale), margin, 146);

  // Resumen por método y por estado
  const byMethod = summarizeByMethod(payments);
  const byStatus = summarizeByStatus(payments);

  autoTable(doc, {
    startY: 164,
    margin: { left: margin, right: pageW / 2 + 10 },
    head: [[t("Método"), t("Total")]],
    body: byMethod.map((m) => [t(paymentMethodLabels[m.method]), money(m.total, locale)]),
    theme: "grid",
    headStyles: { fillColor: [17, 24, 39] },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: "right" } },
  });
  const afterMethod = (doc as any).lastAutoTable.finalY as number;

  autoTable(doc, {
    startY: 164,
    margin: { left: pageW / 2 + 10, right: margin },
    head: [[t("Estado"), t("Cantidad")]],
    body: byStatus.map((s) => [t(paymentStatusLabels[s.status]), String(s.count)]),
    theme: "grid",
    headStyles: { fillColor: [17, 24, 39] },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: "right" } },
  });
  const afterStatus = (doc as any).lastAutoTable.finalY as number;

  // Historial
  const sorted = [...payments].sort(
    (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
  );

  autoTable(doc, {
    startY: Math.max(afterMethod, afterStatus) + 24,
    margin: { left: margin, right: margin },
    head: [[t("Fecha"), t("Responsable"), t("Método"), t("Monto"), t("Estado"), t("Motivo")]],
    body: sorted.map((p) => [
      formatColombiaDateTime(p.paidAt, locale, {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      p.cashierName ?? "-",
      t(paymentMethodLabels[p.method]),
      money(p.amount, locale),
      t(paymentStatusLabels[p.status]),
      p.refundReason ?? "",
    ]),
    theme: "striped",
    headStyles: { fillColor: [234, 29, 44] },
    styles: { fontSize: 9 },
    columnStyles: { 3: { halign: "right" } },
    didDrawPage: () => {
      const h = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`${t("Página")} ${doc.getNumberOfPages()}`, pageW - margin, h - 20, {
        align: "right",
      });
    },
  });

  const url = String(doc.output("bloburl"));
  const win = window.open(url, "_blank");
  if (!win) doc.save(`${t("Pagos").toLowerCase()}_${getColombiaDayKey()}.pdf`);
}

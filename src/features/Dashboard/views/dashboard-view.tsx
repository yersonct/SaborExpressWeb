"use client";
import { translateCopy } from "@/config/copy-translations";
import { formatMoney } from "@/lib/format-money";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboardStats } from '@/features/Dashboard/hooks/use-dashboard-stats';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useBranches } from '@/features/branches/hooks/use-branches';
import { useMyBranch } from '@/features/branches/hooks/use-my-branch';
import type { DateRangeOption } from '@/features/Payments/utils/date-ranges';

export const DashboardView = () => {
  const { t } = useTranslation();
  const [filtroActivo, setFiltroActivo] = useState<DateRangeOption>('hoy');

  const { session, isHydrated } = useAuth();
  const isGerente = isHydrated && !!session?.roles.includes("GERENTE");
  const isAdministrador = isHydrated && !!session?.roles.includes("ADMINISTRADOR");

  // Gerente: lista completa de sedes para elegir cuál mirar (o todas).
  // Solo se llama a /Branches si es Gerente — ese endpoint da 403 para Administrador.
  const { branches } = useBranches(isGerente);
  // Administrador: su sede fija, sin selector
  const { branch: myBranch, loading: loadingMyBranch } = useMyBranch(isAdministrador);

  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);

  // En cuanto sabemos cuál es la sede del Administrador, la dejamos fija
  useEffect(() => {
    if (isAdministrador && myBranch) {
      setSelectedBranchId(myBranch.id);
    }
  }, [isAdministrador, myBranch]);

  const { stats, loading } = useDashboardStats(selectedBranchId, filtroActivo);

  const selectedBranchName = isGerente
    ? branches.find((b) => b.id === selectedBranchId)?.name
    : myBranch?.name;

  const ventasMostradas = stats?.totalSalesInRange ?? 0;
  const nombrePeriodo = {
    hoy: translateCopy("Hoy (Turno Actual)"),
    ayer: translateCopy("Ayer"),
    semana: translateCopy("Últimos 7 días"),
    mes: translateCopy("Últimos 30 días"),
  }[filtroActivo];
  const tiempoPromedio = stats?.avgPreparationMinutesInRange ?? null;
  const cambioTiempoPromedio = stats?.avgMinutesDeltaFromPreviousPeriod ?? null;
  const textoRendimiento =
    filtroActivo === "hoy" || filtroActivo === "ayer"
      ? translateCopy("Ventas por hora del día")
      : translateCopy("Ventas por día del periodo");

  const maxHourlyTotal = Math.max(
    1,
    ...(stats?.hourlyPerformance.map((h) => h.total) ?? [1]),
  );
  const hasTrendSales =
    stats?.hourlyPerformance.some((point) => point.total > 0) ?? false;
  return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] tracking-tight">
              {t("pageTitles.dashboard")}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isGerente
                ? selectedBranchId
                  ? translateCopy(`Visión operativa de ${selectedBranchName ?? translateCopy("la sede seleccionada")} en tiempo real.`)
                  : translateCopy("Visión consolidada de todas las sedes en tiempo real.")
                : translateCopy(`Visión operativa de ${selectedBranchName ?? translateCopy("tu sede")} en tiempo real.`)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold px-3 py-1.5 bg-green-100 text-green-700 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
               {translateCopy("Sistema Online")} </div>

            {/* Selector de sede: solo el Gerente puede cambiarlo */}
            {isGerente && (
              <select
                value={selectedBranchId ?? "all"}
                onChange={(e) =>
                  setSelectedBranchId(
                    e.target.value === "all"
                      ? undefined
                      : Number(e.target.value),
                  )
                }
                className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EA1D2C]"
              >
                <option value="all">{translateCopy("Todas las sedes")}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            {/* Administrador: sede fija, sin selector */}
            {isAdministrador && (
              <div className="text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-2">
                <span className="text-gray-400">🏬</span>
                {loadingMyBranch
                  ? translateCopy("Cargando sede...")
                  : (myBranch?.name ?? translateCopy("Sin sede asignada"))}
              </div>
            )}

            <select
              value={filtroActivo}
              onChange={(e) => setFiltroActivo(e.target.value as DateRangeOption)}
              className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EA1D2C]"
            >
              <option value="hoy">{translateCopy("Hoy (Turno Actual)")}</option>
              <option value="ayer">{translateCopy("Ayer")}</option>
              <option value="semana">{translateCopy("Últimos 7 días")}</option>
              <option value="mes">{translateCopy("Últimos 30 días")}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-md hover:shadow-lg transition-all">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                     {translateCopy("Ventas Totales")} </p>
                  <span
                    className="text-gray-300 hover:text-gray-500 cursor-help text-xs"
                    title={translateCopy("Suma de las ventas del periodo seleccionado, sin contar pedidos cancelados. Incluye todos los métodos de pago.")}
                  >
                    ⓘ
                  </span>
                </div>
                <h3 className="text-2xl font-black text-[#111827] mt-1">
                  {loading
                    ? "—"
                    : formatMoney(ventasMostradas)}
                </h3>
                <p className="text-xs text-gray-600 font-medium mt-2">
                  {translateCopy("Periodo seleccionado")}: {nombrePeriodo}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl text-xl">💰</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-md hover:shadow-lg transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                   {translateCopy("Efectivo en Caja")} · {nombrePeriodo} </p>
                <h3 className="text-2xl font-black text-[#111827] mt-1">
                  {loading
                    ? "—"
                    : formatMoney(stats?.cashInRegisterInRange ?? 0)}
                </h3>
                <p className="text-xs text-gray-600 font-medium mt-2 flex items-center gap-1">
                   {translateCopy("Pagos en efectivo confirmados en el periodo")} </p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl text-xl">💵</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-md hover:shadow-lg transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                   {translateCopy("Pedidos Atendidos")} · {nombrePeriodo} </p>
                <h3 className="text-2xl font-black text-[#111827] mt-1">
                  {loading ? "—" : (stats?.ordersAttendedInRange ?? 0)}
                </h3>
                <p className="text-xs text-orange-600 font-medium mt-2 flex items-center gap-1">
                  {loading ? "—" : `${stats?.ordersInProgress ?? 0} ${translateCopy("en proceso ahora")}`}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl text-xl">📋</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-md hover:shadow-lg transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                   {translateCopy("Tiempo Promedio")} · {nombrePeriodo} </p>
                <h3 className="text-2xl font-black text-[#111827] mt-1">
                  {loading
                    ? "—"
                    : tiempoPromedio === null
                      ? "—"
                      : `${tiempoPromedio} min`}
                </h3>
                <p
                  className={`text-xs font-medium mt-2 flex items-center gap-1 ${
                    cambioTiempoPromedio === null
                      ? "text-gray-600"
                      : cambioTiempoPromedio >= 0
                        ? "text-green-600"
                        : "text-red-600"
                  }`}
                >
                  {loading
                    ? "—"
                    : tiempoPromedio === null
                      ? translateCopy("Sin tiempos de entrega registrados en el periodo")
                      : cambioTiempoPromedio === null
                        ? translateCopy("Sin datos del periodo anterior")
                        : `${cambioTiempoPromedio >= 0 ? "↓" : "↑"} ${Math.abs(cambioTiempoPromedio)} min ${translateCopy("vs. periodo anterior")}`}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl text-xl">⏱️</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-md p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-[#111827]">
                   {translateCopy("Rendimiento del Periodo")} </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                   {textoRendimiento} </p>
              </div>
              <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                 {nombrePeriodo} </span>
            </div>
            <div className="mt-2 flex min-h-[320px] flex-1">
              {hasTrendSales ? (
                <div className="flex h-full min-h-[320px] flex-1 items-end gap-1 overflow-x-auto pb-1 [scrollbar-width:thin]">
                  {(stats?.hourlyPerformance ?? []).map((bar, i) => {
                    const heightPct =
                      bar.total > 0
                        ? Math.max(3, (bar.total / maxHourlyTotal) * 100)
                        : 0;
                    const showLabel =
                      filtroActivo !== "mes" ||
                      i % 3 === 0 ||
                      i === (stats?.hourlyPerformance.length ?? 0) - 1;
                    return (
                      <div
                        key={i}
                        className="group flex h-full min-w-6 flex-1 flex-col items-center"
                      >
                        <div className="relative flex w-full flex-1 items-end justify-center border-b border-gray-400/30">
                          {bar.total > 0 && (
                            <div
                              className={`w-full max-w-[40px] rounded-t-md transition-all duration-300 ${bar.isCurrent ? "bg-[#EA1D2C]" : "bg-[#64748B] group-hover:bg-[#94A3B8]"}`}
                              style={{ height: `${heightPct}%` }}
                            />
                          )}
                          <span className="absolute left-1/2 top-2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-[#111827] bg-white border border-gray-200 px-2 py-1 rounded shadow-lg z-10">
                            {formatMoney(bar.total)}
                          </span>
                        </div>
                        <span
                          className={`mt-2 h-4 whitespace-nowrap text-[10px] font-medium ${bar.isCurrent ? "text-[#EA1D2C]" : "text-gray-700"}`}
                        >
                          {showLabel ? bar.hour : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-[320px] flex-1 items-center justify-center rounded-xl bg-gray-50/60">
                  <p className="text-sm text-gray-600">
                    {loading
                      ? translateCopy("Cargando datos...")
                      : translateCopy("Aún no hay ventas registradas en el periodo.")}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6">
              <div className="mb-5">
                <h2 className="text-base font-bold text-[#111827]">
                   {translateCopy("Mix de Ingresos")} </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                   {translateCopy("Qué porcentaje de los pagos del periodo corresponde a cada método")} </p>
              </div>
              <div className="space-y-4">
                {(stats?.paymentMix.length ?? 0) === 0 && (
                  <p className="text-sm text-gray-600">
                     {translateCopy("Aún no hay pagos confirmados en el periodo.")} </p>
                )}
                {stats?.paymentMix.map((slice) => {
                  const barColor =
                    slice.method === "Transfer"
                      ? "bg-blue-500"
                      : slice.method === "Cash"
                        ? "bg-green-500"
                        : slice.method === "Card"
                          ? "bg-purple-500"
                          : "bg-yellow-500";
                  return (
                    <div key={slice.method}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-medium text-gray-600">
                          {translateCopy(slice.label)}
                        </span>
                        <span className="font-bold">
                          {slice.percent.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`${barColor} h-1.5 rounded-full`}
                          style={{ width: `${slice.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 flex-1">
              <div className="mb-4">
                <h2 className="text-base font-bold text-[#111827]">
                   {translateCopy("Top Ventas del Periodo")} · {nombrePeriodo} </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                   {translateCopy("Los productos más vendidos en el periodo, ordenados por cantidad")} </p>
              </div>
              <div className="space-y-3">
                {(stats?.topProducts.length ?? 0) === 0 && (
                  <p className="text-sm text-gray-600">
                     {translateCopy("Aún no hay ventas registradas en el periodo.")} </p>
                )}
                {stats?.topProducts.slice(0, 4).map((product, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-gray-300 bg-gray-50 p-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center text-xs">
                        🍽️
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#111827]">
                          {product.productName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {product.quantity}  {translateCopy("uds vendidas")} </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      +{formatMoney(product.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-200 bg-white flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-[#111827]">
                   {translateCopy("Auditoría de Despachos")} </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                   {translateCopy("Historial de pagos del periodo: quién los cobró y si quedaron confirmados en el sistema")} </p>
              </div>
              <button className="text-sm font-medium text-[#EA1D2C] hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                 {translateCopy("Ver historial")} </button>
            </div>
            <div className="max-h-[420px] overflow-auto [scrollbar-width:thin]">
              <table className="w-full min-w-[620px] text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-white shadow-sm">
                  <tr className="bg-gray-50 text-xs text-gray-700 uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">{translateCopy("Tipo de Pago")}</th>
                    <th className="px-5 py-3 font-semibold">{translateCopy("Valor Total")}</th>
                    <th className="px-5 py-3 font-semibold">{translateCopy("Responsable")}</th>
                    <th className="px-5 py-3 font-semibold text-right">
                       {translateCopy("Estado de Ingreso")} </th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-200">
                  {(stats?.recentDespachos.length ?? 0) === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-8 text-center text-gray-600"
                      >
                         {translateCopy("Aún no hay pagos registrados en el periodo.")} </td>
                    </tr>
                  )}
                  {stats?.recentDespachos.map((row) => {
                    const dotColor =
                      row.method === "Transfer"
                        ? "bg-blue-500"
                        : row.method === "Cash"
                          ? "bg-green-500"
                          : row.method === "Card"
                            ? "bg-purple-500"
                            : "bg-yellow-500";
                    const badgeClasses =
                      row.statusTone === "green"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : row.statusTone === "blue"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : row.statusTone === "yellow"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-red-100 text-red-700 border-red-200 animate-pulse";
                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <span className="text-gray-700 font-medium flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${dotColor}`}
                            ></span>{" "}
                            {translateCopy(row.methodLabel)}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-gray-900">
                          {formatMoney(row.amount)}
                        </td>
                        <td className="px-5 py-4 text-gray-600 text-xs">
                          {row.cashierName}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${badgeClasses}`}
                          >
                            {translateCopy(row.statusLabel)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6 flex flex-col">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden">
              <div className="bg-red-50 px-5 py-3 border-b border-red-100">
                <div>
                  <h3 className="font-bold text-red-800 text-sm flex items-center gap-2">
                    <span className="relative flex h-3 w-3">...</span>
                     {translateCopy("Requiere Atención (")}{stats?.inactiveProductsCount ?? 0})
                  </h3>
                  <p className="text-[11px] text-red-600/70 mt-0.5 ml-5">
                     {translateCopy("Productos desactivados que no se pueden vender hoy")} </p>
                </div>
              </div>
              <div className="p-2 space-y-2 bg-gray-50/50">
                {(stats?.inactiveProductsCount ?? 0) === 0 && (
                  <p className="text-xs text-gray-600 p-3">
                     {translateCopy("Todos los productos están activos ✅")} </p>
                )}
                {stats?.inactiveProducts.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="bg-white p-3 rounded-xl border border-orange-200 shadow-sm hover:border-orange-300 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-[#111827]">
                        {p.name}
                      </p>
                      <span className="text-xs font-bold text-orange-600">
                         {translateCopy("Desactivado")} </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                       {translateCopy("No aparece en la carta digital ni se puede vender.")} </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111827] rounded-2xl p-6 shadow-sm text-white flex-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gray-800 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
              <div className="mb-4 relative z-10">
                <h3 className="font-bold text-sm text-gray-200 flex items-center gap-2">
                   {translateCopy("🔥 Operación Cocina")} </h3>
                <p className="text-[11px] text-gray-300 mt-0.5">
                   {translateCopy("Estado en vivo de los pedidos que están en cocina")} </p>
              </div>
              <div className="space-y-4 relative z-10">
                {(() => {
                  const kitchen = stats?.kitchen ?? {
                    queued: 0,
                    inPreparation: 0,
                    ready: 0,
                  };
                  const total = Math.max(
                    1,
                    kitchen.queued + kitchen.inPreparation + kitchen.ready,
                  );
                  return (
                    <>
                      <div>
                        <div className="flex justify-between text-xs mb-1.5 text-gray-300">
                          <span>{translateCopy("En Fila (Por iniciar)")}</span>
                          <span className="font-bold text-white">
                            {kitchen.queued}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-gray-400 h-1.5 rounded-full"
                            style={{
                              width: `${(kitchen.queued / total) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1.5 text-gray-300">
                          <span>{translateCopy("En Preparación")}</span>
                          <span className="font-bold text-white">
                            {kitchen.inPreparation}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-orange-500 h-1.5 rounded-full"
                            style={{
                              width: `${(kitchen.inPreparation / total) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1.5 text-gray-300">
                          <span>{translateCopy("Listos (Por Despachar)")}</span>
                          <span className="font-bold text-white">
                            {kitchen.ready}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-green-500 h-1.5 rounded-full"
                            style={{
                              width: `${(kitchen.ready / total) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

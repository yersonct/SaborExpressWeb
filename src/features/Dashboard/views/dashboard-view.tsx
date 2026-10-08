"use client";
import { StatCard } from '@/components/ui/stat-card';
import { useEffect, useState } from 'react';
import { useDashboardStats } from '@/features/Dashboard/hooks/use-dashboard-stats';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useBranches } from '@/features/branches/hooks/use-branches';
import { useMyBranch } from '@/features/branches/hooks/use-my-branch';

export const DashboardView = () => {
  const [filtroActivo, setFiltroActivo] = useState('hoy');

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

  const { stats, loading } = useDashboardStats(selectedBranchId);

  const selectedBranchName = isGerente
    ? branches.find((b) => b.id === selectedBranchId)?.name
    : myBranch?.name;

  const ventasMostradas =
    filtroActivo === 'hoy'
      ? stats?.totalSalesToday ?? 0
      : filtroActivo === 'ayer'
      ? stats?.totalSalesYesterday ?? 0
      : stats?.totalSalesWeek ?? 0;

  const maxHourlyTotal = Math.max(
    1,
    ...(stats?.hourlyPerformance.map((h) => h.total) ?? [1]),
  );
  return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] tracking-tight">
              Panel de Control
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isGerente
                ? selectedBranchId
                  ? `Visión operativa de ${selectedBranchName ?? "la sede seleccionada"} en tiempo real.`
                  : "Visión consolidada de todas las sedes en tiempo real."
                : `Visión operativa de ${selectedBranchName ?? "tu sede"} en tiempo real.`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold px-3 py-1.5 bg-green-100 text-green-700 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Sistema Online
            </div>

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
                <option value="all">Todas las sedes</option>
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
                  ? "Cargando sede..."
                  : (myBranch?.name ?? "Sin sede asignada")}
              </div>
            )}

            <select
              value={filtroActivo}
              onChange={(e) => setFiltroActivo(e.target.value)}
              className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EA1D2C]"
            >
              <option value="hoy">Hoy (Turno Actual)</option>
              <option value="ayer">Ayer</option>
              <option value="semana">Últimos 7 días</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Ventas Totales
                  </p>
                  <span
                    className="text-gray-300 hover:text-gray-500 cursor-help text-xs"
                    title="Suma de todos los pedidos facturados hoy (sin contar los cancelados). Incluye todos los métodos de pago."
                  >
                    ⓘ
                  </span>
                </div>
                <h3 className="text-2xl font-black text-[#111827] mt-1">
                  {loading
                    ? "—"
                    : `$${ventasMostradas.toLocaleString("es-CO")}`}
                </h3>
                <p className="text-xs font-medium mt-2 flex items-center gap-1">
                  {/* ... */}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl text-xl">💰</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Efectivo en Caja
                </p>
                <h3 className="text-2xl font-black text-[#111827] mt-1">
                  {loading
                    ? "—"
                    : `$${(stats?.cashInRegisterToday ?? 0).toLocaleString("es-CO")}`}
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-2 flex items-center gap-1">
                  Solo pagos en efectivo confirmados hoy
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl text-xl">💵</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Pedidos Atendidos
                </p>
                <h3 className="text-2xl font-black text-[#111827] mt-1">
                  {loading ? "—" : (stats?.ordersAttendedToday ?? 0)}
                </h3>
                <p className="text-xs text-orange-600 font-medium mt-2 flex items-center gap-1">
                  {loading ? "—" : `${stats?.ordersInProgress ?? 0} en proceso`}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl text-xl">📋</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Tiempo Promedio
                </p>
                <h3 className="text-2xl font-black text-[#111827] mt-1">
                  {loading
                    ? "—"
                    : `${stats?.avgPreparationMinutesToday ?? 0} min`}
                </h3>
                <p
                  className={`text-xs font-medium mt-2 flex items-center gap-1 ${
                    (stats?.avgMinutesDeltaFromYesterday ?? 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {stats
                    ? `${stats.avgMinutesDeltaFromYesterday >= 0 ? "↓" : "↑"} ${Math.abs(stats.avgMinutesDeltaFromYesterday)} min`
                    : "—"}{" "}
                  <span className="text-gray-400 font-normal">vs ayer</span>
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl text-xl">⏱️</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-[#111827]">
                  Rendimiento por Hora
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Ventas generadas en cada hora del turno actual
                </p>
              </div>
              <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                Últimas 6h
              </span>
            </div>
            <div className="flex items-end flex-1 gap-2 mt-2">
              {(stats?.hourlyPerformance ?? []).map((bar, i) => {
                const heightPct = Math.max(
                  5,
                  (bar.total / maxHourlyTotal) * 100,
                );
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center flex-1 group"
                  >
                    <div className="w-full relative flex justify-center h-48 items-end">
                      <div
                        className={`w-full max-w-[40px] rounded-t-md transition-all duration-300 ${bar.isCurrent ? "bg-[#EA1D2C]" : "bg-gray-200 group-hover:bg-gray-300"}`}
                        style={{ height: `${heightPct}%` }}
                      ></div>
                      <span className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-[#111827] bg-white border border-gray-200 px-2 py-1 rounded shadow-lg z-10">
                        ${bar.total.toLocaleString("es-CO")}
                      </span>
                    </div>
                    <span
                      className={`text-xs mt-3 font-medium ${bar.isCurrent ? "text-[#EA1D2C]" : "text-gray-500"}`}
                    >
                      {bar.hour}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
              <div className="mb-5">
                <h2 className="text-base font-bold text-[#111827]">
                  Mix de Ingresos
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Qué porcentaje de las ventas de hoy vino de cada método de
                  pago
                </p>
              </div>
              <div className="space-y-4">
                {(stats?.paymentMixToday.length ?? 0) === 0 && (
                  <p className="text-sm text-gray-400">
                    Aún no hay pagos confirmados hoy.
                  </p>
                )}
                {stats?.paymentMixToday.map((slice) => {
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
                          {slice.label}
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

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex-1">
              <div className="mb-4">
                <h2 className="text-base font-bold text-[#111827]">
                  Top Ventas Hoy
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Los productos más vendidos del día, ordenados por cantidad
                </p>
              </div>
              <div className="space-y-3">
                {(stats?.topProducts.length ?? 0) === 0 && (
                  <p className="text-sm text-gray-400">
                    Aún no hay ventas registradas hoy.
                  </p>
                )}
                {stats?.topProducts.slice(0, 4).map((product, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center text-xs">
                        🍽️
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#111827]">
                          {product.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.quantity} uds vendidas
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      +${product.total.toLocaleString("es-CO")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 bg-white flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-[#111827]">
                  Auditoría de Despachos
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Historial de pagos de hoy: quién los cobró y si ya quedaron
                  confirmados en el sistema
                </p>
              </div>
              <button className="text-sm font-medium text-[#EA1D2C] hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                Ver historial
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">Tipo de Pago</th>
                    <th className="px-5 py-3 font-semibold">Valor Total</th>
                    <th className="px-5 py-3 font-semibold">Responsable</th>
                    <th className="px-5 py-3 font-semibold text-right">
                      Estado de Ingreso
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {(stats?.recentDespachos.length ?? 0) === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-8 text-center text-gray-400"
                      >
                        Aún no hay pagos registrados hoy.
                      </td>
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
                            {row.methodLabel}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-gray-900">
                          ${row.amount.toLocaleString("es-CO")}
                        </td>
                        <td className="px-5 py-4 text-gray-600 text-xs">
                          {row.cashierName}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${badgeClasses}`}
                          >
                            {row.statusLabel}
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
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-red-50 px-5 py-3 border-b border-red-100">
                <div>
                  <h3 className="font-bold text-red-800 text-sm flex items-center gap-2">
                    <span className="relative flex h-3 w-3">...</span>
                    Requiere Atención ({stats?.inactiveProductsCount ?? 0})
                  </h3>
                  <p className="text-[11px] text-red-600/70 mt-0.5 ml-5">
                    Productos desactivados que no se pueden vender hoy
                  </p>
                </div>
              </div>
              <div className="p-2 space-y-2 bg-gray-50/50">
                {(stats?.inactiveProductsCount ?? 0) === 0 && (
                  <p className="text-xs text-gray-400 p-3">
                    Todos los productos están activos ✅
                  </p>
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
                        Desactivado
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      No aparece en la carta digital ni se puede vender.
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111827] rounded-2xl p-6 shadow-sm text-white flex-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gray-800 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
              <div className="mb-4 relative z-10">
                <h3 className="font-bold text-sm text-gray-200 flex items-center gap-2">
                  🔥 Operación Cocina
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Estado en vivo de los pedidos que están en cocina
                </p>
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
                          <span>En Fila (Por iniciar)</span>
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
                          <span>En Preparación</span>
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
                          <span>Listos (Por Despachar)</span>
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
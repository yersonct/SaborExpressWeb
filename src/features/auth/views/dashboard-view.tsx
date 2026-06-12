"use client";
import { MainLayout } from '@/components/layout/main-layout';
import { StatCard } from '@/components/ui/stat-card';
import { useState } from 'react';
export const DashboardView = () => {
  const [filtroActivo, setFiltroActivo] = useState('hoy');
  return (
    <MainLayout>
      <div className="space-y-6">

        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Panel de Control</h1>
            <p className="text-sm text-gray-500 mt-1">Visión general de operaciones, finanzas y logística en tiempo real.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold px-3 py-1.5 bg-green-100 text-green-700 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Sistema Online
            </div>
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
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ventas Totales</p>

                {/* Mostramos un valor diferente dependiendo del selector */}
                {filtroActivo === 'hoy' && <h3 className="text-2xl font-black text-[#111827] mt-1">$1.250.000</h3>}
                {filtroActivo === 'ayer' && <h3 className="text-2xl font-black text-[#111827] mt-1">$980.000</h3>}
                {filtroActivo === 'semana' && <h3 className="text-2xl font-black text-[#111827] mt-1">$8.450.000</h3>}

                <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                  ↑ 12.5% <span className="text-gray-400 font-normal">vs periodo anterior</span>
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl text-xl">💰</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Efectivo en Caja</p>
                <h3 className="text-2xl font-black text-[#111827] mt-1">$450.000</h3>
                <p className="text-xs text-gray-500 font-medium mt-2 flex items-center gap-1">
                  Cierre proyectado: $600k
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl text-xl">💵</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pedidos Atendidos</p>
                <h3 className="text-2xl font-black text-[#111827] mt-1">48</h3>
                <p className="text-xs text-orange-600 font-medium mt-2 flex items-center gap-1">
                  12 en proceso
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl text-xl">📋</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tiempo Promedio</p>
                <h3 className="text-2xl font-black text-[#111827] mt-1">14 min</h3>
                <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                  ↓ 2 min <span className="text-gray-400 font-normal">mejor que ayer</span>
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl text-xl">⏱️</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-bold text-[#111827]">Rendimiento por Hora</h2>
              <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Últimas 6h</span>
            </div>
            <div className="flex items-end flex-1 gap-2 mt-2">
              {[
                { time: '12:00', val: 30, amount: '120k' },
                { time: '13:00', val: 45, amount: '180k' },
                { time: '14:00', val: 85, amount: '340k', active: true },
                { time: '15:00', val: 60, amount: '240k' },
                { time: '16:00', val: 40, amount: '160k' },
                { time: '17:00', val: 75, amount: '300k' }
              ].map((bar, i) => (
                <div key={i} className="flex flex-col items-center flex-1 group">
                  <div className="w-full relative flex justify-center h-48 items-end">
                    <div className={`w-full max-w-[40px] rounded-t-md transition-all duration-300 ${bar.active ? 'bg-[#EA1D2C]' : 'bg-gray-200 group-hover:bg-gray-300'}`} style={{ height: `${bar.val}%` }}></div>
                    <span className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-[#111827] bg-white border border-gray-200 px-2 py-1 rounded shadow-lg z-10">${bar.amount}</span>
                  </div>
                  <span className={`text-xs mt-3 font-medium ${bar.active ? 'text-[#EA1D2C]' : 'text-gray-500'}`}>{bar.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
              <h2 className="text-base font-bold text-[#111827] mb-5">Mix de Ingresos</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5"><span className="font-medium text-gray-600">Transferencia</span><span className="font-bold">44%</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '44%' }}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5"><span className="font-medium text-gray-600">Efectivo</span><span className="font-bold">36%</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full" style={{ width: '36%' }}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5"><span className="font-medium text-gray-600">Datafono</span><span className="font-bold">20%</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '20%' }}></div></div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex-1">
              <h2 className="text-base font-bold text-[#111827] mb-4">Top Ventas Hoy</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center text-xs">🥟</div>
                    <div>
                      <p className="text-sm font-bold text-[#111827]">Empanadas Carne</p>
                      <p className="text-xs text-gray-500">124 uds vendidas</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-600">+$310k</span>
                </div>
                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-yellow-100 flex items-center justify-center text-xs">🧀</div>
                    <div>
                      <p className="text-sm font-bold text-[#111827]">Aborrajados</p>
                      <p className="text-xs text-gray-500">85 uds vendidas</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-600">+$255k</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 bg-white flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-[#111827]">Auditoría de Despachos</h2>
                <p className="text-xs text-gray-500 mt-0.5">Control de ingresos por pedido</p>
              </div>
              <button className="text-sm font-medium text-[#EA1D2C] hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition-colors">Ver historial</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">Tipo de Pago</th>
                    <th className="px-5 py-3 font-semibold">Valor Total</th>
                    <th className="px-5 py-3 font-semibold">Responsable</th>
                    <th className="px-5 py-3 font-semibold text-right">Estado de Ingreso</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4"><span className="text-gray-700 font-medium flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Transferencia App</span></td>
                    <td className="px-5 py-4 font-semibold text-gray-900">$42.000</td>
                    <td className="px-5 py-4 text-gray-600 text-xs">Carlos (Rep)</td>
                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Pago Confirmado
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4"><span className="text-gray-700 font-medium flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> Efectivo</span></td>
                    <td className="px-5 py-4 font-semibold text-gray-900">$28.000</td>
                    <td className="px-5 py-4 text-gray-600 text-xs">Ana (Caja)</td>
                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                        Ingresado a Caja
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4"><span className="text-gray-700 font-medium flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Transf. a Repartidor</span></td>
                    <td className="px-5 py-4 font-semibold text-gray-900">$35.000</td>
                    <td className="px-5 py-4 text-gray-600 text-xs">Miguel (Rep)</td>
                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
                        Validando Pago...
                      </span>
                    </td>
                  </tr>

                  <tr className="bg-red-50/40 hover:bg-red-50/60 transition-colors">
                    <td className="px-5 py-4"><span className="text-gray-700 font-medium flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> Efectivo</span></td>
                    <td className="px-5 py-4 font-bold text-red-600">$23.600</td>
                    <td className="px-5 py-4 text-gray-600 text-xs">Ana (Caja)</td>
                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                        ¡Efectivo Pendiente!
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6 flex flex-col">

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-red-50 px-5 py-3 border-b border-red-100">
                <h3 className="font-bold text-red-800 text-sm flex items-center gap-2">
                  <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
                  Requiere Atención (2)
                </h3>
              </div>
              <div className="p-2 space-y-2 bg-gray-50/50">
                <div className="bg-white p-3 rounded-xl border border-red-100 shadow-sm hover:border-red-300 cursor-pointer transition-colors">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-[#111827]">Descuadre en Caja</p>
                    <span className="text-xs font-bold text-red-600">-$23.600</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Pedido #ORD-105 despachado sin registro de ingreso de efectivo.</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-orange-200 shadow-sm hover:border-orange-300 cursor-pointer transition-colors">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-[#111827]">Inventario Crítico</p>
                    <span className="text-xs font-bold text-orange-600">8 uds</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Empanadas por debajo del stock mínimo de seguridad.</p>
                </div>
              </div>
            </div>

            <div className="bg-[#111827] rounded-2xl p-6 shadow-sm text-white flex-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gray-800 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
              <h3 className="font-bold text-sm text-gray-200 mb-4 flex items-center gap-2 relative z-10">
                🔥 Operación Cocina
              </h3>
              <div className="space-y-4 relative z-10">
                <div>
                  <div className="flex justify-between text-xs mb-1.5 text-gray-300"><span>En Fila (Por iniciar)</span><span className="font-bold text-white">5</span></div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5"><div className="bg-gray-400 h-1.5 rounded-full" style={{ width: '30%' }}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5 text-gray-300"><span>En Preparación</span><span className="font-bold text-white">12</span></div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5"><div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '70%' }}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5 text-gray-300"><span>Listos (Por Despachar)</span><span className="font-bold text-white">3</span></div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full" style={{ width: '20%' }}></div></div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </MainLayout>
  );
};
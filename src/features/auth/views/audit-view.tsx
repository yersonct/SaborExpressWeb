"use client";

import { MainLayout } from '@/components/layout/main-layout';

export const AuditView = () => {
  return (
    <MainLayout>
      <div className="h-full flex flex-col space-y-8 pb-8">
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] tracking-tighter">Auditoría de Caja</h1>
            <p className="text-gray-500 mt-1 font-medium">Conciliación financiera y cierre de turno.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-gray-400">Turno Actual</p>
                <p className="text-sm font-black text-gray-800">Tarde (14:00 - 22:00)</p>
              </div>
              <div className="w-px h-8 bg-gray-200 mx-1"></div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-gray-400">Cajero</p>
                <p className="text-sm font-black text-gray-800">Luis A.</p>
              </div>
            </div>
            <button className="bg-[#111827] hover:bg-gray-800 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm transition-all text-sm">
              Declarar Cierre
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Efectivo Esperado (Sistema)</h3>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg text-lg">💻</span>
            </div>
            <p className="text-3xl font-black text-[#111827]">$450.000</p>
            <p className="text-xs text-gray-500 mt-2 font-medium">Suma de base + cobros en efectivo registrados.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm border-b-4 border-b-orange-400">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Efectivo Físico (Declarado)</h3>
              <span className="p-2 bg-orange-50 text-orange-600 rounded-lg text-lg">💵</span>
            </div>
            <p className="text-3xl font-black text-[#111827]">$426.400</p>
            <p className="text-xs text-orange-600 mt-2 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Pendiente de cuadre final
            </p>
          </div>

          <div className="bg-red-50 rounded-2xl p-6 border border-red-200 shadow-sm border-b-4 border-b-red-500 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-100 rounded-full opacity-50 blur-xl"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-xs font-bold text-red-800 uppercase tracking-wider">Diferencia (Descuadre)</h3>
              <span className="p-2 bg-red-100 text-red-600 rounded-lg text-lg animate-bounce">⚠️</span>
            </div>
            <p className="text-3xl font-black text-red-600 relative z-10">-$23.600</p>
            <p className="text-xs text-red-800 mt-2 font-bold relative z-10">
              Faltante detectado. Revisar transacciones.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
          <div className="bg-[#111827] p-6 text-white md:w-1/3 flex flex-col justify-center">
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
              <span className="text-red-500">🔍</span> Análisis del Sistema
            </h3>
            <p className="text-xs text-gray-400">El sistema ha escaneado los 48 pedidos del turno buscando inconsistencias entre despachos y métodos de pago.</p>
          </div>
          <div className="p-6 md:w-2/3 bg-red-50/30">
            <h4 className="text-sm font-bold text-[#111827] mb-3">Posibles causas del descuadre:</h4>
            <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm flex justify-between items-center hover:border-red-300 transition-colors cursor-pointer">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 font-bold">!</div>
                <div>
                  <p className="text-sm font-bold text-[#111827]">Pedido #ORD-105 Despachado sin Pago</p>
                  <p className="text-xs text-gray-500">El repartidor salió con el pedido (Efectivo) pero el cajero no validó el ingreso.</p>
                </div>
              </div>
              <span className="font-black text-red-600 text-lg">$23.600</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex-1">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-base font-bold text-[#111827]">Historial de Movimientos</h2>
            <div className="flex gap-2">
              <span className="bg-white border border-gray-200 text-xs font-bold text-gray-600 px-3 py-1.5 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50">Solo Efectivo</span>
              <span className="bg-white border border-gray-200 text-xs font-bold text-gray-600 px-3 py-1.5 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50">Transferencias</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-6 py-4 font-bold">Hora</th>
                  <th className="px-6 py-4 font-bold">Referencia</th>
                  <th className="px-6 py-4 font-bold">Concepto / Responsable</th>
                  <th className="px-6 py-4 font-bold">Método</th>
                  <th className="px-6 py-4 font-bold text-right">Ingreso</th>
                  <th className="px-6 py-4 font-bold text-center">Auditoría</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-gray-500">14:45</td>
                  <td className="px-6 py-4 font-black text-[#111827]">#ORD-106</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">Venta Mostrador</p>
                    <p className="text-[10px] text-gray-500 uppercase">Cajero: Luis A.</p>
                  </td>
                  <td className="px-6 py-4"><span className="text-xs font-bold bg-green-50 text-green-700 px-2 py-1 rounded">Efectivo</span></td>
                  <td className="px-6 py-4 font-black text-gray-900 text-right">+$28.000</td>
                  <td className="px-6 py-4 text-center"><span className="text-green-500 font-bold">✓ OK</span></td>
                </tr>

                <tr className="bg-red-50/20 hover:bg-red-50/40 transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-gray-500">14:15</td>
                  <td className="px-6 py-4 font-black text-red-600">#ORD-105</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">Domicilio</p>
                    <p className="text-[10px] text-gray-500 uppercase">Repartidor: Andrés</p>
                  </td>
                  <td className="px-6 py-4"><span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">Efectivo</span></td>
                  <td className="px-6 py-4 font-black text-gray-400 text-right line-through">$23.600</td>
                  <td className="px-6 py-4 text-center">
                    <button className="bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-bold px-3 py-1 rounded-full transition-colors border border-red-200">
                      Reclamar Pago
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-gray-500">13:30</td>
                  <td className="px-6 py-4 font-black text-[#111827]">#ORD-104</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">Domicilio App</p>
                    <p className="text-[10px] text-gray-500 uppercase">Repartidor: Carlos M.</p>
                  </td>
                  <td className="px-6 py-4"><span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded">Transferencia</span></td>
                  <td className="px-6 py-4 font-black text-gray-900 text-right">+$42.000</td>
                  <td className="px-6 py-4 text-center"><span className="text-blue-500 font-bold">✓ Bco.</span></td>
                </tr>

                <tr className="bg-gray-50/80">
                  <td className="px-6 py-4 text-xs font-bold text-gray-500">13:00</td>
                  <td className="px-6 py-4 font-black text-gray-400">SYS-001</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">Apertura Base de Caja</p>
                    <p className="text-[10px] text-gray-500 uppercase">Admin</p>
                  </td>
                  <td className="px-6 py-4"><span className="text-xs font-bold bg-gray-200 text-gray-700 px-2 py-1 rounded">Físico</span></td>
                  <td className="px-6 py-4 font-black text-gray-900 text-right">+$100.000</td>
                  <td className="px-6 py-4 text-center"><span className="text-gray-400 font-bold">-</span></td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>

      </div>
    </MainLayout>
  );
};
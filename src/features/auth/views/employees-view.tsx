"use client";

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';

export const EmployeesView = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <MainLayout>
      <div className="space-y-8 pb-8">
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Gestión de Talento</h1>
            <p className="text-sm text-gray-500 mt-1">Control de accesos internos y aprobación de flota logística.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#111827] hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl shadow-sm transition-all flex items-center gap-2 hover:scale-[1.02]"
          >
            <span className="text-xl">+</span> Nuevo Empleado Interno
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl">👨‍🍳</div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Personal en Turno</p>
              <p className="text-2xl font-black text-[#111827]">4</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-xl">🛵</div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Flota Activa</p>
              <p className="text-2xl font-black text-[#111827]">12</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-orange-200 shadow-sm flex items-center gap-4 bg-orange-50/30">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xl animate-pulse">📄</div>
            <div>
              <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Solicitudes Repartidor</p>
              <p className="text-2xl font-black text-[#111827]">1 <span className="text-sm font-medium text-gray-500">por revisar</span></p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#111827] px-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#EA1D2C]"></span> Equipo Interno
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
              
              <div className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">LA</div>
                  <div>
                    <h4 className="font-bold text-sm text-[#111827]">Luis Alberto</h4>
                    <p className="text-xs text-gray-500">luis.caja@saborexpress.com</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">CAJERO</span>
                  <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Activo ahora
                  </span>
                </div>
              </div>

              <div className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">MR</div>
                  <div>
                    <h4 className="font-bold text-sm text-[#111827]">María Rodríguez</h4>
                    <p className="text-xs text-gray-500">maria.cocina@saborexpress.com</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded">COCINERO</span>
                  <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Activo ahora
                  </span>
                </div>
              </div>

            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span> Validación de Repartidores
              </h2>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-1 rounded">
                1 PENDIENTE
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-5 relative overflow-hidden transition-all hover:border-purple-300">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400"></div>
                
                {/* Cabecera del Expediente */}
                <div className="flex gap-4 items-start mb-4 pl-2">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                      <span className="text-2xl">📸</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-white text-[8px]">✓</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-lg text-[#111827] leading-tight">Andrés Felipe Gómez</h4>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">C.C. 1.075.XXX.XXX</p>
                      </div>
                      <span className="text-[9px] font-black bg-orange-100 text-orange-700 px-2 py-1 rounded border border-orange-200 uppercase tracking-wider">
                        Revisión Requerida
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-3 mb-4 pl-3 ml-2 border border-gray-100">
                  <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Documentación Adjunta</h5>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    <div className="flex items-center gap-2">
                      <span className="text-green-500 text-xs">✓</span>
                      <span className="text-xs font-semibold text-gray-700">Foto de Perfil</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500 text-xs">✓</span>
                      <span className="text-xs font-semibold text-gray-700">Cédula (Frente/Reverso)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500 text-xs">✓</span>
                      <span className="text-xs font-semibold text-gray-700">Licencia de Conducción</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-orange-500 text-xs">!</span>
                      <span className="text-xs font-semibold text-orange-700">Antecedentes (En proceso)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5 pl-2">
                  <div className="bg-white border border-gray-100 p-2.5 rounded-lg shadow-sm">
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Vehículo Registrado</p>
                    <p className="text-xs font-bold text-[#111827]">Moto BWS 125</p>
                    <p className="text-[10px] text-gray-500">Placa: XYZ-123 • SOAT al día</p>
                  </div>
                  <div className="bg-white border border-gray-100 p-2.5 rounded-lg shadow-sm">
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Cuenta de Recaudo</p>
                    <p className="text-xs font-black text-[#EA1D2C]">Nequi</p>
                    <p className="text-[10px] text-gray-500">320 123 4567</p>
                  </div>
                </div>

                <div className="flex gap-2 pl-2 border-t border-gray-100 pt-4">
                  <button className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-[#111827] text-xs font-bold py-2.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5">
                    <span>👁️</span> Ver Expediente PDF
                  </button>
                  <div className="flex-1 flex gap-2">
                    <button className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-sm">
                      Aprobar
                    </button>
                    <button className="flex-1 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 text-xs font-bold py-2.5 rounded-xl transition-colors">
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
              
            </div>
          </div>

        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-gray-100 relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
              <div className="mb-6">
                <h2 className="text-2xl font-black text-[#111827]">Nuevo Empleado</h2>
                <p className="text-xs text-gray-500 mt-1">Crea credenciales para acceso interno.</p>
              </div>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre Completo</label>
                  <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Correo Electrónico (Usuario)</label>
                  <input type="email" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Rol en el Sistema</label>
                  <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827] bg-white">
                    <option>Cajero (Acceso a cobros y auditoría)</option>
                    <option>Cocinero (Acceso KDS y marcar listos)</option>
                    <option>Mesero (Acceso a toma de pedidos)</option>
                  </select>
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-[#111827] hover:bg-gray-800 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-sm">
                    Generar Acceso Interno
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
};
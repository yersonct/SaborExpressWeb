"use client";

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';

export const ConfigView = () => {
  const [activeTab, setActiveTab] = useState('perfil');

  return (
    <MainLayout>
      <div className="flex flex-col h-full space-y-6 max-w-6xl mx-auto pb-10">
        
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Configuración del Sistema</h1>
          <p className="text-gray-500 mt-1">Administra tu perfil, parámetros del restaurante y seguridad de la cuenta.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 pt-2">
          
          <div className="w-full md:w-64 flex-shrink-0">
            <nav className="flex flex-col gap-2">
              <button 
                onClick={() => setActiveTab('perfil')}
                className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'perfil' ? 'bg-[#111827] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                👤 Perfil del Administrador
              </button>
              <button 
                onClick={() => setActiveTab('negocio')}
                className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'negocio' ? 'bg-[#111827] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                🏪 Ajustes del Restaurante
              </button>
              <button 
                onClick={() => setActiveTab('seguridad')}
                className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'seguridad' ? 'bg-[#111827] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                🛡️ Seguridad y Accesos
              </button>
            </nav>
          </div>
          <div className="flex-1">
            
            {activeTab === 'perfil' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 animate-fade-in">
                <h2 className="text-xl font-bold text-[#111827] mb-6">Información Personal</h2>
                
                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                  <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-3xl shadow-inner">
                    👨‍💻
                  </div>
                  <div>
                    <button className="bg-white border border-gray-200 hover:bg-gray-50 text-[#111827] text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition-colors mb-2">
                      Cambiar Avatar
                    </button>
                    <p className="text-[10px] text-gray-400">JPG, GIF o PNG. Max 1MB.</p>
                  </div>
                </div>

                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Nombre Completo</label>
                      <input type="text" defaultValue="Yerson Stiven Cuellar" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827] bg-gray-50" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Rol</label>
                      <input type="text" defaultValue="Administrador General" disabled className="w-full px-4 py-2.5 rounded-xl border border-gray-100 text-sm bg-gray-100 text-gray-500 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Correo Electrónico</label>
                      <input type="email" defaultValue="admin@saborexpress.com" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827] bg-gray-50" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Teléfono de Contacto</label>
                      <input type="tel" defaultValue="+57 320 000 0000" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827] bg-gray-50" />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <button className="bg-[#EA1D2C] hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm">
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'negocio' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 animate-fade-in">
                <h2 className="text-xl font-bold text-[#111827] mb-6">Parámetros Operativos</h2>
                
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Nombre del Establecimiento</label>
                      <input type="text" defaultValue="SaborExpress" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Sede Principal</label>
                      <input type="text" defaultValue="Neiva, Huila" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Costo Base Domicilio ($)</label>
                      <input type="number" defaultValue="4000" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Tiempo Promedio Preparación (Min)</label>
                      <input type="number" defaultValue="15" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-[#111827] text-sm">Estado de la Tienda (Online)</h4>
                      <p className="text-xs text-gray-500 mt-1">Apaga este interruptor para dejar de recibir pedidos temporalmente.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button className="bg-[#111827] hover:bg-gray-800 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm">
                      Actualizar Parámetros
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'seguridad' && (
              <div className="space-y-6 animate-fade-in">
                
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                  <h2 className="text-xl font-bold text-[#111827] mb-6">Actualizar Contraseña</h2>
                  <form className="space-y-4 max-w-md" onSubmit={(e) => e.preventDefault()}>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Contraseña Actual</label>
                      <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Nueva Contraseña</label>
                      <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]" />
                    </div>
                    <div className="pt-2">
                      <button className="bg-white border border-gray-200 hover:bg-gray-50 text-[#111827] font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm">
                        Actualizar
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-red-50/50 rounded-2xl border border-red-100 p-8">
                  <h2 className="text-lg font-bold text-red-800 mb-2">Zona de Control de Sesión</h2>
                  <p className="text-sm text-gray-600 mb-6">Al cerrar sesión requerirás ingresar nuevamente tu correo y contraseña para acceder al panel administrativo.</p>
                  
                  <div className="flex gap-4">
                    <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                      Cerrar Sesión de Forma Segura
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </MainLayout>
  );
};
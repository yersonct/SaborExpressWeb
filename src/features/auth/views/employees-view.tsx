"use client";

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';

// Tipado y simulación de datos de empleados
type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string;
  document: string;
  role: string;
  branch: string;
  status: string;
};

const MOCK_EMPLOYEES: Employee[] = [
  { id: 1, name: 'Luis Alberto', email: 'luis.caja@saborexpress.com', phone: '3001234567', document: '1098765432', role: 'CAJERO', branch: 'Sede Principal Centro', status: 'Activo' },
  { id: 2, name: 'María Rodríguez', email: 'maria.cocina@saborexpress.com', phone: '3159876543', document: '1023456789', role: 'COCINERO', branch: 'Sede Principal Centro', status: 'Activo' },
  { id: 3, name: 'Carlos Gómez', email: 'carlos.domi@saborexpress.com', phone: '3205554433', document: '1055666777', role: 'REPARTIDOR', branch: 'Sede Norte', status: 'Inactivo' },
];

const INITIAL_FORM_STATE = {
  name: '',
  document: '',
  email: '',
  phone: '',
  role: '',
  branch: '',
  address: '', 
  photo: null  
};

export const EmployeesView = () => {
  // Estados para los modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Estado para capturar los datos del NUEVO empleado en tiempo real
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // Estado para guardar el empleado seleccionado para ver/editar
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // --- Funciones manejadoras de botones (CRUD) ---
  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsViewModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    alert(`Abrir formulario de edición para: ${employee.name}`);
  };

  const handleLogicalDelete = (employee: Employee) => {
    const action = employee.status === 'Activo' ? 'suspender' : 'reactivar';
    if (confirm(`¿Estás seguro que deseas ${action} a ${employee.name}? (Eliminado Lógico)`)) {
      alert(`Estado de ${employee.name} actualizado.`);
    }
  };

  const handlePhysicalDelete = (employee: Employee) => {
    if (confirm(`⚠️ ADVERTENCIA: ¿Estás seguro de ELIMINAR PERMANENTEMENTE a ${employee.name}? Esta acción no se puede deshacer.`)) {
      alert(`${employee.name} ha sido eliminado del sistema.`);
    }
  };

  // --- Manejo del Formulario de Creación ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Aquí iría tu lógica de enviar al backend
    alert(`¡Empleado ${formData.name} registrado con éxito!\nSe enviaron las credenciales a: ${formData.email}`);
    
    // 1. Cerramos el modal
    setIsCreateModalOpen(false);
    
    // 2. Limpiamos las letras/datos del formulario para la próxima vez
    setFormData(INITIAL_FORM_STATE);
  };

  return (
    <MainLayout>
      <div className="space-y-8 pb-8">

        {/* CABECERA PRINCIPAL */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Gestión de Talento</h1>
            <p className="text-sm text-gray-500 mt-1">Administración de personal, roles y accesos al sistema.</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#111827] hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl shadow-sm transition-all flex items-center gap-2 hover:scale-[1.02]"
          >
            <span className="text-xl">+</span> Registrar Empleado
          </button>
        </div>

        {/* TARJETAS DE RESUMEN (Kpis) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl">👨‍🍳</div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Personal Activo</p>
              <p className="text-2xl font-black text-[#111827]">24</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-xl">🛵</div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Flota de Repartidores</p>
              <p className="text-2xl font-black text-[#111827]">12</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-orange-200 shadow-sm flex items-center gap-4 bg-orange-50/30">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xl animate-pulse">📄</div>
            <div>
              <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Solicitudes Pendientes</p>
              <p className="text-2xl font-black text-[#111827]">3 <span className="text-sm font-medium text-gray-500">por revisar</span></p>
            </div>
          </div>
        </div>

        {/* LISTA DE EMPLEADOS Y ACCIONES */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-[#111827] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#EA1D2C]"></span> Directorio de Empleados
            </h2>
            <input
              type="text"
              placeholder="Buscar por nombre o cédula..."
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:border-[#111827]"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-100">
                  <th className="p-4 font-bold">Empleado</th>
                  <th className="p-4 font-bold">Contacto</th>
                  <th className="p-4 font-bold">Rol / Sede</th>
                  <th className="p-4 font-bold text-center">Estado</th>
                  <th className="p-4 font-bold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {MOCK_EMPLOYEES.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">

                    {/* INFO BÁSICA */}
                    <td className="p-4">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                          {emp.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#111827]">{emp.name}</h4>
                          <p className="text-xs text-gray-500">CC: {emp.document}</p>
                        </div>
                      </div>
                    </td>

                    {/* CONTACTO */}
                    <td className="p-4">
                      <p className="text-xs text-gray-700">{emp.email}</p>
                      <p className="text-xs text-gray-500">{emp.phone}</p>
                    </td>

                    {/* ROL Y SEDE */}
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded
                        ${emp.role === 'CAJERO' ? 'bg-green-100 text-green-700' :
                          emp.role === 'COCINERO' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'}`}>
                        {emp.role}
                      </span>
                      <p className="text-[10px] text-gray-500 mt-1">{emp.branch}</p>
                    </td>

                    {/* ESTADO */}
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full
                        ${emp.status === 'Activo' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'Activo' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {emp.status}
                      </span>
                    </td>

                    {/* BOTONES DE ACCIÓN (CRUD) */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* 1. Ver (Ojo) */}
                        <button onClick={() => handleView(emp)} title="Ver detalles" className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                        </button>
                        {/* 2. Editar (Lápiz) */}
                        <button onClick={() => handleEdit(emp)} title="Editar" className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600 flex items-center justify-center transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
                        </button>
                        {/* 3. Suspend / Eliminado Lógico (Pausa) */}
                        <button onClick={() => handleLogicalDelete(emp)} title={emp.status === 'Activo' ? 'Suspender' : 'Reactivar'} className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-600 flex items-center justify-center transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                        </button>
                        {/* 4. Eliminar Físico (Basura) */}
                        <button onClick={() => handlePhysicalDelete(emp)} title="Eliminar Permanente" className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: REGISTRAR EMPLEADO (Formulario Controlado) */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-gray-100 relative my-8">
              <button 
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setFormData(INITIAL_FORM_STATE); // También limpiamos si cierra sin guardar
                }} 
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-black text-[#111827]">Registrar Nuevo Empleado</h2>
                <p className="text-xs text-gray-500 mt-1">El sistema enviará un correo con la contraseña temporal.</p>
              </div>

              {/* FORMULARIO CONECTADO A ESTADO (onChange / value) */}
             <form onSubmit={handleCreateSubmit} className="space-y-5">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre Completo *</label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white" 
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Documento de Identidad *</label>
                    <input 
                      type="text" 
                      name="document"
                      value={formData.document}
                      onChange={handleInputChange}
                      required 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white" 
                      placeholder="Ej. 123456789"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Correo Electrónico *</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white" 
                      placeholder="ejemplo@saborexpress.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Teléfono</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white" 
                      placeholder="Ej. 300 123 4567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Cargo / Rol *</label>
                    <select 
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
                    >
                      <option value="" className="text-gray-500">Selecciona un rol...</option>
                      <option value="mesero">Mesero (App Toma Pedidos)</option>
                      <option value="cocinero">Cocinero (Pantalla KDS)</option>
                      <option value="cajero">Cajero (Facturación y Cuadre)</option>
                      <option value="repartidor">Repartidor (App Domicilios)</option>
                      <option value="admin">Administrador de Sede</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Sucursal / Sede *</label>
                    <select 
                      name="branch"
                      value={formData.branch}
                      onChange={handleInputChange}
                      required 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
                    >
                      <option value="" className="text-gray-500">Selecciona una sede...</option>
                      <option value="centro">Sede Principal Centro</option>
                      <option value="norte">Sede Norte</option>
                      <option value="sur">Sede Sur</option>
                    </select>
                  </div>
                </div>

                {/* --- NUEVA FILA: DIRECCIÓN Y FOTO --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Dirección de Residencia *</label>
                    <input 
                      type="text" 
                      name="address"
                      value={formData.address || ''}
                      onChange={handleInputChange}
                      required 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white" 
                      placeholder="Ej. Calle 123 #45-67"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Foto del Empleado *</label>
                    <input 
                      type="file" 
                      name="photo"
                      accept="image/*"
                      required 
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 bg-white
                                 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 
                                 file:text-xs file:font-bold file:bg-[#111827] file:text-white 
                                 hover:file:bg-gray-800 focus:outline-none transition-all cursor-pointer" 
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setFormData(INITIAL_FORM_STATE); // Limpiamos al cancelar
                    }} 
                    className="px-6 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="bg-[#111827] hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors shadow-sm"
                  >
                    Guardar y Generar Acceso
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isViewModalOpen && selectedEmployee && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-gray-100 relative">
              <button onClick={() => setIsViewModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>

              <div className="flex flex-col items-center mb-6 text-center">
                <div className="w-20 h-20 rounded-full bg-[#111827] text-white flex items-center justify-center font-black text-3xl mb-4 shadow-lg">
                  {selectedEmployee.name.substring(0, 2).toUpperCase()}
                </div>
                <h2 className="text-2xl font-black text-[#111827]">{selectedEmployee.name}</h2>
                <p className="text-sm font-bold text-[#EA1D2C] mt-1">{selectedEmployee.role}</p>
                <span className={`mt-3 inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full ${selectedEmployee.status === 'Activo' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {selectedEmployee.status}
                </span>
              </div>

              <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">Documento</span>
                  <span className="text-sm font-semibold text-gray-800">{selectedEmployee.document}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">Teléfono</span>
                  <span className="text-sm font-semibold text-gray-800">{selectedEmployee.phone}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">Correo</span>
                  <span className="text-sm font-semibold text-gray-800">{selectedEmployee.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase">Sede Asignada</span>
                  <span className="text-sm font-semibold text-gray-800">{selectedEmployee.branch}</span>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
};
"use client";

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';

export const ProductsView = () => {
  const [isOpen, setIsOpen] = useState(false);

  const [productos, setProductos] = useState([
    {
      id: 1,
      nombre: 'Empanada de Carne',
      precio: 4000,
      descripcion: 'Masa crocante de maíz rellena con carne premium desmechada y sazón criollo.',
      imagen: '🥟',
      stock: 150,
      active: true
    },
    {
      id: 2,
      nombre: 'Aborrajado Valluno',
      precio: 5000,
      descripcion: 'Plátano maduro a la perfección con corazón de queso doble crema derretido.',
      imagen: '🧀',
      stock: 45,
      active: true
    },
    {
      id: 3,
      nombre: 'Lulada Caleña',
      precio: 7500,
      descripcion: 'Bebida refrescante tradicional con trozos de lulo, limón y hielo triturado.',
      imagen: '🥤',
      stock: 0,
      active: false
    }
  ]);

  const toggleProducto = (id: number) => {
    setProductos(productos.map(p =>
      p.id === id ? { ...p, active: !p.active } : p
    ));
  };
  const eliminarProducto = (id: number, nombre: string) => {
    const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar "${nombre}" definitivamente?`);
    
    if (confirmar) {
      setProductos(productos.filter(p => p.id !== id));
    }
  };
  return (
    <MainLayout>
      <div className="space-y-8">

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Cartelera de Productos</h1>
            <p className="text-sm text-gray-500 mt-1">Gestiona el menú digital, precios y disponibilidad de SaborExpress.</p>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="bg-[#EA1D2C] hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto hover:scale-[1.02]"
          >
            <span className="text-xl">+</span> Crear Producto
          </button>
        </div>

        {isOpen && (
          // {/* ---------------------------- agreggar modal para crear nuevo producto----------------------------- */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">

              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 font-bold text-lg p-2"
              >
                ✕
              </button>
              <div className="mb-6">
                <h2 className="text-2xl font-black text-[#111827]">Nuevo Producto</h2>
                <p className="text-xs text-gray-500 mt-1">Completa los campos para añadir un artículo al menú digital.</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setIsOpen(false); }} className="space-y-5">

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nombre del Producto</label>
                  <input
                    type="text"
                    placeholder="Ej. Empanada de Carne Crujiente"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#EA1D2C] focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Precio de Venta ($)</label>
                    <input
                      type="number"
                      placeholder="Ej. 4000"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#EA1D2C] focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Stock Inicial</label>
                    <input
                      type="number"
                      placeholder="Ej. 50"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#EA1D2C] focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Descripción / Ingredientes</label>
                  <textarea
                    rows={3}
                    placeholder="Describe el producto (ej. carne desmechada, papa tierna, masa de maíz crujiente acompañadas de ají)."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#EA1D2C] focus:border-transparent transition-all resize-none"
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Imagen Ilustrativa</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-[#EA1D2C] transition-colors cursor-pointer group bg-gray-50/50">
                    <input type="file" accept="image/*" className="hidden" id="product-image" />
                    <label htmlFor="product-image" className="cursor-pointer">
                      <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">📸</div>
                      <p className="text-xs font-semibold text-gray-600">Seleccionar archivo de imagen</p>
                      <p className="text-[10px] text-gray-400 mt-1">Formatos recomendados: PNG, JPG (Max. 5MB)</p>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#EA1D2C] hover:bg-red-700 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-sm"
                  >
                    Guardar Producto
                  </button>
                </div>

              </form>
            </div>
          </div>
          // ------------------------------------Donde finaliza el modal-------------------------------------------------
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#111827] tracking-tight px-1">Menú Actual</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {productos.map((producto) => (
              <div
                key={producto.id}
                className={`bg-white rounded-2xl border ${producto.active ? 'border-gray-100' : 'border-red-100 bg-gray-50/50'} overflow-hidden shadow-sm hover:shadow-md transition-all group relative`}
              >

                <div className={`h-40 ${producto.active ? 'bg-gray-100' : 'bg-gray-200 opacity-70'} relative flex items-center justify-center text-gray-400 group-hover:scale-[1.02] transition-transform duration-300`}>
                  <span className="text-4xl">{producto.imagen}</span>

                  {!producto.active && (
                    <div className="absolute top-3 right-3 bg-red-100 text-red-700 text-xs text-[14px] font-bold px-2 py-1 rounded-md border border-red-200">
                      Oculto al usuario
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className={`font-bold text-base ${producto.active ? 'text-gray-900' : 'text-gray-500'}`}>
                      {producto.nombre}
                    </h4>
                    <span className="font-black text-[#111827]">${producto.precio.toLocaleString('es-CO')}</span>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2 h-8 text-[15px]">{producto.descripcion}</p>

                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center mt-2">

                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">📦</span>
                      <div>
                        <p className="text-[18px] text-gray-400 font-bold uppercase">Inventario</p>
                        <p className={`text-[14px] text-xs font-bold ${producto.stock > 10 ? 'text-green-600' : 'text-red-600'}`}>
                          {producto.stock} Unidades
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-gray-500 uppercase">
                        {producto.active ? 'Activo' : 'Inactivo'}
                      </span>
                      <button
                        onClick={() => eliminarProducto(producto.id, producto.nombre)}
                        className="absolute top-3 left-3 bg-white/90 text-gray-400 hover:text-red-600 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-gray-200 transition-all z-10"
                        title="Eliminar producto"
                      >X</button>
                      <button
                        onClick={() => toggleProducto(producto.id)}
                        className={`w-11 h-6 rounded-full flex items-center transition-colors px-1 ${producto.active ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${producto.active ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>

      </div>
    </MainLayout>
  );
};
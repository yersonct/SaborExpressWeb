import React from 'react';

// 1. DATOS DEL MENÚ (Los mismos que tiene el mesero, pero organizados por categorías)
const MENU_CATEGORIES = [
  {
    title: '🍔 Platos Principales',
    items: [
      { id: 'm1', name: 'Hamburguesa Sabor', price: 15000, desc: 'Doble carne de res, queso cheddar fundido, vegetales frescos y salsa de la casa.' },
      { id: 'm2', name: 'Pizza Express', price: 18000, desc: 'Masa artesanal, abundante pepperoni, extra queso mozzarella y orégano.' },
      { id: 'm3', name: 'Papas Francesas', price: 5000, desc: 'Porción grande de papas rústicas crujientes con sal marina.' },
    ]
  },
  {
    title: '🥤 Bebidas y Refrescos',
    items: [
      { id: 'm4', name: 'Gaseosa 500ml', price: 4000, desc: 'Coca-Cola, Sprite, Quatro o Colombiana bien fría.' },
      { id: 'm5', name: 'Jugo Natural', price: 6000, desc: 'Mango, Mora o Lulo. Preparado en agua o en leche.' },
    ]
  }
];

export default function CartaDigital() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      
      {/* HEADER ELEGANTE */}
      <header className="bg-red-600 text-white pt-12 pb-8 px-6 rounded-b-[40px] shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight mb-1">saborEXPRESS</h1>
          <p className="text-red-100 text-sm font-medium uppercase tracking-wider">Menú Digital</p>
        </div>
      </header>

      {/* MENSAJE INFORMATIVO PARA EL CLIENTE */}
      <div className="mx-4 mt-6">
        <div className="bg-amber-100 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
          <span className="text-2xl">👋</span>
          <div>
            <h3 className="text-amber-900 font-bold text-sm">¡Hola! Bienvenido</h3>
            <p className="text-amber-800 text-xs mt-1 leading-relaxed">
              Revisa nuestro delicioso menú. Cuando sepas qué deseas pedir, 
              <span className="font-bold"> indícale tu orden al mesero</span> que te está atendiendo.
            </p>
          </div>
        </div>
      </div>

      {/* LISTA DE CATEGORÍAS Y PRODUCTOS */}
      <main className="px-4 mt-8 space-y-8">
        {MENU_CATEGORIES.map((category, index) => (
          <section key={index}>
            {/* Título de la Categoría */}
            <h2 className="text-xl font-extrabold text-slate-800 mb-4 ml-2 border-b-2 border-slate-200 pb-2">
              {category.title}
            </h2>

            {/* Tarjetas de los Platos */}
            <div className="space-y-4">
              {category.items.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col"
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h3 className="text-lg font-bold text-slate-900 leading-tight flex-1">
                      {item.name}
                    </h3>
                    <span className="bg-red-50 text-red-600 font-bold px-3 py-1 rounded-full text-sm shrink-0">
                      ${item.price.toLocaleString('es-CO')}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* FOOTER */}
      <footer className="mt-12 text-center text-slate-400 text-xs pb-4">
        <p>© {new Date().getFullYear()} saborExpress. Todos los derechos reservados.</p>
        <p className="mt-1">Los precios incluyen impuestos.</p>
      </footer>

    </div>
  );
}
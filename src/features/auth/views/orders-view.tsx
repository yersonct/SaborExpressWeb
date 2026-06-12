import React, { useMemo } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Clock3, ChefHat, Bike, PackageCheck, LucideIcon } from 'lucide-react';


export type OrderStatus = 'PENDIENTE' | 'PREPARANDO' | 'LISTO' | 'EN_RUTA' | 'ENTREGADO';
export type OrderType = 'Mesa' | 'Domicilio';

export interface Order {
  id: string;
  type: OrderType;
  items: string;
  total: number; 
  status: OrderStatus;
  timeAgo: string; 
}

interface ColumnConfig {
  title: string;
  status: OrderStatus;
  icon: LucideIcon;
  color: string;
}


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDIENTE: 'bg-sky-100 text-sky-700 border-sky-200',
  PREPARANDO: 'bg-orange-100 text-orange-700 border-orange-200',
  LISTO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  EN_RUTA: 'bg-violet-100 text-violet-700 border-violet-200',
  ENTREGADO: 'bg-zinc-100 text-zinc-700 border-zinc-200',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDIENTE: 'Pendiente',
  PREPARANDO: 'Preparando',
  LISTO: 'Listo',
  EN_RUTA: 'En Ruta',
  ENTREGADO: 'Entregado',
};

const BOARD_COLUMNS: ColumnConfig[] = [
  { title: 'Nuevos', status: 'PENDIENTE', icon: Clock3, color: 'from-sky-500 to-blue-600' },
  { title: 'Cocina', status: 'PREPARANDO', icon: ChefHat, color: 'from-orange-500 to-amber-500' },
  { title: 'Despacho', status: 'LISTO', icon: PackageCheck, color: 'from-emerald-500 to-green-600' },
  { title: 'En Ruta', status: 'EN_RUTA', icon: Bike, color: 'from-violet-500 to-purple-600' },
];

const MOCK_ORDERS: Order[] = [
  { id: '#ORD-109', type: 'Domicilio', items: '3x Empanadas, 2x Aborrajados', total: 22000, status: 'PENDIENTE', timeAgo: 'Hace 2 min' },
  { id: '#ORD-108', type: 'Domicilio', items: '5x Empanadas, 2x Gaseosas', total: 35000, status: 'PREPARANDO', timeAgo: 'Hace 8 min' },
  { id: '#ORD-107', type: 'Mesa', items: '4x Papas Rellenas', total: 28000, status: 'LISTO', timeAgo: 'Hace 12 min' },
  { id: '#ORD-104', type: 'Domicilio', items: '6x Empanadas', total: 42000, status: 'EN_RUTA', timeAgo: 'Hace 18 min' },
];


export const OrdersView: React.FC = () => {
  const orders = MOCK_ORDERS;

  const ordersByStatus = useMemo(() => {
    return orders.reduce((acc, order) => {
      if (!acc[order.status]) acc[order.status] = [];
      acc[order.status].push(order);
      return acc;
    }, {} as Record<OrderStatus, Order[]>);
  }, [orders]);

  return (
    <MainLayout>
      <main className="flex h-full flex-col gap-8 rounded-[32px] bg-[#f5f7fb] p-6">
        
        <header className="flex items-center justify-between border-b border-zinc-200 pb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-900">
              Centro de Operaciones
            </h1>
            <p className="mt-2 text-zinc-500">
              Monitoreo en tiempo real del flujo de pedidos.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-2 shadow-sm">
            <div className="relative flex h-3 w-3 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">
              Sistema Operativo
            </span>
          </div>
        </header>

        <section className="grid grid-cols-4 gap-4" aria-label="Estadísticas de pedidos">
          <StatCard title="Pedidos activos" value={orders.length} />
          <StatCard title="En cocina" value={ordersByStatus['PREPARANDO']?.length || 0} valueColor="text-orange-500" />
          <StatCard title="En ruta" value={ordersByStatus['EN_RUTA']?.length || 0} valueColor="text-violet-500" />
          <StatCard title="Tiempo promedio" value="18m" valueColor="text-emerald-500" />
        </section>

        <div className="flex gap-6 overflow-x-auto pb-4">
          {BOARD_COLUMNS.map((column) => {
            const columnOrders = ordersByStatus[column.status] || [];

            return (
              <section key={column.status} className="w-[340px] shrink-0" aria-label={`Columna de pedidos ${column.title}`}>
                
                <header className={`mb-4 rounded-2xl bg-gradient-to-r p-[1px] shadow-lg ${column.color}`}>
                  <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <column.icon size={18} className="text-zinc-700" aria-hidden="true" />
                      <div>
                        <h3 className="font-bold text-zinc-900">{column.title}</h3>
                        <p className="text-xs text-zinc-500">{columnOrders.length} pedidos</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700">
                      {columnOrders.length}
                    </span>
                  </div>
                </header>

                <div className="min-h-[500px] space-y-4 rounded-3xl border border-white/50 bg-white/40 p-3 backdrop-blur-sm">
                  {columnOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
                
              </section>
            );
          })}
        </div>
      </main>
    </MainLayout>
  );
};



interface StatCardProps {
  title: string;
  value: string | number;
  valueColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, valueColor = 'text-zinc-900' }) => (
  <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
    <p className="text-sm font-medium text-zinc-500">{title}</p>
    <h2 className={`mt-2 text-3xl font-black ${valueColor}`}>{value}</h2>
  </div>
);

interface OrderCardProps {
  order: Order;
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  return (
    <article 
      className="group relative overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,0.08)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-transparent to-zinc-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <header className="relative mb-5 flex items-start justify-between">
        <div>
          <h4 className="text-[18px] font-black tracking-tight text-zinc-900">
            {order.id}
          </h4>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
            <time className="text-xs font-medium text-zinc-500">
              {order.timeAgo}
            </time>
          </div>
        </div>

        <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-700">
          {order.type}
        </span>
      </header>

      <div className="relative mb-6">
        <p className="text-sm font-medium leading-relaxed text-zinc-600">
          {order.items}
        </p>
      </div>

      <footer className="relative flex items-center justify-between border-t border-zinc-100 pt-4">
        <span
          className={`rounded-full border px-3 py-1.5 text-[11px] font-bold backdrop-blur-sm ${STATUS_STYLES[order.status]}`}
        >
          {STATUS_LABELS[order.status]}
        </span>

        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Total
          </p>
          <span className="text-[22px] font-black tracking-tight text-zinc-900">
            {formatCurrency(order.total)}
          </span>
        </div>
      </footer>
    </article>
  );
};
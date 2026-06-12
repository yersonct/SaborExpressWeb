interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  alert?: boolean; // Propiedad para detectar descuadres
  onClick?: () => void; // ¡NUEVA! Propiedad para accionar el modal al hacer clic
}

export const StatCard = ({ title, value, icon, alert = false, onClick }: StatCardProps) => {
  return (
    <div 
      onClick={onClick}
      className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md ${
        alert ? 'bg-red-50 border-red-200 cursor-pointer hover:border-red-300 hover:scale-[1.02]' : 'bg-white border-[#E5E7EB]'
      } ${onClick && !alert ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    >
      <div>
        <p className={`text-sm font-medium ${alert ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
          {title}
        </p>
        <h3 className={`text-2xl font-black mt-1 ${alert ? 'text-red-700' : 'text-[#111827]'}`}>
          {value}
        </h3>
      </div>
      <div className={`text-3xl p-4 rounded-xl transition-transform ${alert ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-[#F3F4F6]'}`}>
        {icon}
      </div>
    </div>
  );
};
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // 1. Importamos el hook

interface ModalProps {
  isOpen: boolean;
  message: string;
  type: 'success' | 'error' | 'warning';
  onClose: () => void;
  autoClose?: boolean;
}

export const NotificationModal = ({
  isOpen,
  message,
  type,
  onClose,
  autoClose = true,
}: ModalProps) => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation(); // 2. Inicializamos el traductor

  useEffect(() => {
    if (isOpen) {
      setVisible(true);

      if (autoClose) {
        const timer = setTimeout(() => {
          setVisible(false);
          setTimeout(() => {
            onClose();
          }, 300);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, onClose, autoClose]);

  const handleManualClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleManualClose}
      className={`
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/50
        backdrop-blur-sm
        transition-all
        duration-300
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`
          relative
          w-[90%]
          max-w-md
          bg-white
          rounded-3xl
          shadow-[0_20px_80px_rgba(0,0,0,0.25)]
          border
          border-[#E5E7EB]
          overflow-hidden
          px-8
          py-10
          flex
          flex-col
          items-center
          text-center
          transition-all
          duration-300
          ${visible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-5 opacity-0'}
        `}
      >
        <div
          className={`
            absolute
            top-0
            left-0
            w-full
            h-1.5
            ${type === 'success' && 'bg-gradient-to-r from-[#10B981] to-[#34D399]'}
            ${type === 'error' && 'bg-gradient-to-r from-[#EF4444] to-[#F87171]'}
            ${type === 'warning' && 'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]'}
          `}
        />

        <div
          className={`
            w-24
            h-24
            rounded-full
            flex
            items-center
            justify-center
            text-5xl
            font-bold
            mb-6
            shadow-lg
            ${type === 'success' && 'bg-green-100 text-[#10B981]'}
            ${type === 'error' && 'bg-red-100 text-[#EF4444]'}
            ${type === 'warning' && 'bg-orange-100 text-[#F59E0B] animate-pulse'}
          `}
        >
          {type === 'success' && '✓'}
          {type === 'error' && '✕'}
          {type === 'warning' && '⚠️'}
        </div>

        <h2 className="text-3xl font-extrabold text-[#111827] mb-2">
          {/* 3. Reemplazamos los textos fijos por traducciones */}
          {type === 'success' && t('modal.success')}
          {type === 'error' && t('modal.error')}
          {type === 'warning' && t('modal.warning')}
        </h2>

        {/* NOTA: El mensaje en sí (message) lo tienes que traducir desde el componente que llama al modal (ej. LoginView o AuditView) antes de pasarlo como prop */}
        <p className="text-gray-500 leading-relaxed text-base max-w-sm mb-8">
          {message}
        </p>

        {!autoClose && (
          <button 
            onClick={handleManualClose}
            className={`
              w-full py-3 px-4 rounded-xl font-bold text-white transition-all shadow-sm hover:shadow-md
              ${type === 'warning' ? 'bg-[#F59E0B] hover:bg-[#D97706]' : 'bg-[#111827] hover:bg-gray-800'}
            `}
          >
            {/* 4. Traducimos el botón */}
            {t('modal.understood')}
          </button>
        )}
      </div>
    </div>
  );
};
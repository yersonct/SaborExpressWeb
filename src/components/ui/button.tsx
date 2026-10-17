import { translateCopy } from "@/config/copy-translations";
import { useTranslation } from "react-i18next";
import React from 'react';

type ButtonProps = {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'default' | 'ghost' | 'outline';
  onClick?: () => void;
  className?: string;
  isLoading?: boolean;
};

export const Button = ({
  children,
  isLoading,
  className = '',
  ...props
}: ButtonProps) => {
  useTranslation();
  return (
    <button
      disabled={isLoading}
      className={`
        w-full
        bg-[#EA1D2C]
        hover:bg-[#d11a28]
        text-white
        font-semibold
        py-3
        px-4
        rounded-xl
        transition-all
        duration-300
        shadow-lg
        shadow-red-500/20
        hover:shadow-red-500/40
        hover:scale-[1.02]
        active:scale-[0.98]
        disabled:opacity-50
        disabled:cursor-not-allowed
        disabled:hover:scale-100
        flex
        items-center
        justify-center
        gap-2
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">

          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>

          <span>{translateCopy("Cargando...")}</span>

        </div>
      ) : (
        children
      )}
    </button>
  );
};

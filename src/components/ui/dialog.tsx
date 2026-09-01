"use client";

import { useEffect, useState, type ReactNode } from "react";

interface DialogProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

export const Dialog = ({
  isOpen,
  title,
  subtitle,
  onClose,
  children,
}: DialogProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) setVisible(true);
  }, [isOpen]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div
        className={`relative w-[90%] max-w-lg bg-white rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.35)] overflow-hidden transition-all duration-200 ${visible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        <div className="relative bg-gradient-to-br from-[#081A38] via-[#0F2F6B] to-[#163B80] px-8 pt-7 pb-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#EA1D2C] to-[#ff5b3d]" />
          <button
            onClick={handleClose}
            className="absolute top-5 right-6 w-8 h-8 flex items-center justify-center rounded-full text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            ✕
          </button>
          <h2 className="text-xl font-extrabold text-white">{title}</h2>
          {subtitle && <p className="text-sm text-gray-300 mt-1">{subtitle}</p>}
        </div>
        <div className="px-8 py-7 text-[#111827]">{children}</div>
      </div>
    </div>
  );
};

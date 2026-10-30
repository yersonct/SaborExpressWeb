"use client";

import { useId, type ReactNode } from "react";
import { translateCopy } from "@/config/copy-translations";
import { useDialogAccessibility } from "./use-dialog-accessibility";

interface DialogProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

export const Dialog = ({ isOpen, title, subtitle, onClose, children }: DialogProps) => {
  const titleId = useId(), subtitleId = useId();
  const ref = useDialogAccessibility(isOpen, onClose);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 px-3 py-4 backdrop-blur-sm sm:p-6">
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={subtitle ? subtitleId : undefined} tabIndex={-1}
        className="relative my-auto max-h-[90dvh] w-full min-w-0 max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="relative bg-gradient-to-br from-[#081A38] via-[#0F2F6B] to-[#163B80] px-5 pb-5 pt-7 sm:px-8 sm:pb-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#EA1D2C] to-[#ff5b3d]" />
          <button type="button" onClick={onClose} aria-label={translateCopy("Cerrar")}
            className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-white/10 hover:text-white">✕</button>
          <h2 id={titleId} className="break-words pr-12 text-xl font-extrabold text-white">{translateCopy(title)}</h2>
          {subtitle && <p id={subtitleId} className="mt-1 break-words pr-10 text-sm text-gray-300">{translateCopy(subtitle)}</p>}
        </div>
        <div className="min-w-0 px-5 py-5 text-[#111827] sm:px-8 sm:py-7">{children}</div>
      </div>
    </div>
  );
};

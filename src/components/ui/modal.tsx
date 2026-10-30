"use client";

import { useEffect, useId } from "react";
import { useTranslation } from "react-i18next";
import { translateCopy } from "@/config/copy-translations";
import { useDialogAccessibility } from "./use-dialog-accessibility";

interface ModalProps {
  isOpen: boolean;
  message: string;
  type: "success" | "error" | "warning";
  onClose: () => void;
  autoClose?: boolean;
}

export const NotificationModal = ({ isOpen, message, type, onClose, autoClose = true }: ModalProps) => {
  const { t } = useTranslation();
  const titleId = useId(), messageId = useId();
  const ref = useDialogAccessibility(isOpen, onClose);
  useEffect(() => {
    if (!isOpen || !autoClose) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [isOpen, autoClose, onClose]);
  if (!isOpen) return null;
  const color = type === "success" ? "bg-green-100 text-green-700" : type === "error" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700";
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-sm">
      <div ref={ref} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={messageId} tabIndex={-1}
        className="relative my-auto flex max-h-[90dvh] w-full min-w-0 max-w-md flex-col items-center overflow-y-auto rounded-3xl border border-gray-200 bg-white px-6 py-7 text-center shadow-2xl sm:px-8 sm:py-10">
        <div aria-hidden="true" className={`mb-5 flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-4xl font-bold ${color}`}>
          {type === "success" ? "✓" : type === "error" ? "✕" : "!"}
        </div>
        <h2 id={titleId} className="mb-2 break-words text-2xl font-extrabold text-gray-900">{t(`modal.${type}`)}</h2>
        <p id={messageId} className="mb-6 max-w-full break-words text-base leading-relaxed text-gray-600">{translateCopy(message)}</p>
        <button type="button" onClick={onClose} className="min-h-11 w-full rounded-xl bg-[#111827] px-4 py-3 font-bold text-white hover:bg-gray-800">{t("modal.understood")}</button>
      </div>
    </div>
  );
};

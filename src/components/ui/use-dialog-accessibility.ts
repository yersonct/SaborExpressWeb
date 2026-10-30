"use client";

import { useEffect, useRef } from "react";

const openDialogs: symbol[] = [];
let previousBodyOverflow = "";

export function useDialogAccessibility(isOpen: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!isOpen || !ref.current) return;
    const container = ref.current;
    const dialogId = Symbol("dialog");
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!openDialogs.length) previousBodyOverflow = document.body.style.overflow;
    openDialogs.push(dialogId);
    document.body.style.overflow = "hidden";
    const focusable = () => Array.from(container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter((element) => element.getClientRects().length > 0 && !element.closest("[inert]"));
    const frame = requestAnimationFrame(() => (focusable()[0] ?? container).focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (openDialogs.at(-1) !== dialogId) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
      } else if (event.key === "Tab") {
        const elements = focusable(), first = elements[0], last = elements.at(-1);
        if (!first || !last) {
          event.preventDefault(); container.focus();
        } else if (event.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) {
          event.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      const index = openDialogs.indexOf(dialogId);
      if (index >= 0) openDialogs.splice(index, 1);
      if (!openDialogs.length) document.body.style.overflow = previousBodyOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen]);
  return ref;
}

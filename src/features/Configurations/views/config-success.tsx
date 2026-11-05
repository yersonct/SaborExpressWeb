"use client";

import { translateCopy } from "@/config/copy-translations";

import type { ConfigModel } from "./config-model";
export function ConfigSuccess({ model }: { model: ConfigModel }) {
  const { successOpen, setSuccessOpen } = model;
  return (<>
      {successOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSuccessOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#16a34a"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#111827] mb-1">
              {translateCopy("¡Cambios guardados!")}{" "}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {translateCopy(
                "La sede y sus ajustes operativos se actualizaron correctamente.",
              )}{" "}
            </p>
            <button
              type="button"
              onClick={() => setSuccessOpen(false)}
              className="bg-[#111827] hover:bg-gray-800 text-white font-bold py-2.5 px-8 rounded-xl text-sm transition-colors shadow-sm"
            >
              {translateCopy("Aceptar")}{" "}
            </button>
          </div>
        </div>
      )}
  </>);
}

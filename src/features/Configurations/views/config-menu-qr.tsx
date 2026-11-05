"use client";

import { translateCopy } from "@/config/copy-translations";
import { QRCodeCanvas } from "qrcode.react";
import { inputClass } from "./config-utils";
import type { ConfigModel } from "./config-model";
export function ConfigMenuQr({ model }: { model: ConfigModel }) {
  const { activeTab, qrRef, isGerente, branches, qrBranchId, setQrBranchId, effectiveBranchId, menuUrl, handleDownloadQr } = model;
  return (<>
            {activeTab === "carta" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-fade-in sm:p-6 lg:p-8">
                <h2 className="text-xl font-bold text-[#111827] mb-2">
                  {translateCopy("Código QR de la Carta Digital")}{" "}
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  {translateCopy(
                    "Imprime este código y colócalo en cada mesa. Los clientes lo escanean con su celular para ver el menú del restaurante.",
                  )}{" "}
                </p>

                {isGerente && (
                  <div className="mb-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      {translateCopy("Sede del QR")}{" "}
                    </label>
                    <select
                      value={qrBranchId}
                      onChange={(e) =>
                        setQrBranchId(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      className={inputClass}
                    >
                      {branches.length === 0 && (
                        <option value="" disabled>
                          {translateCopy("No hay sedes registradas todavía.")}
                        </option>
                      )}
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col items-center gap-6 py-6">
                  {effectiveBranchId ? (
                    <>
                      <div
                        ref={qrRef}
                        className="rounded-2xl border-2 border-gray-100 bg-white p-3 shadow-sm sm:p-6"
                      >
                        <QRCodeCanvas
                          value={menuUrl}
                          size={220}
                          level="M"
                          className="h-auto max-w-full"
                        />
                      </div>

                      <button
                        onClick={handleDownloadQr}
                        className="bg-[#111827] hover:bg-gray-800 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm"
                      >
                        {translateCopy("Descargar QR (PNG)")}
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {translateCopy("No hay sedes registradas todavía.")}
                    </p>
                  )}
                </div>
              </div>
            )}
  </>);
}

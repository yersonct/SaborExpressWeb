"use client";

import { translateCopy } from "@/config/copy-translations";
import type { UpdateBranchOperationalSettingsPayload } from "@/features/Configurations/types/branch-operational-settings.types";
import { sanitizeNumber } from "@/lib/numeric-input";
import { inputClass } from "./config-utils";
import type { ConfigModel } from "./config-model";
export function ConfigBranch({ model }: { model: ConfigModel }) {
  const { activeTab, isGerente, branches, settingsBranchId, setSettingsBranchId, branchLoading, saving, branchError, branch, settingsLoading, savingAllSettings, settingsError, draft, isEditingOp, numText, setNumText, patch, name, setName, address, setAddress, phone, setPhone, status, setStatus, isEditingBranch, opOpen, setOpOpen, branchFieldErrors, setBranchFieldErrors, handleStartEditAll, handleCancelEditAll, handleSaveAll } = model;
  return (<>
            {activeTab === "negocio" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-fade-in sm:p-6 lg:p-8">
                <h2 className="text-xl font-bold text-[#111827] mb-6">
                  {isGerente
                    ? translateCopy("Configuración por Sede")
                    : translateCopy("Mi Sede")}
                </h2>

                {isGerente && (
                  <div className="mb-6">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      {translateCopy("Selecciona la sede a configurar")}{" "}
                    </label>
                    <select
                      value={settingsBranchId}
                      onChange={(e) =>
                        setSettingsBranchId(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      className={inputClass}
                    >
                      <option value="">
                        {translateCopy("Selecciona una sede...")}
                      </option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {isGerente && !branch ? (
                  <p className="text-sm text-gray-400 py-4">
                    {translateCopy(
                      "Elige una sede arriba para ver y editar su configuración.",
                    )}{" "}
                  </p>
                ) : branchLoading ? (
                  <p className="text-sm text-gray-500">
                    {translateCopy("Cargando datos de la sede...")}{" "}
                  </p>
                ) : branchError ? (
                  <p className="text-sm text-red-600">
                    {translateCopy(branchError)}
                  </p>
                ) : (
                  <form
                    className="space-y-6"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (isEditingBranch) handleSaveAll();
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                          {translateCopy("Nombre de la Sede")}{" "}
                        </label>
                        <input
                          type="text"
                          value={name}
                          maxLength={50}
                          aria-invalid={!!branchFieldErrors.name}
                          onChange={(e) => { setName(e.target.value); setBranchFieldErrors((current) => ({ ...current, name: "" })); }}
                          disabled={!isEditingBranch}
                          className={`${inputClass} ${!isEditingBranch ? "bg-gray-50 text-gray-500" : ""}`}
                        />
                        {branchFieldErrors.name && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(branchFieldErrors.name)}</p>}
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                          {translateCopy("Teléfono")}{" "}
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          maxLength={10}
                          inputMode="numeric"
                          aria-invalid={!!branchFieldErrors.phone}
                          onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setBranchFieldErrors((current) => ({ ...current, phone: "" })); }}
                          disabled={!isEditingBranch}
                          className={`${inputClass} ${!isEditingBranch ? "bg-gray-50 text-gray-500" : ""}`}
                        />
                        {branchFieldErrors.phone && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(branchFieldErrors.phone)}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                          {translateCopy("Dirección")}{" "}
                        </label>
                        <input
                          type="text"
                          value={address}
                          maxLength={150}
                          aria-invalid={!!branchFieldErrors.address}
                          onChange={(e) => { setAddress(e.target.value); setBranchFieldErrors((current) => ({ ...current, address: "" })); }}
                          disabled={!isEditingBranch}
                          className={`${inputClass} ${!isEditingBranch ? "bg-gray-50 text-gray-500" : ""}`}
                        />
                        {branchFieldErrors.address && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(branchFieldErrors.address)}</p>}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-[#111827] text-sm">
                          {translateCopy("Estado de la Sede")}{" "}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {isGerente
                            ? translateCopy(
                                "Activa o inactiva dentro del sistema.",
                              )
                            : translateCopy(
                                "Solo el Gerente puede activar o desactivar la sede.",
                              )}
                        </p>
                      </div>
                      <label
                        className={`relative inline-flex items-center ${
                          isGerente && isEditingBranch
                            ? "cursor-pointer"
                            : "cursor-not-allowed"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={status}
                          disabled={!isGerente || !isEditingBranch}
                          onChange={(e) => setStatus(e.target.checked)}
                          className="branch-status-input sr-only"
                        />
                        <span
                          className="branch-status-track"
                          aria-hidden="true"
                        />
                      </label>
                    </div>
                  </form>
                )}

                {branch && (
                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setOpOpen((o) => !o)}
                      aria-expanded={opOpen}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <div>
                        <h3 className="text-lg font-bold text-[#111827] mb-1">
                          {translateCopy("Ajustes Operativos")}{" "}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {translateCopy(
                            "Horarios, impuestos y tarifas específicas de esta sede.",
                          )}{" "}
                        </p>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`text-gray-500 flex-shrink-0 transition-transform duration-200 ${opOpen ? "rotate-180" : ""}`}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>

                    {opOpen && (
                      <div className="mt-6">
                        {settingsLoading || !draft ? (
                          <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="h-12 rounded-xl bg-gray-100 animate-pulse"
                              />
                            ))}
                          </div>
                        ) : (
                          <>
                            {settingsError && (
                              <p className="text-sm text-red-600 mb-4">
                                {translateCopy(settingsError)}
                              </p>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              {(
                                [
                                  ["openingTime", "Hora de apertura", "time"],
                                  ["closingTime", "Hora de cierre", "time"],
                                  ["taxRate", "Impoconsumo (%)", "number"],
                                  [
                                    "deliveryFee",
                                    "Tarifa de domicilio",
                                    "number",
                                  ],
                                  [
                                    "deliveryRadiusKm",
                                    "Radio de entrega (km)",
                                    "number",
                                  ],
                                ] as const
                              ).map(([field, label, type]) => {
                                const rules = {
                                  taxRate: { decimals: 2, max: 100 },
                                  deliveryFee: { decimals: 0, max: 99999999 },
                                  deliveryRadiusKm: { decimals: 2, max: 100 },
                                } as const;
                                const key = field as
                                  | "taxRate"
                                  | "deliveryFee"
                                  | "deliveryRadiusKm";
                                return (
                                  <div key={field}>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                      {translateCopy(label)}
                                    </label>
                                    {type === "time" ? (
                                      <input
                                        type="time"
                                        value={draft[field]}
                                        disabled={!isEditingOp}
                                        onChange={(e) =>
                                          { setBranchFieldErrors((current) => ({ ...current, [field]: "" })); patch({
                                            [field]: e.target.value,
                                          } as Partial<UpdateBranchOperationalSettingsPayload>); }
                                        }
                                        className={`${inputClass} ${!isEditingOp ? "bg-gray-50 text-gray-500" : ""}`}
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        inputMode={
                                          rules[key].decimals
                                            ? "decimal"
                                            : "numeric"
                                        }
                                        value={numText[key]}
                                        disabled={!isEditingOp}
                                        onChange={(e) => {
                                          const clean = sanitizeNumber(
                                            e.target.value,
                                            { ...rules[key], max: Number.MAX_SAFE_INTEGER },
                                          );
                                          setNumText((p) => ({
                                            ...p,
                                            [key]: clean,
                                          }));
                                          setBranchFieldErrors((current) => ({ ...current, [key]: "" }));
                                          patch({
                                            [key]: Number(clean) || 0,
                                          } as Partial<UpdateBranchOperationalSettingsPayload>);
                                        }}
                                        aria-invalid={!!branchFieldErrors[key]}
                                        className={`${inputClass} ${!isEditingOp ? "bg-gray-50 text-gray-500" : ""}`}
                                      />
                                    )}
                                    {branchFieldErrors[field] && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(branchFieldErrors[field])}</p>}
                                  </div>
                                );
                              })}
                            </div>
                            <p className="mt-3 text-xs text-gray-500">
                              {translateCopy(
                                "Usa 8% para Impoconsumo. Para pedidos nuevos, el impuesto se suma al subtotal de productos; el domicilio se agrega después y no hace parte de la base gravable. Los pedidos ya creados mantienen el cálculo original. Configura 0% solo si el contribuyente es persona natural, tuvo ingresos de esta actividad inferiores a 3.500 UVT el año anterior, tiene máximo un establecimiento y figura como no responsable del INC en el RUT; la app no verifica esas condiciones.",
                              )}{" "}
                            </p>
                            <div className="delivery-assignment-card mt-5 rounded-2xl border p-4 md:flex md:items-center md:justify-between md:gap-6">
                              <div className="flex items-start gap-3">
                                <span
                                  className="delivery-assignment-icon mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                                  aria-hidden="true"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4M12 8h.01" />
                                  </svg>
                                </span>
                                <div>
                                  <h4 className="delivery-assignment-title text-sm font-bold">
                                    {translateCopy(
                                      "Asignación automática de domicilios",
                                    )}
                                  </h4>
                                  <p className="delivery-assignment-copy mt-1 text-xs leading-5">
                                    {translateCopy(
                                      "Con GPS reciente, asigna al repartidor disponible más cercano. Sin GPS reciente, prioriza al que lleva menos pedidos. Si todos alcanzan el máximo, el pedido espera hasta que se libere un cupo.",
                                    )}
                                  </p>
                                  <p className="delivery-assignment-muted mt-1 text-xs">
                                    {translateCopy(
                                      "Para calcular la cercanía, el repartidor debe permitir el acceso a la ubicación GPS en su dispositivo.",
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4 w-full md:mt-0 md:max-w-[240px]">
                                <label className="delivery-assignment-label mb-2 block text-[10px] font-bold uppercase tracking-wider">
                                  {translateCopy(
                                    "Máximo de pedidos activos por repartidor",
                                  )}
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={numText.maxActive}
                                  disabled={!isEditingOp}
                                  onChange={(e) => {
                                    const clean = sanitizeNumber(
                                      e.target.value,
                                      { decimals: 0, max: Number.MAX_SAFE_INTEGER },
                                    );
                                    setNumText((p) => ({
                                      ...p,
                                      maxActive: clean,
                                    }));
                                    patch({
                                      maxActiveDeliveriesPerCourier:
                                        Number(clean) || 0,
                                    });
                                    setBranchFieldErrors((current) => ({ ...current, maxActive: "" }));
                                  }}
                                  aria-invalid={!!branchFieldErrors.maxActive}
                                  className={`${inputClass} delivery-assignment-input`}
                                />
                                {branchFieldErrors.maxActive && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(branchFieldErrors.maxActive)}</p>}
                                <p className="delivery-assignment-muted mt-1 text-[11px]">
                                  {translateCopy(
                                    "Configura entre 1 y 20 pedidos simultáneos.",
                                  )}
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {branch && (
                  <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                    {isEditingBranch && (
                      <button
                        type="button"
                        onClick={handleCancelEditAll}
                        disabled={saving || savingAllSettings}
                        className="bg-white border border-gray-200 hover:bg-gray-50 text-[#111827] font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
                      >
                        {translateCopy("Cancelar")}{" "}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleStartEditAll}
                      disabled={isEditingBranch || saving || savingAllSettings}
                      className="bg-white border border-gray-200 hover:bg-gray-50 text-[#111827] font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {translateCopy("Editar")}{" "}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAll}
                      disabled={!isEditingBranch || saving || savingAllSettings}
                      className="bg-[#111827] hover:bg-gray-800 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving || savingAllSettings
                        ? translateCopy("Guardando...")
                        : translateCopy("Guardar cambios")}
                    </button>
                  </div>
                )}
              </div>
            )}
  </>);
}

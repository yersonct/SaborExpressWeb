"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useMyBranch } from "@/features/branches/hooks/use-my-branch";
import { useBranchOperationalSettings } from "@/features/Configurations/hooks/use-branch-operational-settings";
import { useUserSettings } from "@/features/Configurations/hooks/use-user-settings";
import { getInitials } from "@/features/Configurations/utils/initials";
import { useMyProfile } from "@/features/Configurations/hooks/use-my-profile";
import type { UpdateBranchOperationalSettingsPayload } from "@/features/Configurations/types/branch-operational-settings.types";
import { useBranches } from "@/features/branches/hooks/use-branches";
import { QRCodeCanvas } from "qrcode.react";

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent transition-all";

export const ConfigView = () => {
  const [activeTab, setActiveTab] = useState("perfil");
  const { logout, session } = useAuth();
  const router = useRouter();
  const qrRef = useRef<HTMLDivElement>(null);

  const isGerente = session?.roles?.includes("GERENTE") ?? false;
  const { branches, updateBranch } = useBranches(isGerente);

  // Sede que el Gerente está configurando en la pestaña "Ajustes del
  // Restaurante". El Administrador no elige nada, siempre es la suya.
  const [settingsBranchId, setSettingsBranchId] = useState<number | "">("");

  const {
    branch: myBranch,
    loading: branchLoading,
    saving,
    error: branchError,
    updateMyBranch,
  } = useMyBranch(!isGerente);

  // Sede efectiva del formulario "Mi Sede": la propia si es Administrador,
  // o la que el Gerente haya elegido en el selector.
  const branch = isGerente
    ? (branches.find((b) => b.id === settingsBranchId) ?? null)
    : myBranch;

  // "" = Todas las sedes (el QR no lleva branchId)
  const [qrBranchId, setQrBranchId] = useState<number | "">("");

    // Gerente: la que elija (o ninguna = todas). Administrador: la suya.
    const effectiveBranchId = isGerente
      ? qrBranchId === ""
        ? null
        : qrBranchId
      : (branch?.id ?? null);
    const effectiveBranchName = isGerente
      ? qrBranchId === ""
        ? "todas"
        : (branches.find((b) => b.id === qrBranchId)?.name ?? "sede")
      : (branch?.name ?? "sede");



  const {
    settings: opSettings,
    loading: settingsLoading,
    saving: savingAllSettings,
    error: settingsError,
    save: saveOpSettings,
  } = useBranchOperationalSettings(branch?.id ?? null);
  const [draft, setDraft] =
    useState<UpdateBranchOperationalSettingsPayload | null>(null);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState("");

  // Cuando llegan (o se guardan) los ajustes, el borrador se reinicia con ellos
  useEffect(() => {
    if (opSettings) {
      const { branchId, updatedAt, isDefault, ...editable } = opSettings;
      setDraft(editable);
    } else {
      setDraft(null);
    }
  }, [opSettings]);


  const patch = (changes: Partial<UpdateBranchOperationalSettingsPayload>) =>
    setDraft((prev) => (prev ? { ...prev, ...changes } : prev));



  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState(true);
  const [savedMsg, setSavedMsg] = useState("");

  // Datos reales de la sesión — nada quemado. `identifier` es el correo con
  // el que se inició sesión (así se guarda en el login). `roles` viene del
  // JWT tal cual, así que se muestra en mayúsculas del backend.
  const userEmail = session?.identifier ?? "";
  const userRole = session?.roles?.join(", ") ?? "";

  const {
    profile,
    saving: savingProfile,
    error: profileError,
    save: saveProfile,
  } = useMyProfile(!!session);

  const fullName = profile
    ? `${profile.name} ${profile.lastName ?? ""}`.trim()
    : null;
  const initials = getInitials(fullName, userEmail);

  const [pName, setPName] = useState("");
  const [pLastName, setPLastName] = useState("");
  const [pPhone, setPPhone] = useState("");
  const [profileSavedMsg, setProfileSavedMsg] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const resetProfileFields = () => {
    if (profile) {
      setPName(profile.name);
      setPLastName(profile.lastName ?? "");
      setPPhone(profile.phone ?? "");
    }
  };

  useEffect(() => {
    resetProfileFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleStartEdit = () => {
    setProfileSavedMsg("");
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    resetProfileFields();
    setProfileSavedMsg("");
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingProfile) return;
    setProfileSavedMsg("");
    if (!pName.trim()) {
      alert("El nombre no puede estar vacío.");
      return;
    }
    try {
      await saveProfile({
        name: pName.trim(),
        lastName: pLastName.trim() || undefined,
        phone: pPhone.trim() || undefined,
      });
      setProfileSavedMsg("Perfil actualizado correctamente");
      setIsEditingProfile(false);
    } catch {
      // el error ya queda en profileError
    }
  };

  // URL pública de la carta digital (usa la variable de entorno si existe,
  // o cae al origen actual del navegador como respaldo).
  const menuUrl =
    (process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== "undefined" ? window.location.origin : "")) +
    "/letter" +
    (effectiveBranchId ? `?branchId=${effectiveBranchId}` : "");

  useEffect(() => {
    if (branch) {
      setName(branch.name);
      setAddress(branch.address ?? "");
      setPhone(branch.phone ?? "");
      setStatus(branch.status);
    }
  }, [branch]);


  const [isEditingBranch, setIsEditingBranch] = useState(false);
  const [isEditingOp, setIsEditingOp] = useState(false);
  const [opOpen, setOpOpen] = useState(false);

  // Al cambiar de sede, todo vuelve a bloqueado y el acordeón se cierra
  useEffect(() => {
    setIsEditingBranch(false);
    setIsEditingOp(false);
    setOpOpen(false);
    setSavedMsg("");
    setSettingsSavedMsg("");
  }, [branch?.id]);

  const resetBranchFields = () => {
    if (branch) {
      setName(branch.name);
      setAddress(branch.address ?? "");
      setPhone(branch.phone ?? "");
      setStatus(branch.status);
    }
  };

  const [successOpen, setSuccessOpen] = useState(false);

  const handleStartEditAll = () => {
    setSavedMsg("");
    setSettingsSavedMsg("");
    setIsEditingBranch(true);
    setIsEditingOp(true);
    setOpOpen(true); // abre el desplegable para que se vea que también se edita
  };

  const handleCancelEditAll = () => {
    resetBranchFields();
    if (opSettings) {
      const { branchId, updatedAt, isDefault, ...editable } = opSettings;
      setDraft(editable);
    }
    setSavedMsg("");
    setSettingsSavedMsg("");
    setIsEditingBranch(false);
    setIsEditingOp(false);
  };

  const handleSaveAll = async () => {
    if (!name.trim()) {
      alert(
        "El nombre de la sede no puede estar vacío. Espera a que cargue la información o vuelve a intentar.",
      );
      return;
    }
    try {
      if (isGerente) {
        if (!branch) return;
        await updateBranch(branch.id, { name, address, phone, status });
      } else {
        await updateMyBranch({ name, address, phone, status });
      }
      if (draft) await saveOpSettings(draft);
      setIsEditingBranch(false);
      setIsEditingOp(false);
      setSuccessOpen(true);
    } catch {
      // los errores ya quedan en branchError / settingsError
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleDownloadQr = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `carta-digital-qr-${effectiveBranchName}.png`;
    link.click();
  };

  return (
    <>
      <div className="flex flex-col h-full space-y-6 pb-10">
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-[#111827] tracking-tight">
            Configuración del Sistema
          </h1>
          <p className="text-gray-500 mt-1">
            Administra tu perfil, parámetros del restaurante y seguridad de la
            cuenta.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 pt-2">
          <div className="w-full md:w-64 flex-shrink-0">
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab("perfil")}
                className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === "perfil" ? "bg-[#111827] text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}
              >
                👤 Perfil del Administrador
              </button>
              <button
                onClick={() => setActiveTab("negocio")}
                className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === "negocio" ? "bg-[#111827] text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}
              >
                🏪 Ajustes del Restaurante
              </button>
              <button
                onClick={() => setActiveTab("carta")}
                className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === "carta" ? "bg-[#111827] text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}
              >
                🔗 Carta Digital (QR)
              </button>
              <button
                onClick={() => setActiveTab("seguridad")}
                className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === "seguridad" ? "bg-[#111827] text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}
              >
                🛡️ Seguridad y Accesos
              </button>
            </nav>
          </div>
          <div className="flex-1">
            {activeTab === "perfil" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 animate-fade-in">
                <h2 className="text-xl font-bold text-[#111827] mb-6">
                  Información Personal
                </h2>

                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                  <div className="w-20 h-20 rounded-2xl bg-[#111827] flex items-center justify-center shadow-inner flex-shrink-0">
                    <span className="text-2xl font-bold text-white tracking-wide select-none">
                      {initials}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-[#111827]">
                      {fullName || userEmail}
                    </p>
                    <p className="text-xs text-gray-500">{userRole}</p>
                  </div>
                </div>

                <form className="space-y-5" onSubmit={handleSaveProfile}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={pName}
                        onChange={(e) => setPName(e.target.value)}
                        disabled={!profile || !isEditingProfile}
                        placeholder={profile ? "" : "Sin perfil de empleado"}
                        className={`${inputClass} ${!profile || !isEditingProfile ? "bg-gray-50 text-gray-500" : ""}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Apellido
                      </label>
                      <input
                        type="text"
                        value={pLastName}
                        onChange={(e) => setPLastName(e.target.value)}
                        disabled={!profile || !isEditingProfile}
                        className={`${inputClass} ${!profile || !isEditingProfile ? "bg-gray-50 text-gray-500" : ""}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        value={userEmail}
                        disabled
                        className={`${inputClass} bg-gray-50`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Teléfono de Contacto
                      </label>
                      <input
                        type="tel"
                        value={pPhone}
                        onChange={(e) => setPPhone(e.target.value)}
                        disabled={!profile || !isEditingProfile}
                        className={`${inputClass} ${!profile || !isEditingProfile ? "bg-gray-50 text-gray-500" : ""}`}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Rol
                      </label>
                      <input
                        type="text"
                        value={userRole}
                        disabled
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {profileError && (
                    <p className="text-sm text-red-600">{profileError}</p>
                  )}
                  {profileSavedMsg && (
                    <p className="text-sm text-green-600 font-medium">
                      {profileSavedMsg}
                    </p>
                  )}

                  {profile && (
                    <div className="flex justify-end gap-3">
                      {!isEditingProfile ? (
                        <button
                          type="button"
                          onClick={handleStartEdit}
                          className="bg-[#111827] hover:bg-gray-800 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm"
                        >
                          Editar
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={savingProfile}
                            className="bg-white border border-gray-200 hover:bg-gray-50 text-[#111827] font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={savingProfile}
                            className="bg-[#111827] hover:bg-gray-800 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
                          >
                            {savingProfile ? "Guardando..." : "Guardar cambios"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </form>
              </div>
            )}

            {activeTab === "negocio" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 animate-fade-in">
                <h2 className="text-xl font-bold text-[#111827] mb-6">
                  {isGerente ? "Configuración por Sede" : "Mi Sede"}
                </h2>

                {isGerente && (
                  <div className="mb-6">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Selecciona la sede a configurar
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
                      <option value="">Selecciona una sede...</option>
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
                    Elige una sede arriba para ver y editar su configuración.
                  </p>
                ) : branchLoading ? (
                  <p className="text-sm text-gray-500">
                    Cargando datos de la sede...
                  </p>
                ) : branchError ? (
                  <p className="text-sm text-red-600">{branchError}</p>
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
                          Nombre de la Sede
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={!isEditingBranch}
                          className={`${inputClass} ${!isEditingBranch ? "bg-gray-50 text-gray-500" : ""}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Teléfono
                        </label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={!isEditingBranch}
                          className={`${inputClass} ${!isEditingBranch ? "bg-gray-50 text-gray-500" : ""}`}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Dirección
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          disabled={!isEditingBranch}
                          className={`${inputClass} ${!isEditingBranch ? "bg-gray-50 text-gray-500" : ""}`}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-[#111827] text-sm">
                          Estado de la Sede
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {isGerente
                            ? "Activa o inactiva dentro del sistema."
                            : "Solo el Gerente puede activar o desactivar la sede."}
                        </p>
                      </div>
                      <label
                        className={`relative inline-flex items-center ${
                          isGerente && isEditingBranch
                            ? "cursor-pointer"
                            : "cursor-not-allowed opacity-60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={status}
                          disabled={!isGerente || !isEditingBranch}
                          onChange={(e) => setStatus(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
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
                          Ajustes Operativos
                        </h3>
                        <p className="text-xs text-gray-500">
                          Horarios, impuestos y tarifas específicas de esta
                          sede.
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
                                {settingsError}
                              </p>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              {(
                                [
                                  ["openingTime", "Hora de apertura", "time"],
                                  ["closingTime", "Hora de cierre", "time"],
                                  ["taxRate", "IVA (%)", "number"],
                                  ["suggestedTipPercent", "Propina sugerida (%)", "number"],
                                  ["deliveryFee", "Tarifa de domicilio", "number"],
                                  ["minOrderAmount", "Pedido mínimo", "number"],
                                  ["deliveryRadiusKm", "Radio de entrega (km)", "number"],
                                ] as const
                              ).map(([field, label, type]) => (
                                <div key={field}>
                                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    {label}
                                  </label>
                                  <input
                                    type={type}
                                    step={type === "number" ? "0.01" : undefined}
                                    min={type === "number" ? 0 : undefined}
                                    value={draft[field]}
                                    disabled={!isEditingOp}
                                    onChange={(e) =>
                                      patch({
                                        [field]:
                                          type === "number"
                                            ? Number(e.target.value)
                                            : e.target.value,
                                      } as Partial<UpdateBranchOperationalSettingsPayload>)
                                    }
                                    className={`${inputClass} ${!isEditingOp ? "bg-gray-50 text-gray-500" : ""}`}
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                              {(
                                [
                                  ["acceptsDelivery", "Acepta domicilios"],
                                  ["acceptsDineIn", "Acepta consumo en sitio"],
                                ] as const
                              ).map(([field, label]) => (
                                <label
                                  key={field}
                                  className={`flex items-center gap-3 text-sm font-medium text-[#111827] ${!isEditingOp ? "opacity-60 cursor-not-allowed" : ""}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={draft[field]}
                                    disabled={!isEditingOp}
                                    onChange={(e) =>
                                      patch({
                                        [field]: e.target.checked,
                                      } as Partial<UpdateBranchOperationalSettingsPayload>)
                                    }
                                    className="w-4 h-4"
                                  />
                                  {label}
                                </label>
                              ))}
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
                        Cancelar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleStartEditAll}
                      disabled={isEditingBranch || saving || savingAllSettings}
                      className="bg-white border border-gray-200 hover:bg-gray-50 text-[#111827] font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAll}
                      disabled={!isEditingBranch || saving || savingAllSettings}
                      className="bg-[#111827] hover:bg-gray-800 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving || savingAllSettings
                        ? "Guardando..."
                        : "Guardar cambios"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "carta" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 animate-fade-in">
                <h2 className="text-xl font-bold text-[#111827] mb-2">
                  Código QR de la Carta Digital
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Imprime este código y colócalo en cada mesa. Los clientes lo
                  escanean con su celular para ver el menú del restaurante.
                </p>

                {isGerente && (
                  <div className="mb-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Sede del QR
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
                      <option value="">Todas las sedes</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col items-center gap-6 py-6">
                  <div
                    ref={qrRef}
                    className="p-6 bg-white border-2 border-gray-100 rounded-2xl shadow-sm"
                  >
                    <QRCodeCanvas value={menuUrl} size={220} level="M" />
                  </div>

                  <p className="text-xs text-gray-400 break-all text-center max-w-sm">
                    {menuUrl}
                  </p>

                  <button
                    onClick={handleDownloadQr}
                    className="bg-[#111827] hover:bg-gray-800 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm"
                  >
                    Descargar QR (PNG)
                  </button>
                </div>
              </div>
            )}

            {activeTab === "seguridad" && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                  <h2 className="text-xl font-bold text-[#111827] mb-6">
                    Actualizar Contraseña
                  </h2>
                  <form
                    className="space-y-4 max-w-md"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Contraseña Actual
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className={inputClass}
                      />
                    </div>
                    <div className="pt-2">
                      <button className="bg-white border border-gray-200 hover:bg-gray-50 text-[#111827] font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm">
                        Actualizar
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-red-50/50 rounded-2xl border border-red-100 p-8">
                  <h2 className="text-lg font-bold text-red-800 mb-2">
                    Zona de Control de Sesión
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Al cerrar sesión requerirás ingresar nuevamente tu correo y
                    contraseña para acceder al panel administrativo.
                  </p>

                  <div className="flex gap-4">
                    <button
                      onClick={handleLogout}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {successOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSuccessOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center"
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
              ¡Cambios guardados!
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              La sede y sus ajustes operativos se actualizaron correctamente.
            </p>
            <button
              type="button"
              onClick={() => setSuccessOpen(false)}
              className="bg-[#111827] hover:bg-gray-800 text-white font-bold py-2.5 px-8 rounded-xl text-sm transition-colors shadow-sm"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

"use client";

import { useRememberedUiState } from "@/lib/use-remembered-ui-state";
import { deferEffect } from "@/lib/defer-effect";
import { translateCopy } from "@/config/copy-translations";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useMyBranch } from "@/features/branches/hooks/use-my-branch";
import { useBranchOperationalSettings } from "@/features/Configurations/hooks/use-branch-operational-settings";
import { getInitials } from "@/features/Configurations/utils/initials";
import { useMyProfile } from "@/features/Configurations/hooks/use-my-profile";
import type { UpdateBranchOperationalSettingsPayload } from "@/features/Configurations/types/branch-operational-settings.types";
import { useBranches } from "@/features/branches/hooks/use-branches";
import { QRCodeCanvas } from "qrcode.react";
import { useRealtimeEvents } from "@/features/Dashboard/hooks/use-realtime-events";
import { useTranslation } from "react-i18next";
import { sanitizeNumber } from "@/lib/numeric-input";

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent transition-all";

export const ConfigView = () => {
  const [activeTab, setActiveTab] = useRememberedUiState<"perfil" | "negocio" | "carta">("settings", "activeTab", "perfil");
  const { t } = useTranslation();
  const { logout, session } = useAuth();
  const router = useRouter();
  const qrRef = useRef<HTMLDivElement>(null);

  const isGerente = session?.roles?.includes("GERENTE") ?? false;
  const { branches, updateBranch } = useBranches(isGerente);
  // Sede que el Gerente está configurando en la pestaña "Ajustes del
  // Restaurante". El Administrador no elige nada, siempre es la suya.
  const [settingsBranchId, setSettingsBranchId] = useRememberedUiState<number | "">("settings", "branch", "");

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

  // El QR del gerente siempre corresponde a una sede específica.
  const [qrBranchId, setQrBranchId, qrBranchReady] = useRememberedUiState<number | "">("settings", "qrBranch", "");

  useEffect(() => deferEffect(() => {
    if (!qrBranchReady || !isGerente || branches.length === 0) return;
    if (qrBranchId === "" || !branches.some((b) => b.id === qrBranchId)) {
      setQrBranchId(branches[0].id);
    }
  }), [branches, isGerente, qrBranchId, qrBranchReady, setQrBranchId]);

  const effectiveBranchId = isGerente
    ? qrBranchId === ""
      ? null
      : qrBranchId
    : (branch?.id ?? null);
  const effectiveBranchName = isGerente
    ? (branches.find((b) => b.id === qrBranchId)?.name ?? "sede")
    : (branch?.name ?? "sede");



  const {
    settings: opSettings,
    loading: settingsLoading,
    saving: savingAllSettings,
    error: settingsError,
    save: saveOpSettings,
    reload: reloadOpSettings,
  } = useBranchOperationalSettings(branch?.id ?? null);
  const [draft, setDraft] =
    useState<UpdateBranchOperationalSettingsPayload | null>(null);
  const [isEditingOp, setIsEditingOp] = useState(false);
  const [numText, setNumText] = useState({
    taxRate: "",
    deliveryFee: "",
    deliveryRadiusKm: "",
    maxActive: "",
  });

  // Cuando llegan (o se guardan) los ajustes, el borrador se reinicia con ellos
  useEffect(() => deferEffect(() => {
    if (isEditingOp) return;
    if (opSettings) {
      const editable = Object.fromEntries(
        Object.entries(opSettings).filter(
          ([key]) => !["branchId", "updatedAt", "isDefault"].includes(key),
        ),
      ) as UpdateBranchOperationalSettingsPayload;
      const configuredCapacity = Number(editable.maxActiveDeliveriesPerCourier);
      const capacity =
        Number.isInteger(configuredCapacity) && configuredCapacity >= 1
          ? configuredCapacity
          : 4;
      setDraft({ ...editable, maxActiveDeliveriesPerCourier: capacity });
      setNumText({
        taxRate: String(editable.taxRate ?? 0),
        deliveryFee: String(Math.round(editable.deliveryFee ?? 0)),
        deliveryRadiusKm: String(editable.deliveryRadiusKm ?? 0),
        maxActive: String(capacity),
      });
    } else {
      setDraft(null);
    }
  }), [opSettings, isEditingOp]);

  const refreshChangedBranchSettings = (eventName?: string, ...args: unknown[]) => {
    if (
      eventName === "BranchOperationalSettingsChanged" &&
      branch?.id != null &&
      Number(args[0]) === branch.id
    ) {
      void reloadOpSettings(true);
    }
  };
  const refreshSettingsAfterReconnect = () => {
    if (branch?.id != null) void reloadOpSettings(true);
  };

  useRealtimeEvents(
    session?.userId ?? null,
    ["BranchOperationalSettingsChanged"],
    refreshChangedBranchSettings,
    refreshSettingsAfterReconnect,
  );


  const patch = (changes: Partial<UpdateBranchOperationalSettingsPayload>) =>
    setDraft((prev) => (prev ? { ...prev, ...changes } : prev));



  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState(true);

  // Datos reales de la sesión — nada quemado. `identifier` es el correo con
  // el que se inició sesión (así se guarda en el login). `roles` viene del
  // JWT tal cual, así que se muestra en mayúsculas del backend.
  const userEmail = session?.identifier ?? "";

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

  // Solo el rol del turno de hoy. El Gerente general (sin turnos) se muestra como GERENTE.
  const todayRole =
    profile?.todayRoleName ??
    (isGerente && (!profile || profile.todayShiftState === "None") ? "GERENTE" : null);

  const userRole = todayRole
    ? translateCopy(todayRole)
    : translateCopy(
        profile?.todayShiftState === "Ended" ? "Turno terminado" : "Sin turno hoy",
      );

  const [pName, setPName] = useState("");
  const [pLastName, setPLastName] = useState("");
  const [pPhone, setPPhone] = useState("");
  const [profileFieldErrors, setProfileFieldErrors] = useState<{ name?: string; lastName?: string; phone?: string }>({});
  const [profileSavedMsg, setProfileSavedMsg] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const resetProfileFields = () => {
    if (profile) {
      setPName(profile.name);
      setPLastName(profile.lastName ?? "");
      setPPhone(profile.phone ?? "");
    }
  };

  useEffect(() => deferEffect(() => {
    resetProfileFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [profile]);

  const handleStartEdit = () => {
    setProfileSavedMsg("");
    setProfileFieldErrors({});
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    resetProfileFields();
    setProfileSavedMsg("");
    setProfileFieldErrors({});
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingProfile) return;
    setProfileSavedMsg("");
    const errors: { name?: string; lastName?: string; phone?: string } = {};
    if (!pName.trim()) errors.name = "El nombre es obligatorio.";
    else if (pName.trim().length < 3) errors.name = "El nombre debe tener al menos 3 caracteres.";
    else if (/\d/.test(pName)) errors.name = "El nombre no puede contener números.";
    if (/\d/.test(pLastName)) errors.lastName = "El apellido no puede contener números.";
    if (pPhone.trim() && !/^(?:\d{7}|\d{10})$/.test(pPhone.trim())) {
      errors.phone = "El teléfono debe tener 7 dígitos (fijo) o 10 dígitos (celular), sin espacios ni guiones.";
    }
    setProfileFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
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

  useEffect(() => deferEffect(() => {
    if (branch) {
      setName(branch.name);
      setAddress(branch.address ?? "");
      setPhone(branch.phone ?? "");
      setStatus(branch.status);
    }
  }), [branch]);


  const [isEditingBranch, setIsEditingBranch] = useState(false);
  const [opOpen, setOpOpen] = useState(false);
  const [branchFieldErrors, setBranchFieldErrors] = useState<Record<string, string>>({});

  // Al cambiar de sede, todo vuelve a bloqueado y el acordeón se cierra
  useEffect(() => deferEffect(() => {
    setIsEditingBranch(false);
    setIsEditingOp(false);
    setOpOpen(false);
  }), [branch?.id]);

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
    setBranchFieldErrors({});
    setIsEditingBranch(true);
    setIsEditingOp(true);
    setOpOpen(true); // abre el desplegable para que se vea que también se edita
  };

  const handleCancelEditAll = () => {
    resetBranchFields();
    setBranchFieldErrors({});
    if (opSettings) {
      const editable = Object.fromEntries(
        Object.entries(opSettings).filter(
          ([key]) => !["branchId", "updatedAt", "isDefault"].includes(key),
        ),
      ) as UpdateBranchOperationalSettingsPayload;
      setDraft(editable);
      setNumText({
        taxRate: String(editable.taxRate ?? 0),
        deliveryFee: String(Math.round(editable.deliveryFee ?? 0)),
        deliveryRadiusKm: String(editable.deliveryRadiusKm ?? 0),
        maxActive: String(editable.maxActiveDeliveriesPerCourier ?? 4),
      });
    }
    setIsEditingBranch(false);
    setIsEditingOp(false);
  };

  const handleSaveAll = async () => {
    const errors: Record<string, string> = {};
    const cleanName = name.trim();
    const cleanAddress = address.trim();
    const cleanPhone = phone.trim();
    if (!cleanName) errors.name = "El nombre de la sede es obligatorio.";
    else if (cleanName.length > 50) errors.name = "El nombre no puede superar los 50 caracteres.";
    if (!cleanAddress) errors.address = "La dirección de la sede es obligatoria.";
    else if (cleanAddress.length < 5) errors.address = "La dirección debe tener al menos 5 caracteres.";
    else if (cleanAddress.length > 150) errors.address = "La dirección no puede superar los 150 caracteres.";
    if (!cleanPhone) errors.phone = "El teléfono de la sede es obligatorio.";
    else if (!/^(?:\d{7}|\d{10})$/.test(cleanPhone)) errors.phone = "El teléfono debe tener 7 dígitos (fijo) o 10 dígitos (celular), sin espacios ni guiones.";

    const taxRate = numText.taxRate.trim();
    const deliveryFee = numText.deliveryFee.trim();
    const deliveryRadiusKm = numText.deliveryRadiusKm.trim();
    const maxActive = numText.maxActive.trim();
    if (draft && !draft.openingTime) errors.openingTime = "La hora de apertura es obligatoria.";
    if (draft && !draft.closingTime) errors.closingTime = "La hora de cierre es obligatoria.";
    if (draft && draft.openingTime && draft.openingTime === draft.closingTime) {
      errors.closingTime = "La hora de apertura y la de cierre no pueden ser iguales.";
    }
    if (draft && (!taxRate || !Number.isFinite(Number(taxRate)) || Number(taxRate) < 0 || Number(taxRate) > 100)) {
      errors.taxRate = "Ingresa un porcentaje entre 0 y 100.";
    }
    if (draft && (!deliveryFee || !Number.isFinite(Number(deliveryFee)) || Number(deliveryFee) < 0 || !Number.isInteger(Number(deliveryFee)))) {
      errors.deliveryFee = "Ingresa una tarifa entera igual o mayor que 0.";
    }
    if (draft && (!deliveryRadiusKm || !Number.isFinite(Number(deliveryRadiusKm)) || Number(deliveryRadiusKm) <= 0 || Number(deliveryRadiusKm) > 100)) {
      errors.deliveryRadiusKm = "Ingresa un radio mayor que 0 y máximo 100 km.";
    }
    if (draft && (!maxActive || !Number.isInteger(Number(maxActive)) || Number(maxActive) < 1 || Number(maxActive) > 20)) {
      errors.maxActive = "Ingresa un entero entre 1 y 20.";
    }
    setBranchFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      if (isGerente) {
        if (!branch) return;
        await updateBranch(branch.id, { name: cleanName, address: cleanAddress, phone: cleanPhone, status });
      } else {
        await updateMyBranch({ name: cleanName, address: cleanAddress, phone: cleanPhone, status });
      }
      if (draft) {
        await saveOpSettings({
          ...draft,
          taxRate: Number(taxRate),
          deliveryFee: Number(deliveryFee),
          deliveryRadiusKm: Number(deliveryRadiusKm),
          maxActiveDeliveriesPerCourier: Number(maxActive),
        });
      }
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
            {t("configuration.title")}
          </h1>
          <p className="text-gray-500 mt-1">{t("configuration.description")}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 pt-2">
          <div className="w-full md:w-64 flex-shrink-0">
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab("perfil")}
                aria-current={activeTab === "perfil" ? "page" : undefined}
                className={`config-section-tab${activeTab === "perfil" ? " config-section-tab-active" : ""}`}
              >
                {t("configuration.profile")}
              </button>
              <button
                onClick={() => setActiveTab("negocio")}
                aria-current={activeTab === "negocio" ? "page" : undefined}
                className={`config-section-tab${activeTab === "negocio" ? " config-section-tab-active" : ""}`}
              >
                {t("configuration.restaurant")}
              </button>
              <button
                onClick={() => setActiveTab("carta")}
                aria-current={activeTab === "carta" ? "page" : undefined}
                className={`config-section-tab${activeTab === "carta" ? " config-section-tab-active" : ""}`}
              >
                {t("configuration.menu")}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-[44px] w-full items-center gap-2 rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-left text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-600"
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
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                {translateCopy("Cerrar Sesión")}
              </button>
            </nav>
          </div>
          <div className="min-w-0 flex-1">
            {activeTab === "perfil" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-fade-in sm:p-6 lg:p-8">
                <h2 className="text-xl font-bold text-[#111827] mb-6">
                  {t("configuration.personalInfo")}
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
                        {t("configuration.name")}
                      </label>
                      <input
                        id="profile-name"
                        type="text"
                        value={pName}
                        maxLength={120}
                        aria-invalid={!!profileFieldErrors.name}
                        onChange={(e) => { setPName(e.target.value); setProfileFieldErrors((current) => ({ ...current, name: undefined })); }}
                        disabled={!profile || !isEditingProfile}
                        placeholder={
                          profile ? "" : translateCopy("Sin perfil de empleado")
                        }
                        className={`${inputClass} ${!profile || !isEditingProfile ? "bg-gray-50 text-gray-500" : ""}`}
                      />
                      {profileFieldErrors.name && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(profileFieldErrors.name)}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        {t("configuration.lastName")}
                      </label>
                      <input
                        id="profile-last-name"
                        type="text"
                        value={pLastName}
                        maxLength={80}
                        aria-invalid={!!profileFieldErrors.lastName}
                        onChange={(e) => { setPLastName(e.target.value); setProfileFieldErrors((current) => ({ ...current, lastName: undefined })); }}
                        disabled={!profile || !isEditingProfile}
                        className={`${inputClass} ${!profile || !isEditingProfile ? "bg-gray-50 text-gray-500" : ""}`}
                      />
                      {profileFieldErrors.lastName && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(profileFieldErrors.lastName)}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        {t("configuration.email")}
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
                        {t("configuration.phone")}
                      </label>
                      <input
                        id="profile-phone"
                        type="tel"
                        value={pPhone}
                        maxLength={10}
                        inputMode="numeric"
                        aria-invalid={!!profileFieldErrors.phone}
                        onChange={(e) => { setPPhone(e.target.value.replace(/\D/g, "")); setProfileFieldErrors((current) => ({ ...current, phone: undefined })); }}
                        disabled={!profile || !isEditingProfile}
                        className={`${inputClass} ${!profile || !isEditingProfile ? "bg-gray-50 text-gray-500" : ""}`}
                      />
                      {profileFieldErrors.phone && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(profileFieldErrors.phone)}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        {t("configuration.role")}
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
                    <p className="text-sm text-red-600">
                      {translateCopy(profileError)}
                    </p>
                  )}
                  {profileSavedMsg && (
                    <p className="text-sm text-green-600 font-medium">
                      {translateCopy(profileSavedMsg)}
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
                          {t("configuration.edit")}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={savingProfile}
                            className="bg-white border border-gray-200 hover:bg-gray-50 text-[#111827] font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
                          >
                            {t("configuration.cancel")}
                          </button>
                          <button
                            type="submit"
                            disabled={savingProfile}
                            className="bg-[#111827] hover:bg-gray-800 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
                          >
                            {savingProfile
                              ? t("configuration.saving")
                              : t("configuration.save")}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </form>
              </div>
            )}

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
          </div>
        </div>
      </div>

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
    </>
  );
};

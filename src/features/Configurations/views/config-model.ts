"use client";

import { useRememberedUiState } from "@/lib/use-remembered-ui-state";
import { deferEffect } from "@/lib/defer-effect";
import { translateCopy } from "@/config/copy-translations";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useMyBranch } from "@/features/branches/hooks/use-my-branch";
import { useBranchOperationalSettings } from "@/features/Configurations/hooks/use-branch-operational-settings";
import { getInitials } from "@/features/Configurations/utils/initials";
import { useMyProfile } from "@/features/Configurations/hooks/use-my-profile";
import type { UpdateBranchOperationalSettingsPayload } from "@/features/Configurations/types/branch-operational-settings.types";
import { useBranches } from "@/features/branches/hooks/use-branches";
import { useRealtimeEvents } from "@/features/Dashboard/hooks/use-realtime-events";
import { useTranslation } from "react-i18next";


export function useConfigModel() {
  const [activeTab, setActiveTab] = useRememberedUiState<"perfil" | "negocio" | "carta">("settings", "activeTab", "perfil");
  const { t } = useTranslation();
  const { logout, session } = useAuth();
  const qrRef = useRef<HTMLDivElement>(null);
  const saveAllInFlightRef = useRef(false);

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

  const performSaveAll = async () => {
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

  const handleSaveAll = async () => {
    if (saveAllInFlightRef.current) return;
    saveAllInFlightRef.current = true;
    try {
      await performSaveAll();
    } finally {
      saveAllInFlightRef.current = false;
    }
  };

const handleLogout = async () => {
  try {
    await logout();
  } finally {
    window.location.replace("/login");
  }
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

  return { activeTab, setActiveTab, t, logout, session, qrRef, saveAllInFlightRef, isGerente, branches, updateBranch, settingsBranchId, setSettingsBranchId, myBranch, branchLoading, saving, branchError, updateMyBranch, branch, qrBranchId, setQrBranchId, qrBranchReady, effectiveBranchId, effectiveBranchName, opSettings, settingsLoading, savingAllSettings, settingsError, saveOpSettings, reloadOpSettings, draft, setDraft, isEditingOp, setIsEditingOp, numText, setNumText, refreshChangedBranchSettings, refreshSettingsAfterReconnect, patch, name, setName, address, setAddress, phone, setPhone, status, setStatus, userEmail, profile, savingProfile, profileError, saveProfile, fullName, initials, todayRole, userRole, pName, setPName, pLastName, setPLastName, pPhone, setPPhone, profileFieldErrors, setProfileFieldErrors, profileSavedMsg, setProfileSavedMsg, isEditingProfile, setIsEditingProfile, resetProfileFields, handleStartEdit, handleCancelEdit, handleSaveProfile, menuUrl, isEditingBranch, setIsEditingBranch, opOpen, setOpOpen, branchFieldErrors, setBranchFieldErrors, resetBranchFields, successOpen, setSuccessOpen, handleStartEditAll, handleCancelEditAll, performSaveAll, handleSaveAll, handleLogout, handleDownloadQr };
}

export type ConfigModel = ReturnType<typeof useConfigModel>;

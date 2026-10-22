"use client";

import { useRememberedUiState } from "@/lib/use-remembered-ui-state";
import { deferEffect } from "@/lib/defer-effect";
import { translateCopy, getCurrentLocale } from "@/config/copy-translations";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useEmployeeSchedules } from "../hooks/use-employee-schedules";
import { Dialog } from "@/components/ui/dialog";
import { employeeScheduleService } from "../services/employee-schedule.service";
import { useEmployees } from "@/features/Employees/hooks/use-employees";
import { useRoles } from "@/features/Employees/hooks/use-roles";
import { useMyBranch } from "@/features/branches/hooks/use-my-branch";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRealtimeEvents } from "@/features/Dashboard/hooks/use-realtime-events";
import { useAdminDataChanged } from "@/features/Dashboard/hooks/use-admin-data-changed";
import { branchService } from "@/features/branches/services/branch.service";
import type { Branch } from "@/features/branches/types/branch.types";
import type {
  CreateEmployeeSchedulePayload,
  EmployeeSchedule,
} from "../types/employee-schedule.types";
import type { Employee } from "@/features/Employees/types/employee.types";
import { ROUTES } from "@/config/routes";
import { useRouter } from "next/navigation";
import { branchOperationalSettingsService } from "@/features/Configurations/services/branch-operational-settings.service";
import {
  consumeNavigationTarget,
  pendingNavigationKeys,
  rememberNavigationTarget,
} from "@/config/pending-navigation";

const emptyForm: CreateEmployeeSchedulePayload = {
  employeeId: 0,
  roleId: 0,
  branchId: 0,
  shiftDate: getColombiaNow().dateISO,
  startTime: "08:00",
  endTime: "17:00",
};

type BranchEmployee = Pick<
  Employee,
  "id" | "name" | "lastName" | "branchId" | "hasCv" | "roleNames"
>;

// Normaliza valores del API (HH:mm:ss) al formato que acepta <input type="time">.
function toTimeInputValue(time: string): string {
  const [hours = "00", minutes = "00"] = time.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

// Convierte "HH:mm" o "HH:mm:ss" a formato 12h con AM/PM, ej: "08:00" -> "8:00 a. m."
function formatTime12h(time: string): string {
  const [hoursStr, minutesStr] = toTimeInputValue(time).split(":");
  const hours = Number(hoursStr);
  const minutes = minutesStr ?? "00";
  const date = new Date();
  date.setHours(hours, Number(minutes), 0, 0);
  return date.toLocaleTimeString(getCurrentLocale(), {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Ya no es un arreglo fijo — se calcula según el día real de cada fecha,
// porque la semana ahora puede arrancar en cualquier día (no solo lunes).
function formatDayLabel(date: Date): string {
  const label = date.toLocaleDateString(getCurrentLocale(), { weekday: "short" });
  // Ej: "dom." -> "Dom", "lun." -> "Lun"
  const clean = label.replace(".", "");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}



function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDayHeader(date: Date): string {
  return date.toLocaleDateString(getCurrentLocale(), { day: "2-digit", month: "short" });
}
// Detecta si un empleado tiene rol Gerente, sin importar cómo venga
// estructurado el campo en el objeto (roleName, role.name, role, etc.)
// Solo es el Gerente semilla si tiene el rol GERENTE y NO tiene sede.
// Un Gerente asignado por turno sí tiene sede, así que se muestra.
function isGerenteRole(emp: Employee): boolean {
  const roles: string[] = emp.roleNames ?? [];
  return (
    roles.some((r) => r.toUpperCase().includes("GERENTE")) &&
    (emp.branchId === null || emp.branchId === undefined)
  );
}

function isManagementRoleName(name: string | null | undefined): boolean {
  const normalizedName = name?.toUpperCase();
  return normalizedName === "GERENTE" || normalizedName === "ADMINISTRADOR";
}
function isPastDate(dateISO: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateISO}T00:00:00`);
  return target < today;
}

// Fecha y hora actuales en Colombia, igual que el back (ColombiaTime),
// sin depender de la zona horaria del computador del administrador.
function getColombiaNow(): { dateISO: string; seconds: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return {
    dateISO: `${get("year")}-${get("month")}-${get("day")}`,
    seconds:
      Number(get("hour")) * 3600 +
      Number(get("minute")) * 60 +
      Number(get("second")),
  };
}

// Turno de HOY cuya hora de fin ya pasó
function isShiftEnded(
  s: { shiftDate: string; endTime: string },
  now: { dateISO: string; seconds: number },
): boolean {
  if (s.shiftDate !== now.dateISO) return false;
  const [h, m, sec] = s.endTime.split(":").map(Number);
  return now.seconds > h * 3600 + m * 60 + (sec || 0);
}
// "HH:mm" siempre con cero a la izquierda, así que se pueden comparar como texto.
export const SchedulesView = () => {
  const { t } = useTranslation();
  const { session } = useAuth();
  const isGerente = session?.roles.some((role) => role.toUpperCase() === "GERENTE") ?? false;
  const router = useRouter();

  // Se reevalúa cada 1 s para que un turno cambie de color justo al terminar
  const [now, setNow] = useState(getColombiaNow);
  useEffect(() => {
    const timer = setInterval(() => setNow(getColombiaNow()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Administrador: su sede fija. Gerente: no aplica (elige de una lista).
  const { branch: myBranch } = useMyBranch(!!session && !isGerente);

  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId, branchReady] = useRememberedUiState<number | null>("schedules", "branch", null);
  const [transferTarget, setTransferTarget] = useState<BranchEmployee | null>(null);
  const [transferBranchId, setTransferBranchId] = useState<number | "">("");
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [transferBranchError, setTransferBranchError] = useState("");
  const [transferSuccessMsg, setTransferSuccessMsg] = useState("");
  const [mailConfirmOpen, setMailConfirmOpen] = useState(false);
  const [mailSending, setMailSending] = useState(false);
  const [mailMessage, setMailMessage] = useState<{ text: string; error: boolean } | null>(null);

  const sendWeekSchedulesByEmail = async () => {
    if (!branchId || mailSending) return;
    setMailSending(true);
    setMailMessage(null);
    try {
      const result = await employeeScheduleService.sendWeekEmails(
        branchId, toISODate(weekStart), toISODate(weekEnd),
      );
      const summary = `Correos enviados: ${result.sent}. Sin correo: ${result.skipped}. Fallidos: ${result.failed}.`;
      setMailMessage({
        text: result.failed > 0
          ? `${summary} Revisa los fallidos antes de reenviar; algunos empleados ya recibieron su horario.`
          : result.sent === 0
            ? `${summary} No se enviaron correos en esta semana.`
            : `${summary} Cada empleado recibió únicamente sus turnos de la sede seleccionada.`,
        error: result.failed > 0 || result.sent === 0,
      });
      setMailConfirmOpen(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : null;
      setMailMessage({
        text: errorMessage ?? "No se pudieron enviar los horarios.",
        error: true,
      });
      setMailConfirmOpen(false);
    } finally {
      setMailSending(false);
    }
  };
  // Si es Gerente, carga TODAS las sedes para que elija.
  const loadAllBranches = useCallback(async () => {
    if (!isGerente) return;
    try {
      const branches = await branchService.getAll();
      setAllBranches(branches);
      setSelectedBranchId((currentId) =>
        currentId != null && branches.some((branch) => branch.id === currentId)
          ? currentId
          : branches[0]?.id ?? null,
      );
    } catch {
      // Se conservan los datos ya visibles si una recarga en vivo falla.
    }
  }, [isGerente, setSelectedBranchId]);
  useEffect(() => deferEffect(() => void loadAllBranches()), [loadAllBranches]);
  useAdminDataChanged(
    session?.userId ?? null,
    ["Branches"],
    () => void loadAllBranches(),
    () => void loadAllBranches(),
  );

  // Si es Administrador, usa directamente su propia sede.
  useEffect(() => {
    if (!isGerente && myBranch) {
      setSelectedBranchId(myBranch.id);
    }
  }, [isGerente, myBranch, setSelectedBranchId]);

  const branchId = selectedBranchId;

  const PAGE_SIZE = 10;
  const [search, setSearch] = useRememberedUiState<string>("schedules", "search", "");
  const [page, setPage] = useRememberedUiState<number>("schedules", "page", 1);

  // Limpiamos filtros solo al cambiar realmente de sede, no al restaurar la pantalla.
  const previousBranchId = useRef<number | null>(null);
  useEffect(() => {
    if (!branchReady) return;
    if (previousBranchId.current !== null && previousBranchId.current !== branchId) {
      setPage(1);
      setSearch("");
    }
    previousBranchId.current = branchId;
  }, [branchId, branchReady, setPage, setSearch]);

  const {
    schedules,
    loading,
    error,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    refetch,
  } = useEmployeeSchedules(branchId);
  const { employees, refetch: refetchEmployees } = useEmployees("activo");
  const { roles } = useRoles();
  // Horario de la sede (viene de Configuración; aquí solo se lee)
  const [branchHours, setBranchHours] = useState<{
    branchId: number;
    open: string;
    close: string;
  } | null>(null);
  const [noHoursAlert, setNoHoursAlert] = useState(false);

  const loadBranchHours = useCallback(async (id: number) => {
    try {
      const s = await branchOperationalSettingsService.get(id);
      if (s.isDefault || !s.openingTime || !s.closingTime) {
        setBranchHours(null);
        return null;
      }
      const hours = {
        branchId: id,
        open: toTimeInputValue(s.openingTime),
        close: toTimeInputValue(s.closingTime),
      };
      setBranchHours(hours);
      return hours;
    } catch {
      setBranchHours(null);
      return null;
    }
  }, []);

  const refreshBranchHours = (eventName?: string, ...args: unknown[]) => {
    if (
      eventName === "BranchOperationalSettingsChanged" &&
      branchId != null &&
      Number(args[0]) === branchId
    ) {
      void Promise.all([loadBranchHours(branchId), refetch()]);
    }
  };
  const refreshBranchHoursAfterReconnect = () => {
    if (branchId != null) {
      void loadBranchHours(branchId);
      void refetch();
    }
  };
  useRealtimeEvents(
    session?.userId ?? null,
    ["BranchOperationalSettingsChanged"],
    refreshBranchHours,
    refreshBranchHoursAfterReconnect,
  );

  useEffect(() => deferEffect(() => {
    if (branchId == null) {
      setBranchHours(null);
      return;
    }
    void loadBranchHours(branchId);
  }), [branchId, loadBranchHours]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateEmployeeSchedulePayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [scheduleFieldErrors, setScheduleFieldErrors] = useState<{ employeeId?: string; branchId?: string; roleId?: string }>({});

  // Abre "Nuevo turno" con el horario de la sede, o avisa si no está configurado
  const openCreateModal = useCallback(async (
    employeeId: number,
    targetBranchId: number,
    shiftDate: string,
  ) => {
    const hours = await loadBranchHours(targetBranchId);
    if (!hours) {
      setNoHoursAlert(true);
      return;
    }
    setForm({
      ...emptyForm,
      branchId: targetBranchId,
      employeeId,
      shiftDate,
      startTime: hours.open,
      endTime: hours.close,
    });
    setFormError("");
    setScheduleFieldErrors({});
    setIsModalOpen(true);
  }, [loadBranchHours, setNoHoursAlert, setForm, setFormError, setIsModalOpen]);

  // --- Asignación semanal masiva ---
  const emptyBulkForm = {
    employeeId: 0, // 0 = "Todos los empleados"
    roleId: 0,
    startTime: "08:00",
    endTime: "17:00",
    days: [0, 1, 2, 3, 4, 5, 6], // índices de weekDays, todos por defecto
    requiresCv: false, // el Gerente decide manualmente, sin importar el rol
  };
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState(emptyBulkForm);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState<string[]>([]);
  const [bulkFieldErrors, setBulkFieldErrors] = useState<{ roleId?: string; days?: string }>({});

  // --- Semana seleccionada ---
  function startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // La semana sigue arrancando en "hoy" por defecto, pero se puede
  // navegar libremente hacia atrás para CONSULTAR semanas pasadas.
  const [savedWeekIso, setSavedWeekIso] = useRememberedUiState(
    "schedules", "weekStart", startOfToday().toISOString(),
  );
  const parsedWeek = new Date(savedWeekIso);
  const weekStart = Number.isNaN(parsedWeek.getTime()) ? startOfToday() : parsedWeek;
  const setWeekStart = (date: Date) => setSavedWeekIso(date.toISOString());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const weekEnd = weekDays[6];

  const goToPrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };
  const goToNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };
  const goToThisWeek = () => setWeekStart(startOfToday());

  const employeesById = new Map<number, Employee>(
    employees.map((employee) => [employee.id, employee] as const),
  );
  const isHistoricalAtSelectedBranch = (schedule: EmployeeSchedule) => {
    const currentBranchId =
      schedule.employeeBranchId ??
      employeesById.get(schedule.employeeId)?.branchId ??
      null;
    return currentBranchId !== null && currentBranchId !== schedule.branchId;
  };

  // La sede guardada en cada turno define dónde se trabaja ese día. Un cambio
  // puntual de sede mueve solo ese turno, aunque el empleado conserve su sede habitual.
  const schedulesForSelectedBranch = schedules;

  // Solo turnos dentro de la semana visible
  const weekSchedules = schedulesForSelectedBranch.filter((s) => {
    const shiftDate = new Date(`${s.shiftDate}T00:00:00`);
    return shiftDate >= weekStart && shiftDate <= weekEnd;
  });

  // Un empleado trasladado aparece en semanas pasadas solo si tuvo turnos
  // asignados en esos días dentro de la sede que se está consultando.
  const historicalWeekSchedules = weekSchedules.filter(
    (schedule) =>
      isHistoricalAtSelectedBranch(schedule) && schedule.shiftDate < now.dateISO,
  );
  const historicalEmployeeIds = new Set(
    historicalWeekSchedules.map((schedule) => schedule.employeeId),
  );
  const branchEmployeesById = new Map<number, BranchEmployee>(
    employees
      .filter(
        (emp) =>
          !isGerenteRole(emp) &&
          (emp.branchId === branchId || emp.branchId === null),
      )
      .map((emp) => [emp.id, emp] as const),
  );
  weekSchedules.forEach((schedule) => {
    if (branchEmployeesById.has(schedule.employeeId)) return;
    branchEmployeesById.set(schedule.employeeId, {
      id: schedule.employeeId,
      name: schedule.employeeName,
      lastName: null,
      branchId: schedule.employeeBranchId,
      hasCv: false,
      roleNames: [],
    });
  });
  const branchEmployees = [...branchEmployeesById.values()];

  const filteredEmployees = branchEmployees.filter((emp) =>
    `${emp.name} ${emp.lastName ?? ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);
  const visibleEmployees = filteredEmployees.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Los roles de gestión solo los puede asignar el Gerente.
  // "Cliente" nunca: es un rol interno del sistema, no un cargo de turno.
  const operationalRoles = roles.filter(
    (role) =>
      role.name.toUpperCase() !== "CLIENTE" &&
      (isGerente || !isManagementRoleName(role.name)),
  );

  // Empleados sin ningún turno esta semana (para el selector del modal,
  // igual que antes evitamos duplicar turnos por accidente en el mismo día)
  const employeesWithoutSchedule = employees.filter(
    (emp) =>
      !isGerenteRole(emp) &&
      !schedules.some(
        (s) => s.employeeId === emp.id && s.shiftDate === form.shiftDate,
      ),
  );

  // Lookup rápido: empleadoId -> fecha ISO -> turnos de ese día
  const scheduleLookup = new Map<string, EmployeeSchedule[]>();
  weekSchedules.forEach((s) => {
    const key = `${s.employeeId}_${s.shiftDate}`;
    const list = scheduleLookup.get(key) ?? [];
    list.push(s);
    scheduleLookup.set(key, list);
  });
  // Si venimos desde "Registrar Empleado", abrimos el modal de ese empleado.
  // modal automáticamente con ese empleado y SU sede real (no la que
  // estuviera puesta por defecto en el dropdown).
  useEffect(() => deferEffect(() => {
    if (employees.length === 0) return;
    const employeeId = consumeNavigationTarget(
      pendingNavigationKeys.scheduleEmployee,
    );
    if (employeeId === null) return;
    const employee = employees.find((emp) => emp.id === employeeId);
    if (!employee) return;

    const employeeBranchId = employee.branchId ?? branchId;
    if (!employeeBranchId) return;

    if (isGerente && employeeBranchId !== selectedBranchId) {
      setSelectedBranchId(employeeBranchId);
    }

    openCreateModal(employeeId, employeeBranchId, emptyForm.shiftDate);

  }), [employees, isGerente, selectedBranchId, branchId, openCreateModal, setSelectedBranchId]);

  const selectedEmployee = employees.find((e) => e.id === form.employeeId);
  const selectedBranchHours =
    branchHours?.branchId === branchId ? branchHours : null;
  const selectedRole = roles.find((r) => r.id === form.roleId);
  const needsCvWarning =
    !!selectedRole?.requiresCv && selectedEmployee && !selectedEmployee.hasCv;

  // Revisa si el empleado ya tiene un turno ese día en OTRA sede distinta.
  // excludeScheduleId sirve para que, al editar, no se compare consigo mismo.
  const checkCrossBranchConflict = async (
    employeeId: number,
    shiftDate: string,
    branchId: number,
    excludeScheduleId?: number,
  ): Promise<string | null> => {
    const allShifts = await employeeScheduleService.getByEmployee(employeeId);
    const conflict = allShifts.find(
      (s) =>
        s.shiftDate === shiftDate &&
        s.branchId !== branchId &&
        s.id !== excludeScheduleId,
    );
    return conflict
      ? `Este empleado ya tiene un turno ese día en ${conflict.branchName}.`
      : null;
  };

  const handleSubmit = async () => {
    const errors: { employeeId?: string; branchId?: string; roleId?: string } = {};
    if (!form.employeeId) errors.employeeId = "Selecciona un empleado.";
    if (!form.branchId) errors.branchId = "Selecciona una sede para el turno.";
    if (!form.roleId) errors.roleId = "Selecciona un rol.";
    setScheduleFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    setFormError("");
    try {
      const hours = await loadBranchHours(form.branchId);
      if (!hours) {
        setNoHoursAlert(true);
        setSaving(false);
        return;
      }
      const scheduleForm = {
        ...form,
        startTime: hours.open,
        endTime: hours.close,
      };

      const conflictMessage = await checkCrossBranchConflict(
        form.employeeId,
        form.shiftDate,
        form.branchId,
        editingId ?? undefined,
      );
      if (conflictMessage) {
        setFormError(conflictMessage);
        setSaving(false);
        return;
      }

      if (editingId) {
        await updateSchedule(editingId, scheduleForm);
        setIsModalOpen(false);
        setEditingId(null);
        return;
      }

      const employeeIdCreated = form.employeeId;
      await createSchedule(scheduleForm);
      setIsModalOpen(false);
      rememberNavigationTarget(
        pendingNavigationKeys.editEmployee,
        employeeIdCreated,
      );
      router.push(ROUTES.employees);
    } catch (err) {
      setFormError(
        err instanceof Error ? translateCopy(err.message) : "No se pudo guardar el turno",
      );
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = async (s: EmployeeSchedule) => {
    if (isPastDate(s.shiftDate)) return; // no se editan turnos de fechas pasadas
    const hours = await loadBranchHours(s.branchId);
    if (!hours) {
      setNoHoursAlert(true);
      return;
    }
    setEditingId(s.id);
    setForm({
      employeeId: s.employeeId,
      roleId: s.roleId,
      branchId: s.branchId,
      shiftDate: s.shiftDate,
      startTime: hours.open,
      endTime: hours.close,
    });
    setFormError("");
    setScheduleFieldErrors({});
    setIsModalOpen(true);
  };

  // --- Guardado masivo: mismo turno para varios días de la semana ---
  const handleBulkSubmit = async () => {
    const nextFieldErrors: { roleId?: string; days?: string } = {};
    if (!bulkForm.roleId) {
      nextFieldErrors.roleId = "Selecciona un rol.";
    }
    if (bulkForm.days.length === 0) {
      nextFieldErrors.days = "Selecciona al menos un día.";
    }
    setBulkFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;
    if (!branchId) {
      setBulkError(["Selecciona una sede."]);
      return;
    }
    const hours = await loadBranchHours(branchId);
    if (!hours) {
      setIsBulkModalOpen(false);
      setNoHoursAlert(true);
      return;
    }
    let targetEmployees =
      bulkForm.employeeId === 0
        ? branchEmployees
        : branchEmployees.filter((e) => e.id === bulkForm.employeeId);

    // El Gerente decide manualmente si este lote de turnos exige CV,
    // sin importar la configuración individual de cada rol.
    const skippedForCv: string[] = [];
    if (bulkForm.requiresCv) {
      const withCv = targetEmployees.filter((e) => e.hasCv);
      const withoutCv = targetEmployees.filter((e) => !e.hasCv);
      withoutCv.forEach((e) =>
        skippedForCv.push(`${e.name} ${e.lastName ?? ""}`.trim()),
      );
      targetEmployees = withCv;
    }

    if (targetEmployees.length === 0) {
      setBulkError([
        skippedForCv.length > 0
          ? `Ningún empleado seleccionado tiene hoja de vida cargada: ${skippedForCv.join(", ")}.`
          : "No hay empleados para asignar.",
      ]);
      return;
    }

    setBulkSaving(true);
    setBulkError([]);
    try {
      // Traemos, UNA vez por empleado del lote, todos sus turnos en
      // cualquier sede (no solo la actual), para detectar choques.
      const crossBranchByEmployee = new Map<number, EmployeeSchedule[]>();
      await Promise.all(
        targetEmployees.map(async (emp) => {
          const allShifts = await employeeScheduleService.getByEmployee(emp.id);
          crossBranchByEmployee.set(emp.id, allShifts);
        }),
      );

      const jobs: { emp: BranchEmployee; dateISO: string }[] = [];
      const skippedForConflict: string[] = [];

      targetEmployees.forEach((emp) => {
        bulkForm.days.forEach((dayIndex) => {
          const dateISO = toISODate(weekDays[dayIndex]);

          const alreadyHasShift = schedules.some(
            (s) => s.employeeId === emp.id && s.shiftDate === dateISO,
          );
          if (alreadyHasShift) return; // ya tiene turno ESTE día EN ESTA sede

          const otherShifts = crossBranchByEmployee.get(emp.id) ?? [];
          const conflict = otherShifts.find(
            (s) => s.shiftDate === dateISO && s.branchId !== branchId,
          );
          if (conflict) {
            skippedForConflict.push(
              `${emp.name} ${emp.lastName ?? ""} (${formatDayHeader(weekDays[dayIndex])} ya tiene turno en ${conflict.branchName})`.trim(),
            );
            return;
          }

          jobs.push({ emp, dateISO });
        });
      });

      if (jobs.length === 0) {
        setBulkError(["Todos los empleados seleccionados ya tienen turno en esos días."]);
        setBulkSaving(false);
        return;
      }

      // Los días de un mismo empleado se crean en orden, uno por uno:
      // en paralelo chocaban al crear el rol del empleado al mismo tiempo.
      const jobsByEmployee = new Map<number, typeof jobs>();
      jobs.forEach((job) => {
        const list = jobsByEmployee.get(job.emp.id) ?? [];
        list.push(job);
        jobsByEmployee.set(job.emp.id, list);
      });

      const results: PromiseSettledResult<unknown>[] = (
        await Promise.all(
          Array.from(jobsByEmployee.values()).map(async (empJobs) => {
            const out: PromiseSettledResult<unknown>[] = [];
            for (const job of empJobs) {
              try {
                const value = await employeeScheduleService.create({
                  employeeId: job.emp.id,
                  roleId: bulkForm.roleId,
                  branchId: branchId,
                  shiftDate: job.dateISO,
                  startTime: hours.open,
                  endTime: hours.close,
                });
                out.push({ status: "fulfilled", value });
              } catch (reason) {
                out.push({ status: "rejected", reason });
              }
            }
            return out;
          }),
        )
      ).flat();

      const failed = results.filter(
        (r): r is PromiseRejectedResult => r.status === "rejected",
      );

      // Juntamos los mensajes reales de error (sin duplicados) en vez de
      // solo decir "fallaron" — así sabemos la causa exacta del backend.
      const failureReasons = Array.from(
        new Set(
          failed.map((r) =>
            r.reason instanceof Error ? r.reason.message : String(r.reason),
          ),
        ),
      );

      await refetch();

      const hasWarnings =
        failed.length > 0 ||
        skippedForCv.length > 0 ||
        skippedForConflict.length > 0;

      if (!hasWarnings) {
        setIsBulkModalOpen(false);
      } else {
        const successCount = results.length - failed.length;
        const messages = [`Se crearon ${successCount} de ${results.length} turnos.`];
        if (failed.length > 0) {
          messages.push(`${failed.length} fallaron: ${failureReasons.join(" | ")}`);
        }
        if (skippedForCv.length > 0) {
          messages.push(`Omitidos por falta de CV: ${skippedForCv.join(", ")}.`);
        }
        if (skippedForConflict.length > 0) {
          messages.push(
            ...skippedForConflict.map(
              (conflict) => `Omitido por choque de sede: ${conflict}`,
            ),
          );
        }
        setBulkError(messages);
      }
    } catch (err) {
      setBulkError([
        err instanceof Error ? translateCopy(err.message) : "No se pudo asignar la semana",
      ]);
    } finally {
      setBulkSaving(false);
    }
  };

  const toggleBulkDay = (dayIndex: number) => {
    setBulkFieldErrors((current) => ({ ...current, days: "" }));
    setBulkForm((prev) => ({
      ...prev,
      days: prev.days.includes(dayIndex)
        ? prev.days.filter((d) => d !== dayIndex)
        : [...prev.days, dayIndex],
    }));
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    const target = schedules.find((s) => s.id === confirmDeleteId);
    if (target && isPastDate(target.shiftDate)) {
      setConfirmDeleteId(null);
      return; // no se eliminan turnos de fechas pasadas
    }
    setDeleting(true);
    try {
      await deleteSchedule(confirmDeleteId);
      setConfirmDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const openTransferModal = (emp: BranchEmployee) => {
    setTransferTarget(emp);
    setTransferBranchId("");
    setTransferError("");
    setTransferBranchError("");
    setTransferSuccessMsg("");
  };

  const handleConfirmTransfer = async () => {
    if (!transferTarget || !transferBranchId) {
      setTransferBranchError("Selecciona la sede destino.");
      return;
    }
    if (transferBranchId === transferTarget.branchId) {
      setTransferBranchError("Esa ya es la sede actual del empleado.");
      return;
    }
    setTransferBranchError("");
    setTransferring(true);
    setTransferError("");
    try {
      const result = await employeeScheduleService.transferBranch(
        transferTarget.id,
        {
          newBranchId: Number(transferBranchId),
        },
      );
      setTransferSuccessMsg(
        `Se trasladaron ${result.transferredSchedules} turno(s) futuro(s) a la nueva sede.`,
      );
      await Promise.all([refetch(), refetchEmployees()]);
    } catch (err) {
      setTransferError(
        err instanceof Error ? translateCopy(err.message) : "No se pudo trasladar al empleado",
      );
    } finally {
      setTransferring(false);
    }
  };
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#081A38]">
            {t("pageTitles.schedules")}
          </h1>
          <p className="text-base text-gray-500">
             {translateCopy("Asigna a cada empleado un turno con rol activo, sede y horario.")} </p>

          {isGerente && (
            <div className="mt-3">
              <label className="text-xs font-semibold text-gray-500 mr-2">
                 {translateCopy("Sede:")} </label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 bg-white"
                value={selectedBranchId ?? ""}
                onChange={(e) => setSelectedBranchId(Number(e.target.value))}
              >
                {allBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              onClick={goToPrevWeek}
              className="schedule-week-nav w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
              aria-label={translateCopy("Semana anterior")}
            >
              ←
            </button>
            <span className="text-sm font-semibold text-[#081A38]">
              {formatDayHeader(weekStart)} – {formatDayHeader(weekEnd)}
            </span>
            <button
              onClick={goToNextWeek}
              className="schedule-week-nav w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
              aria-label={translateCopy("Semana siguiente")}
            >
              →
            </button>
            <button
              onClick={goToThisWeek}
              className="text-xs font-semibold text-[#EA1D2C] hover:underline ml-1"
            >
               {translateCopy("Hoy")} </button>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => {
              setMailMessage(null);
              setMailConfirmOpen(true);
            }}
            disabled={!branchId || mailSending || weekSchedules.length === 0}
            className="w-full rounded-lg border border-[#EA1D2C] bg-white px-5 py-2.5 font-semibold text-[#EA1D2C] transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            title={translateCopy("Enviar a cada empleado los turnos de la semana visible")}
          >
            {translateCopy("Enviar horarios por correo")}
          </button>
          <button
            onClick={async () => {
              if (!branchId) return;
              const hours = await loadBranchHours(branchId);
              if (!hours) {
                setNoHoursAlert(true);
                return;
              }
              setBulkForm({
                ...emptyBulkForm,
                startTime: hours.open,
                endTime: hours.close,
              });
              setBulkError([]);
              setBulkFieldErrors({});
              setIsBulkModalOpen(true);
            }}
            disabled={!branchId}
            className="w-full lg:w-auto bg-[#EA1D2C] text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-40"
          >
             {translateCopy("+ Asignar semana completa")} </button>
        </div>
      </div>

      {mailMessage && (
        <div role="status" className={`mb-3 rounded-xl px-4 py-3 text-sm ${mailMessage.error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>
          {translateCopy(mailMessage.text)}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {translateCopy(error)}
        </div>
      )}

      {branchEmployees.length > PAGE_SIZE && (
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={translateCopy("Buscar empleado...")}
          className="w-full sm:w-72 border border-gray-300 rounded-lg px-3 py-2 mb-3 text-sm text-gray-900 bg-white"
        />
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <p className="text-center py-10 text-gray-400">{translateCopy("Cargando turnos...")}</p>
        ) : branchEmployees.length === 0 ? (
          <p className="text-center py-10 text-gray-400">
             {translateCopy("No hay empleados activos en esta sede.")} </p>
        ) : (
          <table className="w-full min-w-[1000px] text-sm xl:text-base table-fixed">
            <thead className="bg-gray-50 text-gray-500 uppercase text-sm">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 text-left px-3 xl:px-4 py-4 w-36 xl:w-44">
                   {translateCopy("Empleado")} </th>
                {weekDays.map((d, i) => (
                  <th key={i} className="text-center px-2 py-4">
                    <div className="text-sm">{formatDayLabel(d)}</div>
                    <div className="text-xs font-normal normal-case text-gray-400 mt-0.5">
                      {formatDayHeader(d)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleEmployees.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                     {translateCopy("Ningún empleado coincide con la búsqueda.")} </td>
                </tr>
              )}
              {visibleEmployees.map((emp) => (
                <tr key={emp.id} className="border-t border-gray-100">
                  <td className="sticky left-0 z-10 bg-white px-3 xl:px-4 py-4">
                    <p className="font-semibold text-[#081A38] text-sm xl:text-base">
                      {emp.name} {emp.lastName ?? ""}
                    </p>
                    {historicalEmployeeIds.has(emp.id) && (
                      <p className="text-[10px] text-gray-400 italic">
                         {translateCopy("Trasladado a otra sede — solo historial")} </p>
                    )}
                    {isGerente && emp.branchId === branchId && (
                      <button
                        onClick={() => openTransferModal(emp)}
                        className="text-[10px] font-semibold text-gray-400 hover:text-[#EA1D2C] transition-colors mt-0.5"
                      >
                         {translateCopy("Trasladar de sede")} </button>
                    )}
                  </td>
                  {weekDays.map((d, i) => {
                    const dateISO = toISODate(d);
                    const dayShifts =
                      scheduleLookup.get(`${emp.id}_${dateISO}`) ?? [];
                    return (
                      <td key={i} className="text-center px-1 py-2">
                        {dayShifts.length === 0 ? (
                          historicalEmployeeIds.has(emp.id) ? null : (
                            <button
                              onClick={() => {
                                if (isPastDate(dateISO)) return; // no se crean turnos en fechas pasadas
                                openCreateModal(emp.id, branchId ?? 0, dateISO);
                              }}
                              disabled={isPastDate(dateISO)}
                              className="w-full text-gray-300 hover:text-[#EA1D2C] text-lg py-3 rounded-md hover:bg-red-50 transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          )
                        ) : (
                          dayShifts.map((s) => {
                            const locked = isPastDate(s.shiftDate);
                            const usesCurrentBranchHours =
                              selectedBranchHours !== null &&
                              s.shiftDate >= now.dateISO;
                            const startTime = usesCurrentBranchHours
                              ? selectedBranchHours.open
                              : s.startTime;
                            const endTime = usesCurrentBranchHours
                              ? selectedBranchHours.close
                              : s.endTime;
                            const endedToday =
                              !locked &&
                              isShiftEnded({ shiftDate: s.shiftDate, endTime }, now);
                            return (
                              <div
                                key={s.id}
                                title={
                                  s.isOwnLockedShift
                                    ? translateCopy("No puedes editar ni eliminar tus propios turnos como Gerente o Administrador.")
                                    : endedToday
                                    ? translateCopy("Turno de hoy finalizado")
                                    : undefined
                                }
                                className={`rounded-lg px-1 py-1.5 xl:px-2 xl:py-2 text-xs xl:text-sm leading-tight break-words font-semibold mb-1 relative group ${
                                  locked
                                    ? "bg-gray-100 text-gray-400"
                                    : endedToday
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-[#0F2F6B]/10 text-[#0F2F6B]"
                                }`}
                              >
                                <div>
                                  {formatTime12h(startTime)} –{" "}
                                  {formatTime12h(endTime)}
                                </div>
                                <div
                                  className={`text-xs font-normal mt-0.5 ${
                                    locked
                                      ? "text-gray-400"
                                      : endedToday
                                        ? "text-amber-700/70"
                                        : "text-[#0F2F6B]/70"
                                  }`}
                                >
                                  {translateCopy(s.roleName)}
                                </div>
                                {!locked && !s.isOwnLockedShift &&
                                  (isGerente || !isManagementRoleName(s.roleName)) && (
                                  <div className="absolute -top-1.5 -right-1.5 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => openEditModal(s)}
                                      className="w-5 h-5 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-[#0F2F6B] hover:border-[#0F2F6B]/40 text-xs flex items-center justify-center"
                                      aria-label={translateCopy("Editar turno")}
                                    >
                                      ✎
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(s.id)}
                                      className="w-5 h-5 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 text-xs flex items-center justify-center"
                                      aria-label={translateCopy("Eliminar turno")}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filteredEmployees.length > PAGE_SIZE && (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-sm text-gray-500">
          <span>
             {translateCopy("Mostrando")} {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filteredEmployees.length)}  {translateCopy("de")}{" "}
            {filteredEmployees.length}  {translateCopy("empleados")} </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
               {translateCopy("← Anterior")} </button>
            <span className="font-semibold text-[#081A38]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
               {translateCopy("Siguiente →")} </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div
          onClick={() => {
            setIsModalOpen(false);
            setEditingId(null);
          }}
          className={`
          fixed inset-0 z-50 flex items-center justify-center overflow-y-auto
          bg-black/50 p-3 backdrop-blur-sm
          transition-all duration-300
        `}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`
            relative my-auto w-full max-w-md max-h-[90dvh] overflow-y-auto bg-white rounded-3xl
            shadow-[0_20px_80px_rgba(0,0,0,0.25)]
            border border-[#E5E7EB]
            px-5 py-6 sm:px-8 sm:py-10
            transition-all duration-300
            scale-100 translate-y-0 opacity-100
          `}
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#EA1D2C] to-[#F87171]" />

            <h2 className="text-2xl font-extrabold text-[#111827] mb-6">
              {editingId ? translateCopy("Editar turno") : translateCopy("Nuevo turno")}
            </h2>
            {form.employeeId !== 0 && selectedEmployee && (
              <p className="text-sm font-semibold text-gray-500 -mt-4 mb-6">
                {selectedEmployee.name} {selectedEmployee.lastName ?? ""}
              </p>
            )}

            {formError && (
              <div className="bg-red-100 text-[#EF4444] px-4 py-3 rounded-xl mb-4 text-sm font-medium">
                {translateCopy(formError)}
              </div>
            )}

            <div className="space-y-4">
              <div className={form.employeeId !== 0 ? "hidden" : ""}>
                <label className="text-xs font-semibold text-gray-500">
                   {translateCopy("Empleado")} </label>
                <select
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                  value={form.employeeId}
                  onChange={(e) => {
                    const empId = Number(e.target.value);
                    const selected = employees.find(
                      (emp) => emp.id === empId,
                    );
                    setForm({
                      ...form,
                      employeeId: empId,
                      branchId: isGerente
                        ? (selected?.branchId ?? form.branchId)
                        : (myBranch?.id ?? 0),
                    });
                    setFormError("");
                    setScheduleFieldErrors((current) => ({ ...current, employeeId: "", branchId: "" }));
                  }}
                  aria-invalid={!!scheduleFieldErrors.employeeId}
                >
                  <option value={0}>{translateCopy("Selecciona...")}</option>
                  {employeesWithoutSchedule.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.lastName ?? ""}
                    </option>
                  ))}
                </select>
                {scheduleFieldErrors.employeeId && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(scheduleFieldErrors.employeeId)}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">
                   {translateCopy("Sede")} </label>
                {isGerente ? (
                  <select
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                    value={form.branchId}
                    onChange={async (e) => {
                      const newId = Number(e.target.value);
                      setForm((f) => ({ ...f, branchId: newId }));
                      setScheduleFieldErrors((current) => ({ ...current, branchId: "" }));
                      if (!newId) return;
                      const hours = await loadBranchHours(newId);
                      if (!hours) {
                        setNoHoursAlert(true);
                        return;
                      }
                      setForm((f) => ({
                        ...f,
                        startTime: hours.open,
                        endTime: hours.close,
                      }));
                    }}
                  >
                    <option value={0}>{translateCopy("Selecciona...")}</option>
                    {allBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={myBranch?.name ?? translateCopy("Sin sede asignada")}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-500 bg-gray-100"
                  />
                )}
                {scheduleFieldErrors.branchId && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(scheduleFieldErrors.branchId)}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500">
                   {translateCopy("Rol del turno")} </label>
                <select
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                  value={form.roleId}
                  onChange={(e) => { setForm({ ...form, roleId: Number(e.target.value) }); setScheduleFieldErrors((current) => ({ ...current, roleId: "" })); }}
                  aria-invalid={!!scheduleFieldErrors.roleId}
                >
                  <option value={0}>{translateCopy("Selecciona...")}</option>
                  {operationalRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {translateCopy(role.name)}
                    </option>
                  ))}
                </select>
                {scheduleFieldErrors.roleId && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(scheduleFieldErrors.roleId)}</p>}
              </div>

              {needsCvWarning && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-xs text-orange-700">
                  <strong>{selectedEmployee?.name}</strong>  {translateCopy("no tiene hoja de vida cargada, y el rol")} <strong>{translateCopy(selectedRole?.name ?? "")}</strong>{" "}
                   {translateCopy("la requiere. Ve a \"Gestión de Talento\", edita a este empleado y sube su CV antes de poder asignarle este turno.")} </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500">
                   {translateCopy("Fecha")} </label>
                <input
                  type="date"
                  disabled
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-500 bg-gray-100 cursor-not-allowed"
                  value={form.shiftDate}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500">
                     {translateCopy("Hora inicio")} </label>
                  <input
                    type="time"
                    disabled
                    step={60}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-500 bg-gray-100 cursor-not-allowed"
                    value={form.startTime}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">
                     {translateCopy("Hora fin")} </label>
                   <input
                    type="time"
                    disabled
                    step={60}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-500 bg-gray-100 cursor-not-allowed"
                    value={form.endTime}
                  />
                </div>
              </div>
              {branchHours && (
                <p className="text-[11px] text-gray-400 -mt-2">
                   {translateCopy("Horario de la sede:")} {formatTime12h(branchHours.open)} –{" "}
                  {formatTime12h(branchHours.close)}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                }}
                className="px-4 py-2.5 rounded-xl text-gray-500 font-semibold hover:bg-gray-100"
              >
                 {translateCopy("Cancelar")} </button>
              <button
                onClick={handleSubmit}
                disabled={saving || needsCvWarning}
                className="px-6 py-2.5 rounded-xl bg-[#EA1D2C] text-white font-bold shadow-sm hover:shadow-md hover:bg-[#D91B29] transition-all disabled:opacity-40"
              >
                {saving
                  ? translateCopy("Guardando...")
                  : editingId
                    ? translateCopy("Guardar cambios")
                    : translateCopy("Crear turno")}
              </button>
            </div>
          </div>
        </div>
      )}
      {isBulkModalOpen && (
        <div
          onClick={() => setIsBulkModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative my-auto w-full max-w-md max-h-[90dvh] overflow-y-auto bg-white rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.25)] border border-[#E5E7EB] px-5 py-6 sm:px-8 sm:py-10"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#EA1D2C] to-[#F87171]" />

            <h2 className="text-2xl font-extrabold text-[#111827] mb-1">
               {translateCopy("Asignar semana completa")} </h2>
            <p className="text-xs text-gray-500 mb-6">
               {translateCopy("Crea el mismo turno para uno o varios días de esta semana.")} </p>

            {bulkError.length > 0 && (
              <div className="bg-red-100 text-[#EF4444] px-4 py-3 rounded-xl mb-4 text-sm font-medium whitespace-pre-wrap">
                {bulkError.map((message, index) => (
                  <p key={`${index}-${message}`}>{translateCopy(message)}</p>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500">
                   {translateCopy("Empleado")} </label>
                <select
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                  value={bulkForm.employeeId}
                  onChange={(e) =>
                    setBulkForm({
                      ...bulkForm,
                      employeeId: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>{translateCopy("Todos los empleados de esta sede")}</option>
                  {branchEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.lastName ?? ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500">
                   {translateCopy("Rol del turno")} </label>
                <select
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                  value={bulkForm.roleId}
                  onChange={(e) => { setBulkForm({ ...bulkForm, roleId: Number(e.target.value) }); setBulkFieldErrors((current) => ({ ...current, roleId: "" })); }}
                  aria-invalid={!!bulkFieldErrors.roleId}
                >
                  <option value={0}>{translateCopy("Selecciona...")}</option>
                  {operationalRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {translateCopy(role.name)}
                    </option>
                  ))}
                </select>
                {bulkFieldErrors.roleId && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(bulkFieldErrors.roleId)}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500">
                     {translateCopy("Hora inicio")} </label>
                  <input
                    type="time"
                    disabled
                    step={60}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-500 bg-gray-100 cursor-not-allowed"
                    value={bulkForm.startTime}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">
                     {translateCopy("Hora fin")} </label>
                  <input
                    type="time"
                    disabled
                    step={60}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-500 bg-gray-100 cursor-not-allowed"
                    value={bulkForm.endTime}
                  />
                </div>
              </div>
              {branchHours && (
                <p className="text-[11px] text-gray-400 -mt-2">
                  {translateCopy("Horario de la sede:")} {formatTime12h(branchHours.open)} –{" "}
                  {formatTime12h(branchHours.close)}
                </p>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-2">
                   {translateCopy("Días de esta semana")} </label>
                <div className="flex gap-1.5 flex-wrap">
                  {weekDays.map((d, i) => {
                    const past = isPastDate(toISODate(d));
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={past}
                        onClick={() => toggleBulkDay(i)}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                          bulkForm.days.includes(i)
                            ? "bg-[#EA1D2C] text-white border-[#EA1D2C]"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {formatDayLabel(d)} {formatDayHeader(d)}
                      </button>
                    );
                  })}
                </div>
                {bulkFieldErrors.days && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(bulkFieldErrors.days)}</p>}
                <p className="text-[10px] text-gray-400 mt-2">
                   {translateCopy("Si un empleado ya tiene turno en alguno de estos días, ese día se omite automáticamente (no se duplica).")} </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-gray-500 font-semibold hover:bg-gray-100"
              >
                 {translateCopy("Cancelar")} </button>
              <button
                onClick={handleBulkSubmit}
                disabled={bulkSaving}
                className="px-6 py-2.5 rounded-xl bg-[#EA1D2C] text-white font-bold shadow-sm hover:shadow-md hover:bg-[#D91B29] transition-all disabled:opacity-40"
              >
                {bulkSaving ? translateCopy("Asignando...") : translateCopy("Asignar turnos")}
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        isOpen={!!transferTarget}
        title={translateCopy("Trasladar a otra sede")}
        subtitle={
          transferTarget
            ? `${transferTarget.name} ${transferTarget.lastName ?? ""}`.trim()
            : undefined
        }
        onClose={() => setTransferTarget(null)}
      >
        {transferError && (
          <div className="bg-red-100 text-[#EF4444] px-4 py-3 rounded-xl mb-4 text-sm font-medium">
            {translateCopy(transferError)}
          </div>
        )}
        {transferSuccessMsg ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
              {translateCopy(transferSuccessMsg)}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setTransferTarget(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#111827] text-white hover:bg-gray-800 transition-colors"
              >
                 {translateCopy("Cerrar")} </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
               {translateCopy("Todos los turnos futuros (de hoy en adelante) de este empleado se moverán a la nueva sede. Los turnos pasados quedan intactos, como historial de la sede donde realmente ocurrieron.")} </p>
            <div>
              <label className="text-xs font-semibold text-gray-500">
                 {translateCopy("Sede destino")} </label>
              <select
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                value={transferBranchId}
                onChange={(e) =>
                  { setTransferBranchId(e.target.value ? Number(e.target.value) : ""); setTransferBranchError(""); }
                }
                aria-invalid={!!transferBranchError}
              >
                <option value="">{translateCopy("Selecciona...")}</option>
                {allBranches
                  .filter((b) => b.id !== transferTarget?.branchId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
              {transferBranchError && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(transferBranchError)}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setTransferTarget(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                 {translateCopy("Cancelar")} </button>
              <button
                onClick={handleConfirmTransfer}
                disabled={transferring}
                className="bg-[#EA1D2C] hover:bg-[#D91B29] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {transferring ? translateCopy("Trasladando...") : translateCopy("Confirmar traslado")}
              </button>
            </div>
          </div>
        )}
      </Dialog>
      <Dialog
        isOpen={mailConfirmOpen}
        title={translateCopy("Enviar horarios de la semana")}
        onClose={() => { if (!mailSending) setMailConfirmOpen(false); }}
      >
        <p className="text-sm leading-6 text-slate-600">
          {translateCopy(`Vas a enviar por correo los turnos de ${formatDayHeader(weekStart)} a ${formatDayHeader(weekEnd)} de la sede seleccionada. Cada empleado recibirá solamente su propio horario. El sistema omitirá a quienes no tengan correo registrado.`)}
        </p>
        <p className="mt-3 text-sm font-medium text-slate-700">
          {translateCopy(`Empleados con turnos: ${new Set(weekSchedules.map((shift) => shift.employeeId)).size}`)}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" disabled={mailSending}
            onClick={() => setMailConfirmOpen(false)}
            className="rounded-lg border border-slate-200 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {translateCopy("Cancelar")}
          </button>
          <button type="button" disabled={mailSending || !branchId || weekSchedules.length === 0}
            onClick={() => void sendWeekSchedulesByEmail()}
            className="rounded-lg bg-[#EA1D2C] px-5 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            {mailSending ? translateCopy("Enviando correos...") : translateCopy("Confirmar envío")}
          </button>
        </div>
      </Dialog>
      <Dialog
        isOpen={noHoursAlert}
        title={translateCopy("Falta configurar el horario de la sede")}
        onClose={() => setNoHoursAlert(false)}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-xl flex-shrink-0">
            ⏰
          </div>
          <p className="text-sm text-gray-600 pt-1.5">
             {translateCopy("Esta sede aún no tiene hora de apertura y de cierre. Configúralas en")}{" "}
            <strong>
               {translateCopy("Configuración → Ajustes del Restaurante → Ajustes Operativos")} </strong>{" "}
             {translateCopy("antes de crear turnos. Los turnos usan ese horario como límite.")} </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setNoHoursAlert(false)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
             {translateCopy("Cerrar")} </button>
          <button
            onClick={() => {
              setNoHoursAlert(false);
              router.push("/config");
            }}
            className="bg-[#EA1D2C] hover:bg-[#D91B29] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm"
          >
             {translateCopy("Ir a Configuración")} </button>
        </div>
      </Dialog>

      <Dialog
        isOpen={confirmDeleteId !== null}
        title={translateCopy("Eliminar turno")}
        onClose={() => setConfirmDeleteId(null)}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-xl flex-shrink-0">
            ⚠️
          </div>
          <p className="text-sm text-gray-600 pt-1.5">
             {translateCopy("¿Seguro que deseas eliminar este turno? Esta acción no se puede deshacer.")} </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setConfirmDeleteId(null)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
             {translateCopy("Cancelar")} </button>
          <button
            onClick={handleConfirmDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {deleting ? translateCopy("Eliminando...") : translateCopy("Eliminar")}
          </button>
        </div>
      </Dialog>
    </div>
  );
};

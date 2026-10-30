"use client";

import { useRememberedUiState } from "@/lib/use-remembered-ui-state";
import { deferEffect } from "@/lib/defer-effect";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useEmployeeSchedules } from "../hooks/use-employee-schedules";
import { employeeScheduleService } from "../services/employee-schedule.service";
import { useEmployees } from "@/features/Employees/hooks/use-employees";
import { useRoles } from "@/features/Employees/hooks/use-roles";
import { useMyBranch } from "@/features/branches/hooks/use-my-branch";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useRealtimeEvents } from "@/features/Dashboard/hooks/use-realtime-events";
import { useAdminDataChanged } from "@/features/Dashboard/hooks/use-admin-data-changed";
import { branchService } from "@/features/branches/services/branch.service";
import type { Branch } from "@/features/branches/types/branch.types";
import type { CreateEmployeeSchedulePayload, EmployeeSchedule } from "../types/employee-schedule.types";
import type { Employee } from "@/features/Employees/types/employee.types";
import { useRouter } from "next/navigation";
import { branchOperationalSettingsService } from "@/features/Configurations/services/branch-operational-settings.service";
import { consumeNavigationTarget, pendingNavigationKeys } from "@/config/pending-navigation";
import { emptyForm, type BranchEmployee, toTimeInputValue, toISODate, isGerenteRole, isManagementRoleName, getColombiaNow } from "./schedules-utils";

export function useSchedulesData() {
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
  }, [setBranchHours]);

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
  }, [loadBranchHours, setNoHoursAlert, setForm, setFormError, setIsModalOpen, setScheduleFieldErrors]);

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

  return { t, session, isGerente, router, now, setNow, myBranch, allBranches, setAllBranches, selectedBranchId, setSelectedBranchId, branchReady, transferTarget, setTransferTarget, transferBranchId, setTransferBranchId, transferring, setTransferring, transferError, setTransferError, transferBranchError, setTransferBranchError, transferSuccessMsg, setTransferSuccessMsg, mailConfirmOpen, setMailConfirmOpen, mailSending, setMailSending, mailMessage, setMailMessage, sendWeekSchedulesByEmail, loadAllBranches, branchId, PAGE_SIZE, search, setSearch, page, setPage, previousBranchId, schedules, loading, error, createSchedule, updateSchedule, deleteSchedule, refetch, employees, refetchEmployees, roles, branchHours, setBranchHours, noHoursAlert, setNoHoursAlert, loadBranchHours, refreshBranchHours, refreshBranchHoursAfterReconnect, isModalOpen, setIsModalOpen, editingId, setEditingId, form, setForm, saving, setSaving, formError, setFormError, scheduleFieldErrors, setScheduleFieldErrors, openCreateModal, emptyBulkForm, isBulkModalOpen, setIsBulkModalOpen, bulkForm, setBulkForm, bulkSaving, setBulkSaving, bulkError, setBulkError, bulkFieldErrors, setBulkFieldErrors, startOfToday, savedWeekIso, setSavedWeekIso, parsedWeek, weekStart, setWeekStart, weekDays, weekEnd, goToPrevWeek, goToNextWeek, goToThisWeek, employeesById, isHistoricalAtSelectedBranch, schedulesForSelectedBranch, weekSchedules, historicalWeekSchedules, historicalEmployeeIds, branchEmployeesById, branchEmployees, filteredEmployees, totalPages, currentPage, visibleEmployees, operationalRoles, employeesWithoutSchedule, scheduleLookup, selectedEmployee, selectedBranchHours, selectedRole, needsCvWarning, checkCrossBranchConflict };
}

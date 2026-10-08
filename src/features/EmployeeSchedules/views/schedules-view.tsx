"use client";

import { useEffect, useState } from "react";
import { useEmployeeSchedules } from "../hooks/use-employee-schedules";
import { Dialog } from "@/components/ui/dialog";
import { employeeScheduleService } from "../services/employee-schedule.service";
import { useEmployees } from "@/features/Employees/hooks/use-employees";
import { useRoles } from "@/features/Employees/hooks/use-roles";
import { useMyBranch } from "@/features/branches/hooks/use-my-branch";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { branchService } from "@/features/branches/services/branch.service";
import type { Branch } from "@/features/branches/types/branch.types";
import type {
  CreateEmployeeSchedulePayload,
  EmployeeSchedule,
} from "../types/employee-schedule.types";
import { ROUTES } from "@/config/routes";
import { useRouter, useSearchParams } from "next/navigation";

const emptyForm: CreateEmployeeSchedulePayload = {
  employeeId: 0,
  roleId: 0,
  branchId: 0,
  shiftDate: new Date().toISOString().slice(0, 10),
  startTime: "08:00",
  endTime: "17:00",
};

// Convierte "HH:mm" o "HH:mm:ss" a formato 12h con AM/PM, ej: "08:00" -> "8:00 a. m."
function formatTime12h(time: string): string {
  const [hoursStr, minutesStr] = time.split(":");
  const hours = Number(hoursStr);
  const minutes = minutesStr ?? "00";
  const date = new Date();
  date.setHours(hours, Number(minutes), 0, 0);
  return date.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Ya no es un arreglo fijo — se calcula según el día real de cada fecha,
// porque la semana ahora puede arrancar en cualquier día (no solo lunes).
function formatDayLabel(date: Date): string {
  const label = date.toLocaleDateString("es-CO", { weekday: "short" });
  // Ej: "dom." -> "Dom", "lun." -> "Lun"
  const clean = label.replace(".", "");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}



function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDayHeader(date: Date): string {
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}
// Detecta si un empleado tiene rol Gerente, sin importar cómo venga
// estructurado el campo en el objeto (roleName, role.name, role, etc.)
function isGerenteRole(emp: any): boolean {
  const roles: string[] = emp.roleNames ?? [];
  return roles.some((r) => r.toUpperCase().includes("GERENTE"));
}
function isPastDate(dateISO: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateISO}T00:00:00`);
  return target < today;
}
export const SchedulesView = () => {


  const { session } = useAuth();
  const isGerente = session?.roles.includes("GERENTE");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Administrador: su sede fija. Gerente: no aplica (elige de una lista).
  const { branch: myBranch } = useMyBranch(!!session && !isGerente);

  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [transferTarget, setTransferTarget] = useState<any>(null);
  const [transferBranchId, setTransferBranchId] = useState<number | "">("");
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [transferSuccessMsg, setTransferSuccessMsg] = useState("");
  // Si es Gerente, carga TODAS las sedes para que elija.
  useEffect(() => {
    if (isGerente) {
      branchService.getAll().then((branches) => {
        setAllBranches(branches);
        if (branches.length > 0) setSelectedBranchId(branches[0].id);
      });
    }
  }, [isGerente]);

  // Si es Administrador, usa directamente su propia sede.
  useEffect(() => {
    if (!isGerente && myBranch) {
      setSelectedBranchId(myBranch.id);
    }
  }, [isGerente, myBranch]);

  const branchId = selectedBranchId;

  const {
    schedules,
    loading,
    error,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    refetch,
  } = useEmployeeSchedules(branchId);
  const { employees } = useEmployees("activo");
  const { roles } = useRoles();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateEmployeeSchedulePayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

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
  const [bulkError, setBulkError] = useState("");

  // --- Semana seleccionada ---
  function startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // La semana sigue arrancando en "hoy" por defecto, pero se puede
  // navegar libremente hacia atrás para CONSULTAR semanas pasadas.
  const [weekStart, setWeekStart] = useState<Date>(() => startOfToday());
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

  // Solo turnos dentro de la semana visible
  const weekSchedules = schedules.filter((s) => {
    const shiftDate = new Date(`${s.shiftDate}T00:00:00`);
    return shiftDate >= weekStart && shiftDate <= weekEnd;
  });

  // Empleados de esta sede (con o sin turnos asignados esta semana)
  // Igual que con Productos: null = disponible para cualquier sede.
  // Solo excluimos empleados que tienen una sede fija DISTINTA a la seleccionada.
// Empleados a mostrar en la tabla de esta sede: los asignados actualmente
// a ella, MÁS cualquier empleado que tenga turnos (pasados o futuros)
// registrados con este branchId — así el historial de alguien que ya
// fue trasladado sigue siendo visible al consultar su sede anterior.
const employeeIdsWithScheduleHere = new Set(schedules.map((s) => s.employeeId));

const branchEmployees = employees.filter(
  (emp: any) =>
    !isGerenteRole(emp) &&
    (emp.branchId === branchId ||
      emp.branchId === null ||
      employeeIdsWithScheduleHere.has(emp.id)),
);

// Ya no se excluyen Gerente/Administrador: sí se pueden asignar desde un
// turno, igual que cualquier otro rol operativo.
const operationalRoles = roles;

  // Empleados sin ningún turno esta semana (para el selector del modal,
  // igual que antes evitamos duplicar turnos por accidente en el mismo día)
const employeesWithoutSchedule = employees.filter(
  (emp: any) =>
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
  // Si venimos desde "Registrar Empleado" con ?employeeId=X, abrimos el
  // modal automáticamente con ese empleado y SU sede real (no la que
  // estuviera puesta por defecto en el dropdown).
  useEffect(() => {
    const employeeIdParam = searchParams.get("employeeId");
    if (!employeeIdParam || employees.length === 0) return;

    const employeeId = Number(employeeIdParam);
    const employee = employees.find((emp: any) => emp.id === employeeId);
    if (!employee) return;

    const employeeBranchId = employee.branchId ?? branchId;
    if (!employeeBranchId) return;

    if (isGerente && employeeBranchId !== selectedBranchId) {
      setSelectedBranchId(employeeBranchId);
    }

    setForm({ ...emptyForm, branchId: employeeBranchId, employeeId });
    setFormError("");
    setIsModalOpen(true);

    router.replace("/schedules");
  }, [searchParams, employees, isGerente, selectedBranchId, branchId]);

  const selectedEmployee = employees.find((e: any) => e.id === form.employeeId);
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
    if (!form.employeeId || !form.roleId) {
      setFormError("Selecciona empleado y rol.");
      return;
    }
    if (!form.branchId) {
      setFormError("Selecciona una sede para el turno.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
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
        await updateSchedule(editingId, form);
        setIsModalOpen(false);
        setEditingId(null);
        return;
      }

      const employeeIdCreated = form.employeeId;
      await createSchedule(form);
      setIsModalOpen(false);
      router.push(`${ROUTES.employees}?editEmployeeId=${employeeIdCreated}`);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "No se pudo guardar el turno",
      );
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (s: EmployeeSchedule) => {
    if (isPastDate(s.shiftDate)) return; // no se editan turnos de fechas pasadas
    setEditingId(s.id);
    setForm({
      employeeId: s.employeeId,
      roleId: s.roleId,
      branchId: s.branchId,
      shiftDate: s.shiftDate,
      startTime: s.startTime.slice(0, 5),
      endTime: s.endTime.slice(0, 5),
    });
    setFormError("");
    setIsModalOpen(true);
  };

  // --- Guardado masivo: mismo turno para varios días de la semana ---
  const handleBulkSubmit = async () => {
    if (!bulkForm.roleId) {
      setBulkError("Selecciona un rol.");
      return;
    }
    if (bulkForm.days.length === 0) {
      setBulkError("Selecciona al menos un día.");
      return;
    }
    if (!branchId) {
      setBulkError("Selecciona una sede.");
      return;
    }

    let targetEmployees =
      bulkForm.employeeId === 0
        ? branchEmployees
        : branchEmployees.filter((e: any) => e.id === bulkForm.employeeId);

    // El Gerente decide manualmente si este lote de turnos exige CV,
    // sin importar la configuración individual de cada rol.
    const skippedForCv: string[] = [];
    if (bulkForm.requiresCv) {
      const withCv = targetEmployees.filter((e: any) => e.hasCv);
      const withoutCv = targetEmployees.filter((e: any) => !e.hasCv);
      withoutCv.forEach((e: any) =>
        skippedForCv.push(`${e.name} ${e.lastName ?? ""}`.trim()),
      );
      targetEmployees = withCv;
    }

    if (targetEmployees.length === 0) {
      setBulkError(
        skippedForCv.length > 0
          ? `Ningún empleado seleccionado tiene hoja de vida cargada: ${skippedForCv.join(", ")}.`
          : "No hay empleados para asignar.",
      );
      return;
    }

    setBulkSaving(true);
    setBulkError("");
    try {
      // Traemos, UNA vez por empleado del lote, todos sus turnos en
      // cualquier sede (no solo la actual), para detectar choques.
      const crossBranchByEmployee = new Map<number, EmployeeSchedule[]>();
      await Promise.all(
        targetEmployees.map(async (emp: any) => {
          const allShifts = await employeeScheduleService.getByEmployee(emp.id);
          crossBranchByEmployee.set(emp.id, allShifts);
        }),
      );

      const jobs: { emp: any; dateISO: string }[] = [];
      const skippedForConflict: string[] = [];

      targetEmployees.forEach((emp: any) => {
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
        setBulkError(
          "Todos los empleados seleccionados ya tienen turno en esos días.",
        );
        setBulkSaving(false);
        return;
      }

      const results = await Promise.allSettled(
        jobs.map((job) =>
          employeeScheduleService.create({
            employeeId: job.emp.id,
            roleId: bulkForm.roleId,
            branchId: branchId,
            shiftDate: job.dateISO,
            startTime: bulkForm.startTime,
            endTime: bulkForm.endTime,
          }),
        ),
      );

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
        let message = `Se crearon ${successCount} de ${results.length} turnos.`;
        if (failed.length > 0) {
          message += ` ${failed.length} fallaron: ${failureReasons.join(" | ")}`;
        }
        if (skippedForCv.length > 0) {
          message += ` Omitidos por falta de CV: ${skippedForCv.join(", ")}.`;
        }
        if (skippedForConflict.length > 0) {
          message += ` Omitidos por choque de sede: ${skippedForConflict.join("; ")}.`;
        }
        setBulkError(message);
      }
    } catch (err) {
      setBulkError(
        err instanceof Error ? err.message : "No se pudo asignar la semana",
      );
    } finally {
      setBulkSaving(false);
    }
  };

  const toggleBulkDay = (dayIndex: number) => {
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

  const openTransferModal = (emp: any) => {
    setTransferTarget(emp);
    setTransferBranchId("");
    setTransferError("");
    setTransferSuccessMsg("");
  };

  const handleConfirmTransfer = async () => {
    if (!transferTarget || !transferBranchId) {
      setTransferError("Selecciona la sede destino.");
      return;
    }
    if (transferBranchId === transferTarget.branchId) {
      setTransferError("Esa ya es la sede actual del empleado.");
      return;
    }
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
      await refetch();
    } catch (err) {
      setTransferError(
        err instanceof Error ? err.message : "No se pudo trasladar al empleado",
      );
    } finally {
      setTransferring(false);
    }
  };
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#081A38]">Turnos</h1>
          <p className="text-base text-gray-500">
            Asigna a cada empleado un turno con rol activo, sede y horario.
          </p>

          {isGerente && (
            <div className="mt-3">
              <label className="text-xs font-semibold text-gray-500 mr-2">
                Sede:
              </label>
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

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={goToPrevWeek}
              className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
              aria-label="Semana anterior"
            >
              ←
            </button>
            <span className="text-sm font-semibold text-[#081A38]">
              {formatDayHeader(weekStart)} – {formatDayHeader(weekEnd)}
            </span>
            <button
              onClick={goToNextWeek}
              className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
              aria-label="Semana siguiente"
            >
              →
            </button>
            <button
              onClick={goToThisWeek}
              className="text-xs font-semibold text-[#EA1D2C] hover:underline ml-1"
            >
              Hoy
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            setBulkForm(emptyBulkForm);
            setBulkError("");
            setIsBulkModalOpen(true);
          }}
          disabled={!branchId}
          className="bg-[#EA1D2C] text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-40"
        >
          + Asignar semana completa
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <p className="text-center py-10 text-gray-400">Cargando turnos...</p>
        ) : branchEmployees.length === 0 ? (
          <p className="text-center py-10 text-gray-400">
            No hay empleados activos en esta sede.
          </p>
        ) : (
          <table className="w-full text-base table-fixed">
            <thead className="bg-gray-50 text-gray-500 uppercase text-sm">
              <tr>
                <th className="text-left px-4 py-4 w-44">Empleado</th>
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
              {branchEmployees.map((emp: any) => (
                <tr key={emp.id} className="border-t border-gray-100">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-[#081A38] text-base">
                      {emp.name} {emp.lastName ?? ""}
                    </p>
                    {emp.branchId !== branchId && emp.branchId !== null && (
                      <p className="text-[10px] text-gray-400 italic">
                        Trasladado a otra sede — solo historial
                      </p>
                    )}
                    {isGerente && emp.branchId === branchId && (
                      <button
                        onClick={() => openTransferModal(emp)}
                        className="text-[10px] font-semibold text-gray-400 hover:text-[#EA1D2C] transition-colors mt-0.5"
                      >
                        Trasladar de sede
                      </button>
                    )}
                  </td>
                  {weekDays.map((d, i) => {
                    const dateISO = toISODate(d);
                    const dayShifts =
                      scheduleLookup.get(`${emp.id}_${dateISO}`) ?? [];
                    return (
                      <td key={i} className="text-center px-1 py-2">
                        {dayShifts.length === 0 ? (
                          <button
                            onClick={() => {
                              if (isPastDate(dateISO)) return; // no se crean turnos en fechas pasadas
                              setForm({
                                ...emptyForm,
                                branchId: branchId ?? 0,
                                employeeId: emp.id,
                                shiftDate: dateISO,
                              });
                              setFormError("");
                              setIsModalOpen(true);
                            }}
                            disabled={isPastDate(dateISO)}
                            className="w-full text-gray-300 hover:text-[#EA1D2C] text-lg py-3 rounded-md hover:bg-red-50 transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        ) : (
                          dayShifts.map((s) => {
                            const locked = isPastDate(s.shiftDate);
                            return (
                              <div
                                key={s.id}
                                className={`rounded-lg px-2 py-2 text-sm font-semibold mb-1 relative group ${
                                  locked
                                    ? "bg-gray-100 text-gray-400"
                                    : "bg-[#0F2F6B]/10 text-[#0F2F6B]"
                                }`}
                              >
                                <div>
                                  {formatTime12h(s.startTime)} –{" "}
                                  {formatTime12h(s.endTime)}
                                </div>
                                <div
                                  className={`text-xs font-normal mt-0.5 ${locked ? "text-gray-400" : "text-[#0F2F6B]/70"}`}
                                >
                                  {s.roleName}
                                </div>
                                {!locked && (
                                  <div className="absolute -top-1.5 -right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => openEditModal(s)}
                                      className="w-5 h-5 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-[#0F2F6B] hover:border-[#0F2F6B]/40 text-xs flex items-center justify-center"
                                      aria-label="Editar turno"
                                    >
                                      ✎
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(s.id)}
                                      className="w-5 h-5 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 text-xs flex items-center justify-center"
                                      aria-label="Eliminar turno"
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

      {isModalOpen && (
        <div
          onClick={() => {
            setIsModalOpen(false);
            setEditingId(null);
          }}
          className={`
          fixed inset-0 z-50 flex items-center justify-center
          bg-black/50 backdrop-blur-sm
          transition-all duration-300
        `}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`
            relative w-[90%] max-w-md bg-white rounded-3xl
            shadow-[0_20px_80px_rgba(0,0,0,0.25)]
            border border-[#E5E7EB] overflow-hidden
            px-8 py-10
            transition-all duration-300
            scale-100 translate-y-0 opacity-100
          `}
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#EA1D2C] to-[#F87171]" />

            <h2 className="text-2xl font-extrabold text-[#111827] mb-6">
              {editingId ? "Editar turno" : "Nuevo turno"}
            </h2>

            {formError && (
              <div className="bg-red-100 text-[#EF4444] px-4 py-3 rounded-xl mb-4 text-sm font-medium">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500">
                  Empleado
                </label>
                <select
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                  value={form.employeeId}
                  onChange={(e) => {
                    const empId = Number(e.target.value);
                    const selected = employees.find(
                      (emp: any) => emp.id === empId,
                    );
                    setForm({
                      ...form,
                      employeeId: empId,
                      branchId: isGerente
                        ? (selected?.branchId ?? form.branchId)
                        : (myBranch?.id ?? 0),
                    });
                    setFormError("");
                  }}
                >
                  <option value={0}>Selecciona...</option>
                  {employeesWithoutSchedule.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.lastName ?? ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">
                  Sede
                </label>
                {isGerente ? (
                  <select
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                    value={form.branchId}
                    onChange={(e) =>
                      setForm({ ...form, branchId: Number(e.target.value) })
                    }
                  >
                    <option value={0}>Selecciona...</option>
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
                    value={myBranch?.name ?? "Sin sede asignada"}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-500 bg-gray-100"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500">
                  Rol del turno
                </label>
                <select
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                  value={form.roleId}
                  onChange={(e) =>
                    setForm({ ...form, roleId: Number(e.target.value) })
                  }
                >
                  <option value={0}>Selecciona...</option>
                  {operationalRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              {needsCvWarning && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-xs text-orange-700">
                  <strong>{selectedEmployee?.name}</strong> no tiene hoja de
                  vida cargada, y el rol <strong>{selectedRole?.name}</strong>{" "}
                  la requiere. Ve a "Gestión de Talento", edita a este empleado
                  y sube su CV antes de poder asignarle este turno.
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500">
                  Fecha
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                  value={form.shiftDate}
                  onChange={(e) =>
                    setForm({ ...form, shiftDate: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500">
                    Hora inicio
                  </label>
                  <input
                    type="time"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm({ ...form, startTime: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">
                    Hora fin
                  </label>
                  <input
                    type="time"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm({ ...form, endTime: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                }}
                className="px-4 py-2.5 rounded-xl text-gray-500 font-semibold hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || needsCvWarning}
                className="px-6 py-2.5 rounded-xl bg-[#EA1D2C] text-white font-bold shadow-sm hover:shadow-md hover:bg-[#D91B29] transition-all disabled:opacity-40"
              >
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Guardar cambios"
                    : "Crear turno"}
              </button>
            </div>
          </div>
        </div>
      )}
      {isBulkModalOpen && (
        <div
          onClick={() => setIsBulkModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-[90%] max-w-md bg-white rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.25)] border border-[#E5E7EB] overflow-hidden px-8 py-10"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#EA1D2C] to-[#F87171]" />

            <h2 className="text-2xl font-extrabold text-[#111827] mb-1">
              Asignar semana completa
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Crea el mismo turno para uno o varios días de esta semana.
            </p>

            {bulkError && (
              <div className="bg-red-100 text-[#EF4444] px-4 py-3 rounded-xl mb-4 text-sm font-medium whitespace-pre-wrap">
                {bulkError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500">
                  Empleado
                </label>
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
                  <option value={0}>Todos los empleados de esta sede</option>
                  {branchEmployees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.lastName ?? ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500">
                  Rol del turno
                </label>
                <select
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                  value={bulkForm.roleId}
                  onChange={(e) =>
                    setBulkForm({ ...bulkForm, roleId: Number(e.target.value) })
                  }
                >
                  <option value={0}>Selecciona...</option>
                  {operationalRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500">
                    Hora inicio
                  </label>
                  <input
                    type="time"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                    value={bulkForm.startTime}
                    onChange={(e) =>
                      setBulkForm({ ...bulkForm, startTime: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">
                    Hora fin
                  </label>
                  <input
                    type="time"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                    value={bulkForm.endTime}
                    onChange={(e) =>
                      setBulkForm({ ...bulkForm, endTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-2">
                  Días de esta semana
                </label>
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
                <p className="text-[10px] text-gray-400 mt-2">
                  Si un empleado ya tiene turno en alguno de estos días, ese día
                  se omite automáticamente (no se duplica).
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-gray-500 font-semibold hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkSubmit}
                disabled={bulkSaving}
                className="px-6 py-2.5 rounded-xl bg-[#EA1D2C] text-white font-bold shadow-sm hover:shadow-md hover:bg-[#D91B29] transition-all disabled:opacity-40"
              >
                {bulkSaving ? "Asignando..." : "Asignar turnos"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        isOpen={!!transferTarget}
        title="Trasladar a otra sede"
        subtitle={
          transferTarget
            ? `${transferTarget.name} ${transferTarget.lastName ?? ""}`.trim()
            : undefined
        }
        onClose={() => setTransferTarget(null)}
      >
        {transferError && (
          <div className="bg-red-100 text-[#EF4444] px-4 py-3 rounded-xl mb-4 text-sm font-medium">
            {transferError}
          </div>
        )}
        {transferSuccessMsg ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
              {transferSuccessMsg}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setTransferTarget(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#111827] text-white hover:bg-gray-800 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Todos los turnos futuros (de hoy en adelante) de este empleado se
              moverán a la nueva sede. Los turnos pasados quedan intactos, como
              historial de la sede donde realmente ocurrieron.
            </p>
            <div>
              <label className="text-xs font-semibold text-gray-500">
                Sede destino
              </label>
              <select
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                value={transferBranchId}
                onChange={(e) =>
                  setTransferBranchId(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
              >
                <option value="">Selecciona...</option>
                {allBranches
                  .filter((b) => b.id !== transferTarget?.branchId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setTransferTarget(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmTransfer}
                disabled={transferring}
                className="bg-[#EA1D2C] hover:bg-[#D91B29] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {transferring ? "Trasladando..." : "Confirmar traslado"}
              </button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        isOpen={confirmDeleteId !== null}
        title="Eliminar turno"
        onClose={() => setConfirmDeleteId(null)}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-xl flex-shrink-0">
            ⚠️
          </div>
          <p className="text-sm text-gray-600 pt-1.5">
            ¿Seguro que deseas eliminar este turno? Esta acción no se puede
            deshacer.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setConfirmDeleteId(null)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </Dialog>
    </div>
  );
};

"use client";

import { translateCopy } from "@/config/copy-translations";
import { useState } from "react";
import { employeeScheduleService } from "../services/employee-schedule.service";
import type { EmployeeSchedule } from "../types/employee-schedule.types";
import { ROUTES } from "@/config/routes";
import { pendingNavigationKeys, rememberNavigationTarget } from "@/config/pending-navigation";
import { type BranchEmployee, toISODate, formatDayHeader, isPastDate } from "./schedules-utils";
import type { useSchedulesData } from "./schedules-data";
export function useSchedulesActions(data: ReturnType<typeof useSchedulesData>) {
  const { router, transferTarget, setTransferTarget, transferBranchId, setTransferBranchId, setTransferring, setTransferError, setTransferBranchError, setTransferSuccessMsg, branchId, schedules, createSchedule, updateSchedule, deleteSchedule, refetch, refetchEmployees, setNoHoursAlert, loadBranchHours, setIsModalOpen, editingId, setEditingId, form, setForm, setSaving, setFormError, setScheduleFieldErrors, setIsBulkModalOpen, bulkForm, setBulkForm, setBulkSaving, setBulkError, setBulkFieldErrors, weekDays, branchEmployees, checkCrossBranchConflict } = data;
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
  return { handleSubmit, openEditModal, handleBulkSubmit, toggleBulkDay, confirmDeleteId, setConfirmDeleteId, deleting, setDeleting, handleConfirmDelete, openTransferModal, handleConfirmTransfer };
}

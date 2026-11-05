"use client";

import { useRememberedUiState } from "@/lib/use-remembered-ui-state";
import { deferEffect } from "@/lib/defer-effect";
import { translateCopy } from "@/config/copy-translations";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useEmployees } from "../hooks/use-employees";
import { employeeService } from "../services/employee.service";
import { useRoles } from "../hooks/use-roles";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useBranches } from "@/features/branches/hooks/use-branches";
import { useMyBranch } from "@/features/branches/hooks/use-my-branch";
import type { Employee, EmployeeStatusFilter } from "../types/employee.types";
import { useRouter } from "next/navigation";
import { consumeNavigationTarget, pendingNavigationKeys } from "@/config/pending-navigation";
import { type NotifyState, INITIAL_FORM, ITEMS_PER_PAGE } from "./employees-utils";

export function useEmployeesModel() {
  const { t } = useTranslation();
  const [estado, setEstado] = useRememberedUiState<EmployeeStatusFilter>("employees", "status", "activo");
  const {
    employees,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
    deleteEmployeePermanently,
  } = useEmployees(estado);
  const { roles, updateRequiresCvBulk } = useRoles();
  const { session, isHydrated } = useAuth();
  const isGerente =
    session?.roles?.some((r) => r.toUpperCase() === "GERENTE") ?? false;
  const isAdmin =
    !isGerente &&
    (session?.roles?.some((r) => r.toUpperCase() === "ADMINISTRADOR") ?? false);

  // Gerente: lista completa de sedes. Administrador: solo la suya.
  const { branches: allBranches } = useBranches(isHydrated && !isAdmin);
  const { branch: myBranch } = useMyBranch(isHydrated && isAdmin);
  const branches = isAdmin ? (myBranch ? [myBranch] : []) : allBranches;

  const router = useRouter();
  const [autoOpenedEditId, setAutoOpenedEditId] = useState<number | null>(
    null,
  );
  const [justCreatedEmployee, setJustCreatedEmployee] = useState<{
    id: number;
    name: string;
  } | null>(null);
    const staffRoles = roles.filter(
      (r) => !["CLIENTE", "GERENTE", "ADMINISTRADOR"].includes(r.name),
    );
  const [savingCvRequirement, setSavingCvRequirement] = useState(false);
  // "Activado" solo si TODOS los roles operativos exigen CV.
  // Si están mezclados (algunos sí, otros no), se muestra como apagado
  // y el próximo click los deja a todos en true.
  const allRequireCv =
    staffRoles.length > 0 && staffRoles.every((r) => r.requiresCv);

  const handleToggleCvRequirement = async () => {
    setSavingCvRequirement(true);
    try {
      await updateRequiresCvBulk(staffRoles, !allRequireCv);
      setNotify({
        message: translateCopy(
          !allRequireCv
            ? "La hoja de vida ahora es obligatoria para todo el personal operativo."
            : "La hoja de vida ya no es obligatoria para todo el personal operativo.",
        ),
        type: "success",
      });
    } catch (err) {
      setNotify({
        message:
          err instanceof Error
            ? translateCopy(err.message)
            : translateCopy("No se pudo actualizar el requisito"),
        type: "error",
      });
    } finally {
      setSavingCvRequirement(false);
    }
  };
  const [confirmDeactivate, setConfirmDeactivate] = useState<Employee | null>(
    null,
  );
  const [confirmReactivate, setConfirmReactivate] = useState<Employee | null>(
    null,
  );
  const [confirmDeleteEmployee, setConfirmDeleteEmployee] =
    useState<Employee | null>(null);
  const [currentPage, setCurrentPage] = useRememberedUiState<number>("employees", "page", 1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [notify, setNotify] = useState<NotifyState>(null);
  const [loadingCv, setLoadingCv] = useState(false);
 const [form, setForm] = useState(INITIAL_FORM);
 const [formStep, setFormStep] = useState(1);
 const [stepError, setStepError] = useState("");
 const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => deferEffect(() => {
    if (!isAdmin || !isFormOpen || !myBranch) return;
    const branchId = String(myBranch.id);
    setForm((current) =>
      current.branchId === branchId ? current : { ...current, branchId },
    );
  }), [isAdmin, isFormOpen, myBranch]);

  // El CV ya no se exige aquí: se valida al crear el turno con un rol
  // que lo requiera, en la pantalla de Turnos.
  const cvIsRequired = false;

  // El Gerente sin turno hoy (el General sembrado) no se muestra en Personal.
  // Si un Gerente tiene turno hoy (asignado por otro Gerente), sí aparece.
  const visibleEmployees = employees.filter((e) => {
    // Defensa adicional: nunca mostrar un "Activo" cuando se eligio "Retirados".
    const status = e.status.trim().toLowerCase();
    const matchesStatus =
      estado === "todos" ||
      (estado === "activo" && status === "activo") ||
      (estado === "retirado" && status === "retirado");
    const isUnassignedManager =
      e.roleNames.some((r) => r.toUpperCase() === "GERENTE") &&
      e.todayShiftState === "None";
    return matchesStatus && !isUnassignedManager;
  });

  const totalPages = Math.max(1, Math.ceil(visibleEmployees.length / ITEMS_PER_PAGE));
  useEffect(() => {
    if (!loading && currentPage > totalPages) setCurrentPage(totalPages);
  }, [loading, currentPage, totalPages, setCurrentPage]);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmployees = visibleEmployees.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );
const openCreate = () => {
  setEditingEmployee(null);
  setFieldErrors({});
  setForm({
    ...INITIAL_FORM,
    branchId: isAdmin && myBranch ? String(myBranch.id) : "",
  });
  setFormStep(1);
  setStepError("");
  setIsFormOpen(true);
};

  const openEdit = useCallback((emp: Employee) => {
    setEditingEmployee(emp);
    setFieldErrors({});
    setForm({
      name: emp.name,
      lastName: emp.lastName ?? "",
      document: emp.document,
      email: emp.email ?? "",
      phone: emp.phone ?? "",
      address: emp.address ?? "",
      branchId: emp.branchId ? String(emp.branchId) : "",
      basePay: String(emp.basePay ?? ""),
      roleIds: [],
      cv: null,
    });
    setFormStep(1);
    setStepError("");
    setIsFormOpen(true);
  }, [setEditingEmployee, setForm, setFormStep, setStepError, setIsFormOpen]);
  useEffect(() => deferEffect(() => {
    if (employees.length === 0) return;
    const employeeId = consumeNavigationTarget(
      pendingNavigationKeys.editEmployee,
    );
    if (employeeId === null || autoOpenedEditId === employeeId) return;

    const employee = employees.find((item) => item.id === employeeId);
    if (!employee) return;

    setAutoOpenedEditId(employeeId);
    openEdit(employee);
  }), [employees, autoOpenedEditId, openEdit]);
  const handleViewCv = async (emp: Employee) => {
    setLoadingCv(true);
    try {
      const blob = await employeeService.downloadCv(emp.id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank"); // se abre en pestaña nueva (PDF se ve directo)
      // liberamos memoria después de un momento
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch {
      setNotify({
        message: translateCopy("No se pudo cargar la hoja de vida"),
        type: "error",
      });
    } finally {
      setLoadingCv(false);
    }
  };

  const handleDownloadCv = async (emp: Employee) => {
    setLoadingCv(true);
    try {
      const blob = await employeeService.downloadCv(emp.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CV_${emp.name}_${emp.lastName ?? ""}`.trim();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      setNotify({
        message: translateCopy("No se pudo descargar la hoja de vida"),
        type: "error",
      });
    } finally {
      setLoadingCv(false);
    }
  };
  const openView = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsViewOpen(true);
  };

  const validateStep1 = (): string | null => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "El nombre es obligatorio.";
    else if (/\d/.test(form.name)) errors.name = "El nombre no puede contener números.";
    if (/\d/.test(form.lastName)) errors.lastName = "El apellido no puede contener números.";
    if (!editingEmployee && !form.document.trim()) errors.document = "El documento es obligatorio";
    if (!editingEmployee && !form.email.trim()) errors.email = "El correo es obligatorio";
    else if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Ingresa un correo electrónico válido";
    }
    if (form.phone.trim() && !/^(?:\d{7}|\d{10})$/.test(form.phone.trim())) {
      errors.phone = "El teléfono debe tener 7 dígitos (fijo) o 10 dígitos (celular), sin espacios ni guiones.";
    }
    if (form.address.trim() && (form.address.trim().length < 5 || form.address.trim().length > 255)) {
      errors.address = "La dirección debe tener entre 5 y 255 caracteres.";
    }
    setFieldErrors(errors);
    return Object.values(errors)[0] ?? null;
  };

  const validateStep2 = (): string | null => {
    const salary = Number(form.basePay);
    const errors: Record<string, string> = {};
    if (!form.basePay || !Number.isFinite(salary) || salary <= 0) {
      errors.basePay = "Ingresa un salario base válido";
    }
    setFieldErrors((current) => ({ ...current, basePay: errors.basePay ?? "" }));
    return errors.basePay ?? null;
  };

  const validateStep3 = (): string | null => {
    const errors: Record<string, string> = {};
    if (form.cv && form.cv.type !== "application/pdf") errors.cv = "El CV debe ser un archivo PDF";
    else if (form.cv && form.cv.size > 5 * 1024 * 1024) errors.cv = "El PDF no debe superar 5MB";
    else if (cvIsRequired && !form.cv && !editingEmployee?.hasCv) errors.cv = "Uno de los roles seleccionados requiere hoja de vida (CV)";
    setFieldErrors((current) => ({ ...current, cv: errors.cv ?? "" }));
    return errors.cv ?? null;
  };


  const goToNextStep = () => {
    const error = formStep === 1 ? validateStep1() : validateStep2();
    if (error) {
      setStepError(error);
      return;
    }
    setStepError("");
    setFormStep((s) => s + 1);
  };

  const goToPrevStep = () => {
    setStepError("");
    setFormStep((s) => s - 1);
  };
const handleSave = async () => {
  const error = validateStep3();
  if (error) {
    setStepError(error);
    return;
  }

  setSaving(true);
  try {
    if (editingEmployee) {
      await updateEmployee(editingEmployee.id, {
        name: form.name,
        lastName: form.lastName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        branchId: form.branchId ? Number(form.branchId) : undefined,
        status: editingEmployee.status,
        basePay: Number(form.basePay) || 0,
        cv: form.cv ?? undefined,
      });
      setNotify({
        message: translateCopy("Empleado actualizado correctamente"),
        type: "success",
      });
    } else {
      const result = await createEmployee({
        name: form.name,
        lastName: form.lastName || undefined,
        document: form.document,
        email: form.email,
        phone: form.phone || undefined,
        address: form.address || undefined,
        branchId: form.branchId ? Number(form.branchId) : undefined,
        basePay: Number(form.basePay) || 0,
        cv: form.cv ?? undefined,
      });
      setJustCreatedEmployee({ id: result.employeeId, name: form.name });
    }
    setIsFormOpen(false);
  } catch (err) {
    setNotify({
      message:
        err instanceof Error ? translateCopy(err.message) : translateCopy("No se pudo guardar el empleado"),
      type: "error",
    });
  } finally {
    setSaving(false);
  }
};

const handleToggleStatus = async (emp: Employee) => {
  const nextStatus = emp.status === "Activo" ? "Retirado" : "Activo";

  setSaving(true);
  try {
    if (nextStatus === "Retirado") {
      await deactivateEmployee(emp.id);
    } else {
      await updateEmployee(emp.id, {
        name: emp.name,
        lastName: emp.lastName ?? undefined,
        email: emp.email ?? undefined,
        phone: emp.phone ?? undefined,
        address: emp.address ?? undefined,
        branchId: emp.branchId ?? undefined,
        status: "Activo",
        basePay: emp.basePay,
      });
    }
    setNotify({
      message: `${translateCopy("Empleado")} ${nextStatus === "Activo" ? translateCopy("reactivado") : translateCopy("suspendido")} ${translateCopy("correctamente")}`,
      type: "success",
    });
  } catch (err) {
    setNotify({
      message:
        err instanceof Error ? translateCopy(err.message) : translateCopy("No se pudo actualizar el estado"),
      type: "error",
    });
  } finally {
    setSaving(false);
  }
};

const handlePermanentDelete = async (emp: Employee) => {
  setSaving(true);
  try {
    await deleteEmployeePermanently(emp.id);
    setConfirmDeleteEmployee(null);
    setNotify({
      message: translateCopy("Empleado eliminado permanentemente"),
      type: "success",
    });
  } catch (err) {
    setNotify({
      message:
        err instanceof Error
          ? translateCopy(err.message)
          : translateCopy("No se pudo eliminar el empleado"),
      type: "error",
    });
  } finally {
    setSaving(false);
  }
};

  return { t, estado, setEstado, employees, loading, error, createEmployee, updateEmployee, deactivateEmployee, deleteEmployeePermanently, roles, updateRequiresCvBulk, session, isHydrated, isGerente, isAdmin, allBranches, myBranch, branches, router, autoOpenedEditId, setAutoOpenedEditId, justCreatedEmployee, setJustCreatedEmployee, staffRoles, savingCvRequirement, setSavingCvRequirement, allRequireCv, handleToggleCvRequirement, confirmDeactivate, setConfirmDeactivate, confirmReactivate, setConfirmReactivate, confirmDeleteEmployee, setConfirmDeleteEmployee, currentPage, setCurrentPage, isFormOpen, setIsFormOpen, isViewOpen, setIsViewOpen, editingEmployee, setEditingEmployee, selectedEmployee, setSelectedEmployee, saving, setSaving, notify, setNotify, loadingCv, setLoadingCv, form, setForm, formStep, setFormStep, stepError, setStepError, fieldErrors, setFieldErrors, cvIsRequired, visibleEmployees, totalPages, startIndex, paginatedEmployees, openCreate, openEdit, handleViewCv, handleDownloadCv, openView, validateStep1, validateStep2, validateStep3, goToNextStep, goToPrevStep, handleSave, handleToggleStatus, handlePermanentDelete };
}

export type EmployeesModel = ReturnType<typeof useEmployeesModel>;

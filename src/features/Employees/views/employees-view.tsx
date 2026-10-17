"use client";

import { useRememberedUiState } from "@/lib/use-remembered-ui-state";
import { translateCopy } from "@/config/copy-translations";
import { formatMoney } from "@/lib/format-money";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog } from "@/components/ui/dialog";
import { NotificationModal } from "@/components/ui/modal";
import { useEmployees } from "../hooks/use-employees";
import { employeeService } from "../services/employee.service";
import { useRoles } from "../hooks/use-roles";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useBranches } from "@/features/branches/hooks/use-branches";
import { useMyBranch } from "@/features/branches/hooks/use-my-branch";
import type { Employee, EmployeeStatusFilter } from "../types/employee.types";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import {
  consumeNavigationTarget,
  pendingNavigationKeys,
  rememberNavigationTarget,
} from "@/config/pending-navigation";

type NotifyState = { message: string; type: "success" | "error" } | null;

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#111827] placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent transition-all";

const labelClass =
  "block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2";

const INITIAL_FORM = {
  name: "",
  lastName: "",
  document: "",
  email: "",
  phone: "",
  address: "",
  branchId: "",
  basePay: "",
  roleIds: [] as number[],
  cv: null as File | null,
};

const ITEMS_PER_PAGE = 10;

// El rol que se muestra es SOLO el del turno de hoy. "Cliente" nunca.
// Excepción: el Gerente General sembrado no tiene turnos, así que
// sin turno hoy se sigue mostrando como GERENTE.
const getDisplayRoles = (emp: Employee): string[] => {
  const today = (emp.todayRoleNames ?? []).filter(
    (r) => r.toUpperCase() !== "CLIENTE",
  );
  return today;
};

export const EmployeesView = () => {
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

  useEffect(() => {
    if (!isAdmin || !isFormOpen || !myBranch) return;
    const branchId = String(myBranch.id);
    setForm((current) =>
      current.branchId === branchId ? current : { ...current, branchId },
    );
  }, [isAdmin, isFormOpen, myBranch]);

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
  }, [loading, currentPage, totalPages]);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmployees = visibleEmployees.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );
  useEffect(() => {
    if (employees.length === 0) return;
    const employeeId = consumeNavigationTarget(
      pendingNavigationKeys.editEmployee,
    );
    if (employeeId === null) return;
    if (autoOpenedEditId === employeeId) return; // evita reabrir en cada render

    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    setAutoOpenedEditId(employeeId);
    openEdit(emp);
  }, [employees, autoOpenedEditId]);

const openCreate = () => {
  setEditingEmployee(null);
  setForm({
    ...INITIAL_FORM,
    branchId: isAdmin && myBranch ? String(myBranch.id) : "",
  });
  setFormStep(1);
  setStepError("");
  setIsFormOpen(true);
};

  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp);
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
  };
  const handleViewCv = async (emp: Employee) => {
    setLoadingCv(true);
    try {
      const blob = await employeeService.downloadCv(emp.id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank"); // se abre en pestaña nueva (PDF se ve directo)
      // liberamos memoria después de un momento
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err) {
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
    } catch (err) {
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

  const toggleRole = (roleId: number) => {
    setForm((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  };
  const validateStep1 = (): string | null => {
    if (!form.name.trim()) return "El nombre es obligatorio";
    if (!editingEmployee && !form.document.trim())
      return "El documento es obligatorio";
    if (!editingEmployee && !form.email.trim())
      return "El correo es obligatorio";
    if (form.email && !/[^\s@]+@[^\s@]+\.[^\s@]+/.test(form.email.trim())) {
      return "Ingresa un correo electrónico válido";
    }
    return null;
  };

  const validateStep2 = (): string | null => {
    if (!form.basePay || Number(form.basePay) <= 0)
      return "Ingresa un salario base válido";
    return null;
  };

  const validateStep3 = (): string | null => {
    if (cvIsRequired && !form.cv && !editingEmployee?.hasCv) {
      return "Uno de los roles seleccionados requiere hoja de vida (CV)";
    }
    return null;
  };
  useEffect(() => {
    if (!cvIsRequired && stepError) {
      setStepError("");
    }
  }, [cvIsRequired]);
  

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

  return (
    <>
      <div className="space-y-8 pb-8">
        {/* CABECERA */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] tracking-tight">
              {t("pageTitles.employees")}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
               {translateCopy("Administración de personal, roles y accesos al sistema.")} </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:gap-6">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
              <div>
                <p className="text-xs font-bold text-[#111827]">
                   {translateCopy("Exigir hoja de vida")} </p>
                <p className="text-[10px] text-gray-500">
                   {translateCopy("Aplica a Mesero, Cajero, Cocinero, Auxiliar de cocina y Repartidor")} </p>
              </div>
              <button
                onClick={handleToggleCvRequirement}
                disabled={savingCvRequirement || staffRoles.length === 0}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 flex-shrink-0 ${
                  allRequireCv ? "bg-[#EA1D2C]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    allRequireCv ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <button
              onClick={openCreate}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#111827] px-6 py-3 font-bold text-white shadow-sm transition-all hover:scale-[1.02] hover:bg-gray-800 sm:w-auto"
            >
              <span className="text-xl">+</span>  {translateCopy("Registrar Empleado")} </button>
          </div>
        </div>

        {/* TABLA */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-3 bg-gray-50/50">
            <div>
              <h2 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#EA1D2C]"></span>{" "}
                 {translateCopy("Directorio de Empleados")} </h2>
              <p className="text-xs font-semibold text-[#EA1D2C] mt-1">
                {visibleEmployees.length}{" "}
                {visibleEmployees.length === 1 ? translateCopy("empleado") : translateCopy("empleados")}
                {estado === "activo" && translateCopy(" activos")}
                {estado === "retirado" && translateCopy(" retirados")}
                {estado === "todos" && translateCopy(" en total")}
              </p>
            </div>
            <select
              value={estado}
              onChange={(e) => {
                setEstado(e.target.value as EmployeeStatusFilter);
                setCurrentPage(1);
              }}
              className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
            >
              <option value="activo">{translateCopy("Activos")}</option>
              <option value="retirado">{translateCopy("Retirados")}</option>
              <option value="todos">{translateCopy("Todos")}</option>
            </select>
          </div>

          {loading ? (
            <div className="p-10 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl bg-gray-100 animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">{translateCopy(error)}</div>
          ) : visibleEmployees.length === 0 ? (
            <div className="p-6 text-center sm:p-16">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-gray-400 font-medium">
                 {translateCopy("No hay empleados")}{" "}
                {estado === "activo"
                  ? translateCopy("activos")
                  : estado === "retirado"
                    ? translateCopy("retirados")
                    : ""}{" "}
                 {translateCopy("registrados.")} </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-100">
                      <th className="p-4 font-bold">{translateCopy("Empleado")}</th>
                      <th className="p-4 font-bold">{translateCopy("Contacto")}</th>
                      <th className="p-4 font-bold">{translateCopy("Rol / Sede")}</th>
                      <th className="p-4 font-bold text-center">{translateCopy("Estado")}</th>
                      <th className="p-4 font-bold text-center">{translateCopy("Acciones")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedEmployees.map((emp) => {
                      const branch = branches.find(
                        (b) => b.id === emp.branchId,
                      );
                      return (
                        <tr
                          key={emp.id}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex gap-3 items-center">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                                {emp.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-[#111827]">
                                  {emp.name} {emp.lastName ?? ""}
                                </h4>
                                <p className="text-xs text-gray-500">
                                   {translateCopy("CC:")} {emp.document}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="text-xs text-gray-700">
                              {emp.email ?? "—"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {emp.phone ?? "—"}
                            </p>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {getDisplayRoles(emp).map((role) => (
                                <span
                                  key={role}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700"
                                >
                                  {translateCopy(role)}
                                </span>
                              ))}
                            </div>
                            {getDisplayRoles(emp).length === 0 && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  emp.todayShiftState === "Ended"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {emp.todayShiftState === "Ended"
                                  ? translateCopy("Turno terminado")
                                  : translateCopy("Sin turno hoy")}
                              </span>
                            )}
                            <p className="text-[10px] text-gray-500 mt-1">
                              {emp.todayBranchName ?? branch?.name ?? translateCopy("Sin sede")}
                            </p>
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
                                emp.status === "Activo"
                                  ? "bg-green-50 text-green-600 border border-green-200"
                                  : "bg-red-50 text-red-600 border border-red-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${emp.status === "Activo" ? "bg-green-500" : "bg-red-500"}`}
                              ></span>
                              {translateCopy(emp.status)}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openView(emp)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                              >
                                 {translateCopy("Ver")} </button>
                              <button
                                onClick={() => openEdit(emp)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors"
                              >
                                 {translateCopy("Editar")} </button>
                              <button
                                onClick={() => {
                                  if (emp.status === "Activo") {
                                    setConfirmDeactivate(emp);
                                  } else {
                                    setConfirmReactivate(emp);
                                  }
                                }}
                                disabled={saving}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200 transition-colors disabled:opacity-50"
                              >
                                {translateCopy(emp.status === "Activo" ? "Suspender" : "Reactivar")}
                              </button>
                              {(isGerente || isAdmin) && (
                                <button
                                  onClick={() => setConfirmDeleteEmployee(emp)}
                                  disabled={saving}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#EA1D2C] border border-[#EA1D2C] hover:bg-[#EA1D2C] hover:text-white transition-colors disabled:opacity-50"
                                >
                                  {translateCopy("Eliminar")}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <p className="text-xs text-gray-500">
                     {translateCopy("Mostrando")} {startIndex + 1}–
                    {Math.min(startIndex + ITEMS_PER_PAGE, visibleEmployees.length)}  {translateCopy("de")}{" "}
                    {visibleEmployees.length}
                  </p>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                       {translateCopy("Anterior")} </button>
                    <span className="px-3 py-1.5 text-xs font-bold text-gray-500">
                       {translateCopy("Página")} {currentPage}  {translateCopy("de")} {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                       {translateCopy("Siguiente")} </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* MODAL: CREAR / EDITAR */}
        <Dialog
          isOpen={isFormOpen}
          title={
            editingEmployee ? translateCopy("Editar Empleado") : translateCopy("Registrar Nuevo Empleado")
          }
          subtitle={
            editingEmployee
              ? `${translateCopy("Actualizando a")} ${editingEmployee.name}`
              : translateCopy("El sistema enviará un código de activación al correo.")
          }
          onClose={() => setIsFormOpen(false)}
        >
          <div
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (formStep < 3) {
                  goToNextStep();
                }
              }
            }}
            className="space-y-5"
          >
            {/* INDICADOR DE PASOS */}
            <div className="flex items-center justify-center gap-2 pb-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      formStep === step
                        ? "bg-[#111827] text-white"
                        : formStep > step
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {formStep > step ? "✓" : step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-8 h-0.5 ${formStep > step ? "bg-green-500" : "bg-gray-200"}`}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
              {formStep === 1 && translateCopy("Paso 1 de 3 — Datos Personales")}
              {formStep === 2 && translateCopy("Paso 2 de 3 — Asignación Laboral")}
              {formStep === 3 && translateCopy("Paso 3 de 3 — Documentación")}
            </p>

            {stepError && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-xl px-4 py-3">
                {translateCopy(stepError)}
              </div>
            )}

            {/* PASO 1 — DATOS PERSONALES */}
            {formStep === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>{translateCopy("Nombre *")}</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className={inputClass}
                      placeholder={translateCopy("Ej. Juan")}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{translateCopy("Apellido")}</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) =>
                        setForm({ ...form, lastName: e.target.value })
                      }
                      className={inputClass}
                      placeholder={translateCopy("Ej. Pérez")}
                    />
                  </div>
                </div>

                {!editingEmployee && (
                  <div>
                    <label className={labelClass}>
                       {translateCopy("Documento de Identidad *")} </label>
                    <input
                      type="text"
                      value={form.document}
                      onChange={(e) =>
                        setForm({ ...form, document: e.target.value })
                      }
                      className={inputClass}
                      placeholder={translateCopy("Ej. 123456789")}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>
                       {translateCopy("Correo Electrónico")} {!editingEmployee && "*"}
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className={inputClass}
                      placeholder={translateCopy("ejemplo@saborexpress.com")}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{translateCopy("Teléfono")}</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      className={inputClass}
                      placeholder={translateCopy("Ej. 3001234567")}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>{translateCopy("Dirección")}</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    className={inputClass}
                    placeholder={translateCopy("Ej. Calle 123 #45-67")}
                  />
                </div>
              </div>
            )}

            {/* PASO 2 — ASIGNACIÓN LABORAL */}
            {formStep === 2 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>{translateCopy("Sede")}</label>
                    <select
                      value={form.branchId}
                      onChange={(e) =>
                        setForm({ ...form, branchId: e.target.value })
                      }
                      disabled={isAdmin}
                      className={`${inputClass} ${isAdmin ? "bg-gray-100 opacity-80 cursor-not-allowed" : ""}`}
                    >
                      {!isAdmin && (
                        <option value="">{translateCopy("Sin sede asignada")}</option>
                      )}
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{translateCopy("Salario Base *")}</label>
                    <input
                      type="number"
                      value={form.basePay}
                      onChange={(e) =>
                        setForm({ ...form, basePay: e.target.value })
                      }
                      min={0}
                      className={inputClass}
                      placeholder={translateCopy("Ej. 1300000")}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-4 text-xs text-blue-700">
                   {translateCopy("La Sede es la sede base del empleado (la que usa su dispositivo móvil para operar). Los roles operativos (Mesero, Cajero, Cocinero, Repartidor) se asignan por separado desde la pantalla de Turnos, al crear su primer turno.")} </div>
              </div>
            )}

            {/* PASO 3 — DOCUMENTACIÓN */}
            {formStep === 3 && (
              <div className="space-y-5">
                {editingEmployee ? (
                  <div>
                    <label className={labelClass}>{translateCopy("Hoja de Vida (CV)")}</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) =>
                        setForm({ ...form, cv: e.target.files?.[0] ?? null })
                      }
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 bg-white
                     file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0
                     file:text-xs file:font-bold file:bg-[#111827] file:text-white
                     hover:file:bg-gray-800 focus:outline-none transition-all cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                       {translateCopy("Súbela si el rol que le asignaste en Turnos la requiere. Puedes subirla o actualizarla en cualquier momento.")} </p>
                    {editingEmployee?.hasCv && (
                      <p className="text-xs text-gray-500 mt-1">
                         {translateCopy("Ya existe un CV cargado. Solo sube uno nuevo si deseas reemplazarlo.")} </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-6 text-center">
                    <p className="text-sm text-gray-400">
                       {translateCopy("La hoja de vida se sube después, editando el empleado, una vez le hayas asignado su primer turno.")} </p>
                  </div>
                )}

                {/* RESUMEN antes de guardar */}
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                     {translateCopy("Resumen")} </p>
                  <p className="text-xs text-gray-600">
                    <strong>{translateCopy("Nombre:")}</strong> {form.name} {form.lastName}
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>{translateCopy("Correo:")}</strong> {form.email || "—"}
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>{translateCopy("Roles de hoy:")}</strong>{" "}
                    {editingEmployee && getDisplayRoles(editingEmployee).length
                      ? getDisplayRoles(editingEmployee).map(translateCopy).join(", ")
                      : translateCopy("Sin turno hoy (se asignan desde Turnos)")}
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>{translateCopy("Sede:")}</strong>{" "}
                    {branches.find((b) => String(b.id) === form.branchId)
                      ?.name ?? translateCopy("Sin sede asignada")}
                  </p>
                </div>
              </div>
            )}

            {/* NAVEGACIÓN */}
            <div className="pt-4 border-t border-gray-100 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  if (formStep === 1) {
                    setIsFormOpen(false);
                  } else {
                    goToPrevStep();
                  }
                }}
                className="px-6 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                {formStep === 1 ? translateCopy("Cancelar") : translateCopy("Atrás")}
              </button>

              {formStep < 3 ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="bg-[#111827] hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors shadow-sm"
                >
                   {translateCopy("Siguiente")} </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#111827] hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving
                    ? translateCopy("Guardando...")
                    : editingEmployee
                      ? translateCopy("Guardar Cambios")
                      : translateCopy("Guardar y Generar Acceso")}
                </button>
              )}
            </div>
          </div>
        </Dialog>

        {/* MODAL: VER DETALLES */}
        <Dialog
          isOpen={isViewOpen}
          title={translateCopy("Detalles del Empleado")}
          onClose={() => setIsViewOpen(false)}
        >
          {selectedEmployee && (
            <div>
              <div className="flex flex-col items-center mb-6 text-center">
                <div className="w-20 h-20 rounded-full bg-[#111827] text-white flex items-center justify-center font-black text-3xl mb-4 shadow-lg">
                  {selectedEmployee.name.substring(0, 2).toUpperCase()}
                </div>
                <h2 className="text-2xl font-black text-[#111827]">
                  {selectedEmployee.name} {selectedEmployee.lastName ?? ""}
                </h2>
                <div className="flex flex-wrap gap-1 justify-center mt-2">
                  {getDisplayRoles(selectedEmployee).map((role) => (
                    <span
                      key={role}
                      className="text-xs font-bold text-[#EA1D2C]"
                    >
                      {translateCopy(role)}
                    </span>
                  ))}
                </div>
                <span
                  className={`mt-3 inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full ${
                    selectedEmployee.status === "Activo"
                      ? "bg-green-50 text-green-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {selectedEmployee.status}
                </span>
              </div>

              <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">
                     {translateCopy("Documento")} </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {selectedEmployee.document}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">
                     {translateCopy("Teléfono")} </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {selectedEmployee.phone ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">
                     {translateCopy("Correo")} </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {selectedEmployee.email ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">
                     {translateCopy("Salario Base")} </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {formatMoney(selectedEmployee.basePay)}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">
                       {translateCopy("Hoja de Vida")} </span>
                    <span className="text-sm font-semibold text-gray-800">
                      {selectedEmployee.hasCv ? translateCopy("Cargada ✅") : translateCopy("No cargada")}
                    </span>
                  </div>
                  {selectedEmployee.hasCv && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleViewCv(selectedEmployee)}
                        disabled={loadingCv}
                        className="flex-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg py-2 hover:bg-blue-100 transition-colors disabled:opacity-50"
                      >
                        {loadingCv ? translateCopy("Cargando...") : translateCopy("👁️ Ver")}
                      </button>
                      <button
                        onClick={() => handleDownloadCv(selectedEmployee)}
                        disabled={loadingCv}
                        className="flex-1 text-xs font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded-lg py-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {loadingCv ? translateCopy("Cargando...") : translateCopy("⬇️ Descargar")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Dialog>
        <Dialog
          isOpen={!!confirmDeactivate}
          title={translateCopy("Suspender Empleado")}
          onClose={() => setConfirmDeactivate(null)}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-11 h-11 rounded-full bg-yellow-100 flex items-center justify-center text-xl flex-shrink-0">
              ⚠️
            </div>
            <p className="text-sm text-gray-600 pt-1.5">
               {translateCopy("¿Seguro que deseas suspender a")}{" "}
              <strong className="text-[#111827]">
                {confirmDeactivate?.name}
              </strong>
               {translateCopy("? No podrá acceder al sistema hasta que sea reactivado.")} </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmDeactivate(null)}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
               {translateCopy("Cancelar")} </button>
            <button
              onClick={async () => {
                if (confirmDeactivate) {
                  await handleToggleStatus(confirmDeactivate);
                  setConfirmDeactivate(null);
                }
              }}
              disabled={saving}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? translateCopy("Suspendiendo...") : translateCopy("Suspender")}
            </button>
          </div>
        </Dialog>

        <Dialog
          isOpen={!!confirmReactivate}
          title={translateCopy("Reactivar Empleado")}
          onClose={() => setConfirmReactivate(null)}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-xl flex-shrink-0">
              ✅
            </div>
            <p className="text-sm text-gray-600 pt-1.5">
               {translateCopy("¿Deseas reactivar a")}{" "}
              <strong className="text-[#111827]">
                {confirmReactivate?.name}
              </strong>
               {translateCopy("? Volverá a tener acceso al sistema.")} </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmReactivate(null)}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
               {translateCopy("Cancelar")} </button>
            <button
              onClick={async () => {
                if (confirmReactivate) {
                  await handleToggleStatus(confirmReactivate);
                  setConfirmReactivate(null);
                }
              }}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? translateCopy("Reactivando...") : translateCopy("Reactivar")}
            </button>
          </div>
        </Dialog>

        <Dialog
          isOpen={!!confirmDeleteEmployee}
          title={translateCopy("Eliminar empleado permanentemente")}
          subtitle={translateCopy("Esta acción no se puede deshacer")}
          onClose={() => setConfirmDeleteEmployee(null)}
        >
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-xl text-red-700">
              ⚠️
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                {translateCopy("¿Seguro que deseas eliminar a")} {" "}
                <strong className="text-[#111827]">
                  {confirmDeleteEmployee?.name} {confirmDeleteEmployee?.lastName ?? ""}
                </strong>
                {translateCopy("? Se borrarán su cuenta, datos personales, turnos, hoja de vida y entregas asociadas.")}
              </p>
              <p>
                {translateCopy("Los pedidos y pagos anteriores se conservarán como historial, sin asociarlos a este empleado. Si tiene pedidos o entregas activos, primero debes finalizarlos o reasignarlos.")}
              </p>
              <p>
                {translateCopy("Si la cuenta también existe como cliente, se conservará para proteger esos datos; en ese caso puedes suspender al empleado.")}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmDeleteEmployee(null)}
              disabled={saving}
              className="rounded-xl px-6 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
            >
              {translateCopy("Cancelar")}
            </button>
            <button
              onClick={() => {
                if (confirmDeleteEmployee) {
                  void handlePermanentDelete(confirmDeleteEmployee);
                }
              }}
              disabled={saving}
              className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {saving
                ? translateCopy("Eliminando...")
                : translateCopy("Eliminar definitivamente")}
            </button>
          </div>
        </Dialog>

        <NotificationModal
          isOpen={!!notify}
          message={notify?.message ?? ""}
          type={notify?.type ?? "success"}
          onClose={() => setNotify(null)}
        />
        <Dialog
          isOpen={!!justCreatedEmployee}
          title={translateCopy("Empleado registrado")}
          onClose={() => setJustCreatedEmployee(null)}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-xl flex-shrink-0">
              📅
            </div>
            <p className="text-sm text-gray-600 pt-1.5">
              <strong className="text-[#111827]">
                {justCreatedEmployee?.name}
              </strong>{" "}
               {translateCopy("todavía no puede acceder al sistema — necesita al menos un turno asignado. ¿Quieres asignarle uno ahora?")} </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsFormOpen(false);
                setJustCreatedEmployee(null);
              }}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
               {translateCopy("Más tarde")} </button>
            <button
              onClick={() => {
                setIsFormOpen(false);
                if (justCreatedEmployee) {
                  const employeeId = justCreatedEmployee.id;
                  setJustCreatedEmployee(null);
                  rememberNavigationTarget(
                    pendingNavigationKeys.scheduleEmployee,
                    employeeId,
                  );
                  router.push(ROUTES.schedules);
                }
              }}
              className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm"
            >
               {translateCopy("Asignar turno ahora")} </button>
          </div>
        </Dialog>
      </div>
    </>
  );
};

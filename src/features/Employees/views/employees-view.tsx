"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { NotificationModal } from "@/components/ui/modal";
import { useEmployees } from "../hooks/use-employees";
import { employeeService } from "../services/employee.service";
import { useRoles } from "../hooks/use-roles";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useBranches } from "@/features/branches/hooks/use-branches";
import { useMyBranch } from "@/features/branches/hooks/use-my-branch";
import type { Employee, EmployeeStatusFilter } from "../types/employee.types";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/config/routes";

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

export const EmployeesView = () => {
  const [estado, setEstado] = useState<EmployeeStatusFilter>("activo");
  const {
    employees,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
  } = useEmployees(estado);
  const { roles, updateRequiresCvBulk } = useRoles();
  const { session, isHydrated } = useAuth();
  const isAdmin =
    session?.roles?.some((r) => r.toUpperCase() === "ADMINISTRADOR") ?? false;

  // Gerente: lista completa de sedes. Administrador: solo la suya.
  const { branches: allBranches } = useBranches(isHydrated && !isAdmin);
  const { branch: myBranch } = useMyBranch(isHydrated && isAdmin);
  const branches = isAdmin ? (myBranch ? [myBranch] : []) : allBranches;

  const router = useRouter();
  const [autoOpenedEditId, setAutoOpenedEditId] = useState<number | null>(
    null,
  );
  const searchParams = useSearchParams();
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
        message: `Hoja de vida ${!allRequireCv ? "ahora es obligatoria" : "ya no es obligatoria"} para todo el personal operativo.`,
        type: "success",
      });
    } catch (err) {
      setNotify({
        message:
          err instanceof Error
            ? err.message
            : "No se pudo actualizar el requisito",
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
  const [currentPage, setCurrentPage] = useState(1);
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

  // El CV ya no se exige aquí: se valida al crear el turno con un rol
  // que lo requiera, en la pantalla de Turnos.
  const cvIsRequired = false;

  const totalPages = Math.ceil(employees.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmployees = employees.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );
  useEffect(() => {
    const editIdParam = searchParams.get("editEmployeeId");
    if (!editIdParam || employees.length === 0) return;

    const employeeId = Number(editIdParam);
    if (autoOpenedEditId === employeeId) return; // evita reabrir en cada render

    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    setAutoOpenedEditId(employeeId);
    openEdit(emp);
    router.replace(ROUTES.employees);;
  }, [searchParams, employees, autoOpenedEditId]);

const openCreate = () => {
  setEditingEmployee(null);
  setForm(INITIAL_FORM);
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
        message: "No se pudo cargar la hoja de vida",
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
        message: "No se pudo descargar la hoja de vida",
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
        message: "Empleado actualizado correctamente",
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
        err instanceof Error ? err.message : "No se pudo guardar el empleado",
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
      message: `Empleado ${nextStatus === "Activo" ? "reactivado" : "suspendido"} correctamente`,
      type: "success",
    });
  } catch (err) {
    setNotify({
      message:
        err instanceof Error ? err.message : "No se pudo actualizar el estado",
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
              Gestión de Talento
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Administración de personal, roles y accesos al sistema.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
              <div>
                <p className="text-xs font-bold text-[#111827]">
                  Exigir hoja de vida
                </p>
                <p className="text-[10px] text-gray-500">
                  Aplica a Mesero, Cajero, Cocinero y Repartidor
                </p>
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
              className="bg-[#111827] hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl shadow-sm transition-all flex items-center gap-2 hover:scale-[1.02]"
            >
              <span className="text-xl">+</span> Registrar Empleado
            </button>
          </div>
        </div>

        {/* TABLA */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-3 bg-gray-50/50">
            <div>
              <h2 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#EA1D2C]"></span>{" "}
                Directorio de Empleados
              </h2>
              <p className="text-xs font-semibold text-[#EA1D2C] mt-1">
                {employees.length}{" "}
                {employees.length === 1 ? "empleado" : "empleados"}
                {estado === "activo" && " activos"}
                {estado === "retirado" && " retirados"}
                {estado === "todos" && " en total"}
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
              <option value="activo">Activos</option>
              <option value="retirado">Retirados</option>
              <option value="todos">Todos</option>
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
            <div className="p-6 text-sm text-red-600">{error}</div>
          ) : employees.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-gray-400 font-medium">
                No hay empleados{" "}
                {estado === "activo"
                  ? "activos"
                  : estado === "retirado"
                    ? "retirados"
                    : ""}{" "}
                registrados.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-100">
                      <th className="p-4 font-bold">Empleado</th>
                      <th className="p-4 font-bold">Contacto</th>
                      <th className="p-4 font-bold">Rol / Sede</th>
                      <th className="p-4 font-bold text-center">Estado</th>
                      <th className="p-4 font-bold text-center">Acciones</th>
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
                                  CC: {emp.document}
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
                              {emp.roleNames.map((role) => (
                                <span
                                  key={role}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700"
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">
                              {branch?.name ?? "Sin sede"}
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
                              {emp.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openView(emp)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                              >
                                Ver
                              </button>
                              <button
                                onClick={() => openEdit(emp)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors"
                              >
                                Editar
                              </button>
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
                                {emp.status === "Activo" ? "Suspender" : "Reactivar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Mostrando {startIndex + 1}–
                    {Math.min(startIndex + ITEMS_PER_PAGE, employees.length)} de{" "}
                    {employees.length}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1.5 text-xs font-bold text-gray-500">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
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
            editingEmployee ? "Editar Empleado" : "Registrar Nuevo Empleado"
          }
          subtitle={
            editingEmployee
              ? `Actualizando a ${editingEmployee.name}`
              : "El sistema enviará un código de activación al correo."
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
              {formStep === 1 && "Paso 1 de 3 — Datos Personales"}
              {formStep === 2 && "Paso 2 de 3 — Asignación Laboral"}
              {formStep === 3 && "Paso 3 de 3 — Documentación"}
            </p>

            {stepError && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-xl px-4 py-3">
                {stepError}
              </div>
            )}

            {/* PASO 1 — DATOS PERSONALES */}
            {formStep === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Nombre *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className={inputClass}
                      placeholder="Ej. Juan"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Apellido</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) =>
                        setForm({ ...form, lastName: e.target.value })
                      }
                      className={inputClass}
                      placeholder="Ej. Pérez"
                    />
                  </div>
                </div>

                {!editingEmployee && (
                  <div>
                    <label className={labelClass}>
                      Documento de Identidad *
                    </label>
                    <input
                      type="text"
                      value={form.document}
                      onChange={(e) =>
                        setForm({ ...form, document: e.target.value })
                      }
                      className={inputClass}
                      placeholder="Ej. 123456789"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>
                      Correo Electrónico {!editingEmployee && "*"}
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className={inputClass}
                      placeholder="ejemplo@saborexpress.com"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Teléfono</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      className={inputClass}
                      placeholder="Ej. 3001234567"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Dirección</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    className={inputClass}
                    placeholder="Ej. Calle 123 #45-67"
                  />
                </div>
              </div>
            )}

            {/* PASO 2 — ASIGNACIÓN LABORAL */}
            {formStep === 2 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Sede</label>
                    <select
                      value={form.branchId}
                      onChange={(e) =>
                        setForm({ ...form, branchId: e.target.value })
                      }
                      className={inputClass}
                    >
                      <option value="">Sin sede asignada</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Salario Base *</label>
                    <input
                      type="number"
                      value={form.basePay}
                      onChange={(e) =>
                        setForm({ ...form, basePay: e.target.value })
                      }
                      min={0}
                      className={inputClass}
                      placeholder="Ej. 1300000"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-4 text-xs text-blue-700">
                  La Sede es la sede base del empleado (la que usa su dispositivo
                  móvil para operar). Los roles operativos (Mesero, Cajero,
                  Cocinero, Repartidor) se asignan por separado desde la
                  pantalla de Turnos, al crear su primer turno.
                </div>
              </div>
            )}

            {/* PASO 3 — DOCUMENTACIÓN */}
            {formStep === 3 && (
              <div className="space-y-5">
                {editingEmployee ? (
                  <div>
                    <label className={labelClass}>Hoja de Vida (CV)</label>
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
                      Súbela si el rol que le asignaste en Turnos la requiere.
                      Puedes subirla o actualizarla en cualquier momento.
                    </p>
                    {editingEmployee?.hasCv && (
                      <p className="text-xs text-gray-500 mt-1">
                        Ya existe un CV cargado. Solo sube uno nuevo si deseas
                        reemplazarlo.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-6 text-center">
                    <p className="text-sm text-gray-400">
                      La hoja de vida se sube después, editando el empleado,
                      una vez le hayas asignado su primer turno.
                    </p>
                  </div>
                )}

                {/* RESUMEN antes de guardar */}
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Resumen
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>Nombre:</strong> {form.name} {form.lastName}
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>Correo:</strong> {form.email || "—"}
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>Roles actuales:</strong>{" "}
                    {editingEmployee?.roleNames?.length
                      ? editingEmployee.roleNames.join(", ")
                      : "Ninguno todavía (se asignan desde Turnos)"}
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>Sede:</strong>{" "}
                    {branches.find((b) => String(b.id) === form.branchId)
                      ?.name ?? "Sin sede asignada"}
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
                {formStep === 1 ? "Cancelar" : "Atrás"}
              </button>

              {formStep < 3 ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="bg-[#111827] hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors shadow-sm"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#111827] hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving
                    ? "Guardando..."
                    : editingEmployee
                      ? "Guardar Cambios"
                      : "Guardar y Generar Acceso"}
                </button>
              )}
            </div>
          </div>
        </Dialog>

        {/* MODAL: VER DETALLES */}
        <Dialog
          isOpen={isViewOpen}
          title="Detalles del Empleado"
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
                  {selectedEmployee.roleNames.map((role) => (
                    <span
                      key={role}
                      className="text-xs font-bold text-[#EA1D2C]"
                    >
                      {role}
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
                    Documento
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {selectedEmployee.document}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    Teléfono
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {selectedEmployee.phone ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    Correo
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {selectedEmployee.email ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    Salario Base
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    ${selectedEmployee.basePay.toLocaleString("es-CO")}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      Hoja de Vida
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      {selectedEmployee.hasCv ? "Cargada ✅" : "No cargada"}
                    </span>
                  </div>
                  {selectedEmployee.hasCv && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleViewCv(selectedEmployee)}
                        disabled={loadingCv}
                        className="flex-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg py-2 hover:bg-blue-100 transition-colors disabled:opacity-50"
                      >
                        {loadingCv ? "Cargando..." : "👁️ Ver"}
                      </button>
                      <button
                        onClick={() => handleDownloadCv(selectedEmployee)}
                        disabled={loadingCv}
                        className="flex-1 text-xs font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded-lg py-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {loadingCv ? "Cargando..." : "⬇️ Descargar"}
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
          title="Suspender Empleado"
          onClose={() => setConfirmDeactivate(null)}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-11 h-11 rounded-full bg-yellow-100 flex items-center justify-center text-xl flex-shrink-0">
              ⚠️
            </div>
            <p className="text-sm text-gray-600 pt-1.5">
              ¿Seguro que deseas suspender a{" "}
              <strong className="text-[#111827]">
                {confirmDeactivate?.name}
              </strong>
              ? No podrá acceder al sistema hasta que sea reactivado.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmDeactivate(null)}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
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
              {saving ? "Suspendiendo..." : "Suspender"}
            </button>
          </div>
        </Dialog>

        <Dialog
          isOpen={!!confirmReactivate}
          title="Reactivar Empleado"
          onClose={() => setConfirmReactivate(null)}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-xl flex-shrink-0">
              ✅
            </div>
            <p className="text-sm text-gray-600 pt-1.5">
              ¿Deseas reactivar a{" "}
              <strong className="text-[#111827]">
                {confirmReactivate?.name}
              </strong>
              ? Volverá a tener acceso al sistema.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmReactivate(null)}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
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
              {saving ? "Reactivando..." : "Reactivar"}
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
          title="Empleado registrado"
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
              todavía no puede acceder al sistema — necesita al menos un turno
              asignado. ¿Quieres asignarle uno ahora?
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsFormOpen(false);
                setJustCreatedEmployee(null);
              }}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Más tarde
            </button>
            <button
              onClick={() => {
                setIsFormOpen(false);
                if (justCreatedEmployee) {
                  const employeeId = justCreatedEmployee.id;
                  setJustCreatedEmployee(null);
                  router.push(`/schedules?employeeId=${employeeId}`);
                }
              }}
              className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm"
            >
              Asignar turno ahora
            </button>
          </div>
        </Dialog>
      </div>
    </>
  );
};

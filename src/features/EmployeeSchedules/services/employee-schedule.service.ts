import { http } from "@/config/api";
import type {
  EmployeeSchedule,
  CreateEmployeeSchedulePayload,
  UpdateEmployeeSchedulePayload,
  TransferBranchPayload,
  TransferBranchResult,
} from "../types/employee-schedule.types";

// El backend espera "ShiftDate" (no "date") y horas con segundos ("HH:mm:ss"),
// pero el <input type="time"> del navegador solo da "HH:mm". Este mapper
// traduce el payload del frontend al formato exacto que el DTO de C# necesita.
function toBackendPayload(payload: CreateEmployeeSchedulePayload) {
  return {
    employeeId: payload.employeeId,
    branchId: payload.branchId,
    roleId: payload.roleId,
    shiftDate: payload.shiftDate,
    startTime:
      payload.startTime.length === 5
        ? `${payload.startTime}:00`
        : payload.startTime,
    endTime:
      payload.endTime.length === 5 ? `${payload.endTime}:00` : payload.endTime,
  };
}

export type WeekEmailResult = {
  sent: number;
  skipped: number;
  failed: number;
  employeesWithShifts: number;
};

export const employeeScheduleService = {
  // Enviar una sola notificación por empleado con sus turnos de la semana y sede.
  sendWeekEmails: async (branchId: number, fromDate: string, toDate: string): Promise<WeekEmailResult> => {
    const { data } = await http.post<WeekEmailResult>(
      `/employee-schedules/branch/${branchId}/email-week`,
      { fromDate, toDate },
    );
    return data;
  },
  // Notificación por correo de un día o de una semana ya planificada.
  sendEmail: async (employeeId: number, fromDate: string, toDate: string): Promise<void> => {
    await http.post(`/employee-schedules/employee/${employeeId}/email`, { fromDate, toDate });
  },
  getByEmployee: async (employeeId: number): Promise<EmployeeSchedule[]> => {
    const { data } = await http.get<EmployeeSchedule[]>(
      `/employee-schedules/employee/${employeeId}`,
    );
    return data;
  },

  getByBranch: async (branchId: number): Promise<EmployeeSchedule[]> => {
    const { data } = await http.get<EmployeeSchedule[]>(
      `/employee-schedules/branch/${branchId}`,
    );
    return data;
  },

  create: async (
    payload: CreateEmployeeSchedulePayload,
  ): Promise<EmployeeSchedule> => {
    const { data } = await http.post<EmployeeSchedule>(
      "/employee-schedules",
      toBackendPayload(payload),
    );
    return data;
  },

  update: async (
    id: number,
    payload: UpdateEmployeeSchedulePayload,
  ): Promise<EmployeeSchedule> => {
    const { data } = await http.put<EmployeeSchedule>(
      `/employee-schedules/${id}`,
      toBackendPayload(payload),
    );
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await http.delete(`/employee-schedules/${id}`);
  },

  // POST /employee-schedules/employee/{employeeId}/transfer-branch — solo Gerente.
  // Traslada todos los turnos FUTUROS (hoy inclusive) del empleado a la nueva sede.
  transferBranch: async (
    employeeId: number,
    payload: TransferBranchPayload,
  ): Promise<TransferBranchResult> => {
    const { data } = await http.post<TransferBranchResult>(
      `/employee-schedules/employee/${employeeId}/transfer-branch`,
      payload,
    );
    return data;
  },
};

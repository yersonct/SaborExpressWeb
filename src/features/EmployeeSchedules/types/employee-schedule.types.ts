export interface EmployeeSchedule {
  id: number;
  employeeId: number;
  employeeName: string;
  roleId: number;
  roleName: string;
  branchId: number;
  branchName: string;
  shiftDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm:ss"
  endTime: string; // "HH:mm:ss"
}

export interface CreateEmployeeSchedulePayload {
  employeeId: number;
  roleId: number;
  branchId: number;
  shiftDate: string;
  startTime: string;
  endTime: string;
}

export interface TransferBranchPayload {
  newBranchId: number;
}

export interface TransferBranchResult {
  transferredSchedules: number;
}

export type UpdateEmployeeSchedulePayload = CreateEmployeeSchedulePayload;

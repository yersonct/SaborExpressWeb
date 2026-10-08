export interface Employee {
  id: number;
  userId: number | null;
  name: string;
  lastName: string | null;
  document: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  photo: string | null;
  roleNames: string[];
  branchId: number | null;
  status: string; // "Activo" | "Inactivo"
  basePay: number;
  hasCv: boolean;
}

export interface CreateEmployeePayload {
  name: string;
  lastName?: string;
  document: string;
  email: string;
  phone?: string;
  address?: string;
  branchId?: number;
  basePay: number;
  cv?: File;
}

export interface UpdateEmployeePayload {
  name: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  branchId?: number;
  status: string;
  basePay: number;
  cv?: File;
}

export type EmployeeStatusFilter = "activo" | "retirado" | "todos";

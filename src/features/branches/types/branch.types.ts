export interface Branch {
  id: number;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  status: boolean;
  employeeCount: number;
}

export interface CreateBranchPayload {
  name: string;
  address?: string;
  phone?: string;
}

export interface UpdateBranchPayload {
  name: string;
  address?: string;
  phone?: string;
  status: boolean;
}

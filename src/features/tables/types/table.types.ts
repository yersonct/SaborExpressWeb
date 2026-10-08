export enum TableStatus {
  Available = "Available",
  Occupied = "Occupied",
}

export interface Table {
  id: number;
  branchId: number;
  branchName: string | null;
  number: number;
  status: TableStatus;
  createdAt: string;
}

export interface CreateTablePayload {
  branchId: number;
  number: number;
}

export interface UpdateTablePayload {
  number: number;
}

export interface UpdateTableStatusPayload {
  status: TableStatus;
}

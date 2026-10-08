export interface Category {
  id: number;
  name: string;
  description: string;
  status: boolean;
  createdAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  description: string;
}

export interface UpdateCategoryPayload {
  name: string;
  description: string;
  status: boolean;
}

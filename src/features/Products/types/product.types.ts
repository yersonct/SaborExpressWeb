export interface Product {
  id: number;
  categoryId: number;
  categoryName: string;
  // null = producto global, visible en todas las sedes
  branchId: number | null;
  branchName: string | null;
  name: string;
  description: string;
  nameEn?: string | null;
  namePt?: string | null;
  nameFr?: string | null;
  descriptionEn?: string | null;
  descriptionPt?: string | null;
  descriptionFr?: string | null;
  categoryNameEn?: string | null;
  categoryNamePt?: string | null;
  categoryNameFr?: string | null;
  price: number;
  photo: string | null;
  preparationTimeInMinutes: number;
  status: boolean;
  createdAt: string;
}

export interface CreateProductPayload {
  categoryId: number;
  // Opcional: si no se envía, el producto queda global (todas las sedes)
  branchId?: number;
  name: string;
  description: string;
  nameEn?: string | null;
  namePt?: string | null;
  nameFr?: string | null;
  descriptionEn?: string | null;
  descriptionPt?: string | null;
  descriptionFr?: string | null;
  price: number;
  preparationTimeInMinutes: number;
  photo?: File;
}

export interface UpdateProductPayload {
  categoryId: number;
  branchId?: number;
  name: string;
  description: string;
  nameEn?: string | null;
  namePt?: string | null;
  nameFr?: string | null;
  descriptionEn?: string | null;
  descriptionPt?: string | null;
  descriptionFr?: string | null;
  price: number;
  preparationTimeInMinutes: number;
  status: boolean;
  photo?: File;
}

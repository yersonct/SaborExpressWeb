export interface Category {
  id: number;
  name: string;
  description: string;
  nameEn?: string | null;
  namePt?: string | null;
  nameFr?: string | null;
  descriptionEn?: string | null;
  descriptionPt?: string | null;
  descriptionFr?: string | null;
  status: boolean;
  createdAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  description: string;
  nameEn?: string | null;
  namePt?: string | null;
  nameFr?: string | null;
  descriptionEn?: string | null;
  descriptionPt?: string | null;
  descriptionFr?: string | null;
}

export interface UpdateCategoryPayload {
  name: string;
  description: string;
  nameEn?: string | null;
  namePt?: string | null;
  nameFr?: string | null;
  descriptionEn?: string | null;
  descriptionPt?: string | null;
  descriptionFr?: string | null;
  status: boolean;
}

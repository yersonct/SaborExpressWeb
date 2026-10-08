export interface CategoryFormErrors {
  name?: string;
  description?: string;
}

interface ValidateCategoryParams {
  name: string;
  description: string;
  existingCategories: { id: number; name: string }[];
  editingId?: number;
}

export function validateCategoryForm({
  name,
  description,
  existingCategories,
  editingId,
}: ValidateCategoryParams): CategoryFormErrors {
  const errors: CategoryFormErrors = {};
  const trimmedName = name.trim();

  if (!trimmedName) {
    errors.name = "El nombre es obligatorio";
  } else if (trimmedName.length < 3) {
    errors.name = "El nombre debe tener al menos 3 caracteres";
  } else if (trimmedName.length > 50) {
    errors.name = "El nombre no puede superar 50 caracteres";
  } else {
    const duplicate = existingCategories.some(
      (c) =>
        c.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        c.id !== editingId,
    );
    if (duplicate) {
      errors.name = "Ya existe una categoría con ese nombre";
    }
  }

  const trimmedDescription = description.trim();
  if (!trimmedDescription) {
    errors.description = "La descripción es obligatoria";
  } else if (trimmedDescription.length < 5) {
    errors.description = "La descripción debe tener al menos 5 caracteres";
  } else if (trimmedDescription.length > 200) {
    errors.description = "La descripción no puede superar 200 caracteres";
  }

  return errors;
}

export function hasCategoryFormErrors(errors: CategoryFormErrors): boolean {
  return Object.values(errors).some((v) => !!v);
}

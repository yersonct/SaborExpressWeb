export interface ProductFormErrors {
  name?: string;
  description?: string;
  price?: string;
  categoryId?: string;
  preparationTimeInMinutes?: string;
}

interface ValidateProductParams {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  preparationTimeInMinutes: string;
  existingProducts: { id: number; name: string }[];
  editingId?: number;
}

export function validateProductForm({
  name,
  description,
  price,
  categoryId,
  preparationTimeInMinutes,
  existingProducts,
  editingId,
}: ValidateProductParams): ProductFormErrors {
  const errors: ProductFormErrors = {};
  const trimmedName = name.trim();

  if (!trimmedName) {
    errors.name = "El nombre es obligatorio";
  } else if (trimmedName.length < 3) {
    errors.name = "El nombre debe tener al menos 3 caracteres";
  } else if (trimmedName.length > 80) {
    errors.name = "El nombre no puede superar 80 caracteres";
  } else {
    const duplicate = existingProducts.some(
      (p) =>
        p.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        p.id !== editingId,
    );
    if (duplicate) {
      errors.name = "Ya existe un producto con ese nombre";
    }
  }

  const trimmedDescription = description.trim();
  if (!trimmedDescription) {
    errors.description = "La descripción es obligatoria";
  } else if (trimmedDescription.length < 10) {
    errors.description = "La descripción debe tener al menos 10 caracteres";
  } else if (trimmedDescription.length > 300) {
    errors.description = "La descripción no puede superar 300 caracteres";
  }

  const priceNum = Number(price);
  if (!price || isNaN(priceNum)) {
    errors.price = "El precio es obligatorio";
  } else if (priceNum <= 0) {
    errors.price = "El precio debe ser mayor a $0";
  } else if (priceNum > 10_000_000) {
    errors.price = "El precio parece demasiado alto, verifícalo";
  }

  if (!categoryId) {
    errors.categoryId = "Selecciona una categoría";
  }

  const prepTime = Number(preparationTimeInMinutes);
  if (!preparationTimeInMinutes || isNaN(prepTime)) {
    errors.preparationTimeInMinutes = "El tiempo de preparación es obligatorio";
  } else if (prepTime <= 0) {
    errors.preparationTimeInMinutes = "Debe ser mayor a 0 minutos";
  } else if (prepTime > 240) {
    errors.preparationTimeInMinutes = "No puede superar 240 minutos (4 horas)";
  }

  return errors;
}

export function hasProductFormErrors(errors: ProductFormErrors): boolean {
  return Object.values(errors).some((v) => !!v);
}

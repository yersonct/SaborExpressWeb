// Validación compartida del formulario de sedes.
// Se usa tanto para crear (branches-view.tsx) como para editar
// (branches-view.tsx y my-branch-view.tsx), ya que ambos flujos
// manejan la misma forma de datos.

const PLACEHOLDER_VALUES = [
  "string",
  "test",
  "prueba",
  "asdf",
  "asdfg",
  "asdas",
  "asdad",
  "sdasd",
  "qwerty",
  "n/a",
  "na",
  "xxx",
  "ejemplo",
  "sin nombre",
  "sin direccion",
  "sin dirección",
];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_VALUES.includes(normalize(value));
}

/** Detecta strings tipo "aaaa", "1111", "asasasas" (un patrón corto repetido) */
function isRepetitivePattern(value: string): boolean {
  const clean = normalize(value).replace(/\s/g, "");
  if (clean.length < 3) return false;

  // todo el mismo caracter: "aaaa", "1111"
  if (/^(.)\1+$/.test(clean)) return true;

  // un bloque de 1-3 caracteres repetido todo el string: "abcabcabc", "xyxyxy"
  for (let blockLen = 1; blockLen <= 3; blockLen++) {
    if (clean.length % blockLen !== 0) continue;
    const block = clean.slice(0, blockLen);
    const repeated = block.repeat(clean.length / blockLen);
    if (repeated === clean) return true;
  }

  return false;
}

export interface BranchFormValues {
  name: string;
  address: string;
  phone: string;
  status?: boolean;
}

export interface BranchFormErrors {
  name?: string;
  address?: string;
  phone?: string;
  status?: string;
}

export function validateBranchForm({
  name,
  address,
  phone,
  status,
}: BranchFormValues): BranchFormErrors {
  const errors: BranchFormErrors = {};

  // ---------- Nombre ----------
  const trimmedName = name.trim();
  if (!trimmedName) {
    errors.name = "El nombre es obligatorio.";
  } else if (trimmedName.length < 3) {
    errors.name = "El nombre debe tener al menos 3 caracteres.";
  } else if (trimmedName.length > 100) {
    errors.name = "El nombre no puede superar los 100 caracteres.";
  } else if (isPlaceholder(trimmedName)) {
    errors.name = "Ingresa un nombre real de sede.";
  } else if (isRepetitivePattern(trimmedName)) {
    errors.name = "El nombre no parece válido, revísalo.";
  } else if (!/[a-zA-ZÀ-ÿ]/.test(trimmedName)) {
    errors.name = "El nombre debe contener al menos una letra.";
  } else if (!/^[a-zA-ZÀ-ÿ0-9\s.,'()&-]+$/.test(trimmedName)) {
    errors.name = "El nombre contiene caracteres no permitidos.";
  } else if (/\s{2,}/.test(trimmedName)) {
    errors.name = "El nombre no puede tener espacios dobles.";
  }

  // ---------- Dirección ----------
  const trimmedAddress = address.trim();
  if (!trimmedAddress) {
    errors.address = "La dirección es obligatoria.";
  } else if (trimmedAddress.length < 5) {
    errors.address = "La dirección debe tener al menos 5 caracteres.";
  } else if (trimmedAddress.length > 150) {
    errors.address = "La dirección no puede superar los 150 caracteres.";
  } else if (isPlaceholder(trimmedAddress)) {
    errors.address = "Ingresa una dirección real.";
  } else if (isRepetitivePattern(trimmedAddress)) {
    errors.address = "La dirección no parece válida, revísala.";
  } else if (!/[a-zA-ZÀ-ÿ]/.test(trimmedAddress)) {
    errors.address = "La dirección debe contener al menos una letra.";
  } else if (!/^[a-zA-ZÀ-ÿ0-9\s.,'()#-]+$/.test(trimmedAddress)) {
    errors.address = "La dirección contiene caracteres no permitidos.";
  } else if (/\s{2,}/.test(trimmedAddress)) {
    errors.address = "La dirección no puede tener espacios dobles.";
  }

  // ---------- Teléfono ----------
  const trimmedPhone = phone.trim();
  if (!trimmedPhone) {
    errors.phone = "El teléfono es obligatorio.";
  } else if (isPlaceholder(trimmedPhone)) {
    errors.phone = "Ingresa un teléfono real.";
  } else if (!/^\+?[\d\s-]{7,15}$/.test(trimmedPhone)) {
    errors.phone =
      "El teléfono debe tener entre 7 y 15 dígitos (puede incluir +, espacios o guiones).";
  } else {
    const digitsOnly = trimmedPhone.replace(/\D/g, "");
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      errors.phone = "El teléfono debe tener entre 7 y 15 dígitos.";
    } else if (isRepetitivePattern(digitsOnly)) {
      errors.phone = "El teléfono no parece válido, revísalo.";
    }
  }

  // ---------- Estado ----------
  // El toggle "Sede activa" siempre es boolean (checkbox controlado),
  // pero se valida por si en algún punto llega undefined desde el form.
  if (status !== undefined && typeof status !== "boolean") {
    errors.status = "El estado de la sede no es válido.";
  }

  return errors;
}

export function hasBranchFormErrors(errors: BranchFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

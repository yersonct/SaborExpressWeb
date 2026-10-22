export function sanitizeNumber(
  raw: string,
  { decimals, max }: { decimals: number; max: number },
): string {
  // Solo dígitos, coma y punto; toda coma pasa a punto.
  let v = raw.replace(/[^\d.,]/g, "").replace(/,/g, ".");

  // Un solo separador decimal.
  const first = v.indexOf(".");
  if (first !== -1) {
    v = v.slice(0, first + 1) + v.slice(first + 1).replace(/\./g, "");
  }

  const hasDot = decimals > 0 && v.includes(".");
  const [rawIntPart = "", decPart = ""] = v.split(".");
  let intPart = rawIntPart;

  intPart = intPart.replace(/^0+(?=\d)/, ""); // 042 -> 42, 00 -> 0, 0.0 se conserva
  if (hasDot && intPart === "") intPart = "0"; // .5 -> 0.5

  v = hasDot ? `${intPart}.${decPart.slice(0, decimals)}` : intPart;

  if (v !== "" && Number(v) > max) v = String(max);
  return v;
}

/** Al salir del campo: "5." -> "5", "" -> "0". */
export function finalizeNumber(value: string): string {
  if (value === "") return "0";
  return value.endsWith(".") ? value.slice(0, -1) : value;
}

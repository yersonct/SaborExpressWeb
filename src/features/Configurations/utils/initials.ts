// "Yerson Rubiano" -> "YR" | "yersonrubiano64@gmail.com" -> "Y" | "juan.perez@x.com" -> "JP"
export function getInitials(fullName?: string | null, email?: string | null) {
  const fromName = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (fromName.length > 0) {
    const first = fromName[0][0];
    const last = fromName.length > 1 ? fromName[fromName.length - 1][0] : "";
    return (first + last).toUpperCase();
  }

  const local = (email ?? "").split("@")[0].replace(/[0-9]/g, "");
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const second = parts.length > 1 ? parts[1][0] : "";
  return (first + second).toUpperCase();
}

/** Removes legacy order numbers from notification copy before it reaches the UI. */
export function hideOrderIdentifiers(value: string): string {
  const withoutLeadingReference = value.replace(
    /^\s*pedido\s*#\s*[a-z0-9-]+\s*:\s*/i,
    "",
  );

  return withoutLeadingReference
    .replace(/\bpedido\s*#\s*[a-z0-9-]+\b\s*:?/gi, "pedido")
    .replace(/[ \t]+([,.:;!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

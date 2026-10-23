export const SUPPORTED_LOCALES = ['es', 'en', 'pt', 'fr'];

function flattenStrings(value, prefix = '', result = new Map()) {
  if (typeof value === 'string') {
    result.set(prefix, value);
    return result;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;

  for (const [key, nested] of Object.entries(value)) {
    flattenStrings(nested, prefix ? `${prefix}.${key}` : key, result);
  }
  return result;
}

function looksLikeHumanCopy(value) {
  const normalized = value.trim();
  if (normalized.length < 8 || !/[\p{L}]/u.test(normalized)) return false;
  if (/^\{\{.*\}\}$/.test(normalized)) return false;
  if (/^(?:https?:\/\/|www\.)/i.test(normalized)) return false;
  if (/^[A-Z0-9_./:+-]+$/.test(normalized)) return false;
  const copyWithoutVariablesOrUnits = normalized
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/\b(?:ms|km|mm|kg)\b/gi, '')
    .replace(/[\d.,\s%]/g, '');
  if (!/[\p{L}]/u.test(copyWithoutVariablesOrUnits)) return false;
  return /\s/.test(normalized) || normalized.length >= 24;
}

export function auditTranslationCatalog(catalog, allowIdenticalValuesByLocale = {}) {
  const flattened = Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, flattenStrings(catalog[locale])]),
  );
  const paths = new Set(SUPPORTED_LOCALES.flatMap((locale) => [...flattened[locale].keys()]));
  const missing = [];
  const empty = [];
  const untranslated = [];

  for (const key of paths) {
    const source = flattened.es.get(key);
    for (const locale of SUPPORTED_LOCALES) {
      if (!flattened[locale].has(key)) {
        missing.push({ locale, key });
        continue;
      }
      const value = flattened[locale].get(key);
      if (!value.trim()) empty.push({ locale, key });
      if (
        locale !== 'es' && source && value.trim() === source.trim() &&
        !allowIdenticalValuesByLocale[locale]?.includes(value.trim()) && looksLikeHumanCopy(value)
      ) {
        untranslated.push({ locale, key, value });
      }
    }
  }

  return { missing, empty, untranslated, keyCount: paths.size };
}

export function auditSourceTextMap(sourceTextMap, allowIdenticalValuesByLocale = {}) {
  const sourceKeys = Object.keys(sourceTextMap.es ?? {});
  const missing = [];
  const empty = [];
  const untranslated = [];

  for (const locale of SUPPORTED_LOCALES) {
    for (const key of sourceKeys) {
      if (!Object.prototype.hasOwnProperty.call(sourceTextMap[locale] ?? {}, key)) {
        missing.push({ locale, key });
        continue;
      }
      const value = String(sourceTextMap[locale][key] ?? '');
      if (!value.trim()) empty.push({ locale, key });
      if (
        locale !== 'es' && value.trim() === key.trim() &&
        !allowIdenticalValuesByLocale[locale]?.includes(value.trim()) && looksLikeHumanCopy(key)
      ) {
        untranslated.push({ locale, key, value });
      }
    }
  }

  return { missing, empty, untranslated, keyCount: sourceKeys.length };
}

export function summarizeAudit(name, audit, { strictUntranslated = false } = {}) {
  const failed = audit.missing.length > 0 || audit.empty.length > 0 ||
    (strictUntranslated && audit.untranslated.length > 0);
  return {
    name,
    status: failed ? 'FAIL' : audit.untranslated.length ? 'REVIEW' : 'PASS',
    keyCount: audit.keyCount,
    missing: audit.missing,
    empty: audit.empty,
    untranslated: audit.untranslated,
  };
}

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { auditTranslationCatalog, summarizeAudit } from './i18n-audit-core.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireFromProject = createRequire(path.join(root, 'package.json'));
const cache = new Map();
const intentionalPortugueseCognates = ['Enviar código', 'Código de 6 dígitos', 'Verificar código'];

function resolveSource(base) {
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.json`, path.join(base, 'index.ts')];
  const file = candidates.find((candidate) => fs.existsSync(candidate));
  if (!file) throw new Error(`No se pudo resolver el módulo ${base}`);
  return file;
}

function loadTypeScript(file) {
  const resolved = path.resolve(file);
  if (cache.has(resolved)) return cache.get(resolved).exports;
  if (resolved.endsWith('.json')) return JSON.parse(fs.readFileSync(resolved, 'utf8'));

  const loadedModule = { exports: {} };
  cache.set(resolved, loadedModule);
  const source = fs.readFileSync(resolved, 'utf8');
  const output = ts.transpileModule(source, {
    fileName: resolved,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const localRequire = (specifier) => {
    if (!specifier.startsWith('.')) return requireFromProject(specifier);
    return loadTypeScript(resolveSource(path.resolve(path.dirname(resolved), specifier)));
  };

  new Function('require', 'module', 'exports', '__filename', '__dirname', output)(
    localRequire, loadedModule, loadedModule.exports, resolved, path.dirname(resolved),
  );
  return loadedModule.exports;
}

const i18n = loadTypeScript(path.join(root, 'src/config/i18n.ts')).default;
const resources = i18n.options.resources;
const catalog = Object.fromEntries(
  ['es', 'en', 'pt', 'fr'].map((locale) => [locale, resources[locale]?.translation]),
);
const result = summarizeAudit(
  'admin-web/src/config/i18n.ts (recursos cargados)',
  auditTranslationCatalog(catalog, { pt: intentionalPortugueseCognates }),
  { strictUntranslated: process.argv.includes('--strict-untranslated') },
);

console.log(`${result.status} ${result.name}: ${result.keyCount} claves`);
for (const [label, findings] of [
  ['Faltantes', result.missing],
  ['Vacías', result.empty],
  ['Posiblemente sin traducir', result.untranslated],
]) {
  console.log(`${label}: ${findings.length}`);
  for (const finding of findings.slice(0, 80)) {
    console.log(`  ${finding.locale} ${finding.key}: ${JSON.stringify(finding.value ?? '')}`);
  }
  if (findings.length > 80) console.log(`  ... ${findings.length - 80} hallazgos más`);
}

if (result.status === 'FAIL') process.exitCode = 1;

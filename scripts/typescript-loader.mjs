import fs from "node:fs/promises";
import ts from "typescript";
export async function load(url, context, nextLoad) {
  if (!url.endsWith(".ts")) return nextLoad(url, context);
  const source = await fs.readFile(new URL(url), "utf8");
  return { format: "module", shortCircuit: true, source: ts.transpileModule(source, {
    fileName: new URL(url).pathname,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText };
}

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

export function auditSharedCopy(root) {
  const sourcePath = path.join(root, "src/config/copy-translations.ts");
  const source = ts.createSourceFile(sourcePath, fs.readFileSync(sourcePath, "utf8"), ts.ScriptTarget.Latest, true);
  const translations = new Map();
  function readCatalog(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === "translations" &&
      node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
      for (const property of node.initializer.properties) {
        if (ts.isPropertyAssignment(property) && ts.isStringLiteralLike(property.name) &&
          ts.isArrayLiteralExpression(property.initializer)) {
          translations.set(property.name.text.trim(), property.initializer.elements.map(
            (item) => ts.isStringLiteralLike(item) ? item.text : "",
          ));
        }
      }
    }
    ts.forEachChild(node, readCatalog);
  }
  readCatalog(source);
  const errors = [];
  const placeholders = (text) => [...text.matchAll(/\{\{([^}]+)\}\}/g)].map((match) => match[1]).sort().join(",");
  if (!translations.size) errors.push("No shared translations were found.");
  for (const [key, values] of translations) {
    if (values.length !== 3) errors.push(`Incomplete translation: ${key}`);
    values.forEach((value, index) => {
      if (!value.trim()) errors.push(`Empty ${["en", "pt", "fr"][index]} translation: ${key}`);
      if (placeholders(value) !== placeholders(key)) errors.push(`Interpolation mismatch: ${key}`);
    });
  }
  const invariantText = new Set(["SaborExpress", "x"]);
  for (const file of fs.readdirSync(path.join(root, "src"), { recursive: true }).filter((file) => /\.tsx?$/.test(file))) {
    const ast = ts.createSourceFile(file, fs.readFileSync(path.join(root, "src", file), "utf8"), ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isCallExpression(node) && node.expression.getText(ast) === "translateCopy" &&
        node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
        const text = node.arguments[0].text.trim();
        if (text && /[\p{L}]/u.test(text) && !invariantText.has(text) && !translations.has(text)) {
          errors.push(`Untranslated source in ${file}: ${text}`);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
  console.log(`${errors.length ? "FAIL" : "PASS"} shared copy: ${translations.size} messages in es/en/pt/fr`);
  errors.slice(0, 80).forEach((message) => console.error(message));
  if (errors.length) process.exitCode = 1;
}

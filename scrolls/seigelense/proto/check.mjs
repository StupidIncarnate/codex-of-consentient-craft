import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Resolves upward to the repo root's node_modules.
const ts = createRequire(import.meta.url)('typescript');

const here = path.dirname(fileURLToPath(import.meta.url));
const files = ['hydration.ts', 'ingredients.ts', 'db.ts', 'recipes.ts', 'usage.ts', 'negative.ts', 'declarations.ts', 'steps.ts'].map((f) =>
  path.join(here, f),
);

const options = {
  strict: true,
  exactOptionalPropertyTypes: false,
  noUncheckedIndexedAccess: false,
  noEmit: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  skipLibCheck: true,
  lib: ['lib.es2022.d.ts'],
};

const program = ts.createProgram(files, options);
const diagnostics = [
  ...program.getSemanticDiagnostics(),
  ...program.getSyntacticDiagnostics(),
];

const fmt = (d) => {
  const file = d.file ? path.basename(d.file.fileName) : '(no file)';
  const pos = d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start) : null;
  const where = pos ? `${file}:${pos.line + 1}:${pos.character + 1}` : file;
  return `  ${where}  TS${d.code}  ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
};

console.log(`TypeScript ${ts.version} · strict · ${files.length} files`);
console.log(`checked: ${files.map((f) => path.basename(f)).join(', ')}\n`);

if (diagnostics.length === 0) {
  console.log('CLEAN — 0 diagnostics.');
  console.log('Every @ts-expect-error in negative.ts, declarations.ts and steps.ts was satisfied;');
  console.log('an unused directive would itself have reported here.');
  process.exit(0);
}

console.log(`${diagnostics.length} diagnostic(s):`);
for (const d of diagnostics) console.log(fmt(d));
process.exit(1);

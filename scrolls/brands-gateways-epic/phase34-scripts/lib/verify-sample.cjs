// Proves a rewrite script's sample output without touching packages/. Every file under each
// <sampleDir> (laid out as its repo-relative path) is overlaid in memory at its REAL path, all at
// once, together with every workspace package.json's planned three-key exports (unless the sample
// carries that package.json itself). Then, for every sample .ts file (or only --check=<a,b>):
//   1. every import specifier is resolved with ts.resolveModuleName (fenced to this worktree);
//   2. the file is typechecked with its package's own tsconfig on today's disk and on the overlaid
//      tree, and any diagnostic the overlay added is printed.
// Several sample dirs stack, so the outputs of two scripts can be proved together.
// Usage: node tmp/phase34/lib/verify-sample.cjs <sampleDir> [<sampleDir> ...] [--check=<file,...>] [--no-exports-overlay]
const fs = require('fs');
const path = require('path');
const lib = require('./repo.cjs');

const { ts, ROOT, rel } = lib;
const args = process.argv.slice(2);
const dirs = args.filter((a) => !a.startsWith('--')).map((d) => path.resolve(ROOT, d));
const useExports = !args.includes('--no-exports-overlay');
const checkOnly = args.find((a) => a.startsWith('--check='))?.slice(8).split(',').map((f) => path.resolve(ROOT, f)) ?? null;

const ws = lib.workspaces();
const overlay = useExports ? lib.plannedExportsOverlay(ws) : new Map();
const sampleFiles = [];
for (const d of dirs) {
  const walk = (x) => {
    for (const e of fs.readdirSync(x, { withFileTypes: true })) {
      const p = path.join(x, e.name);
      if (e.isDirectory()) walk(p);
      else {
        const real = path.join(ROOT, path.relative(d, p));
        const text = fs.readFileSync(p, 'utf8');
        overlay.set(real, text);
        const w = lib.workspaceOf(real, ws);
        if (w && real === w.packageJsonPath) overlay.set(path.join(ROOT, 'node_modules', w.name, 'package.json'), text);
        if (/\.tsx?$/u.test(p)) sampleFiles.push(real);
      }
    }
  };
  walk(d);
}
const toCheck = checkOnly ?? sampleFiles;
const resolve = lib.makeResolver(overlay);
const key = (d) => `${d.code}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
let failed = 0;
for (const real of toCheck) {
  const text = overlay.get(real) ?? fs.readFileSync(real, 'utf8');
  const sf = lib.parse(real, text);
  console.log(`\n# ${rel(real)}`);
  let shown = 0;
  for (const st of sf.statements) {
    if (!(ts.isImportDeclaration(st) || ts.isExportDeclaration(st)) || !st.moduleSpecifier) continue;
    const spec = st.moduleSpecifier.text;
    const r = resolve(spec, real);
    if (!r) failed++;
    if (!r || shown < 12) console.log(`  ${r ? 'ok ' : 'NOT RESOLVED'} ${spec}${r ? '  ->  ' + rel(r) : ''}`);
    shown++;
  }
  if (shown > 12) console.log(`  ... ${shown - 12} more specifiers`);
  const options = lib.packageCompilerOptions(lib.workspaceOf(real, ws).dir);
  const before = fs.existsSync(real) ? (lib.diagnosticsWithOverlay([real], new Map(), options).diagnostics.get(real) ?? []) : [];
  const after = lib.diagnosticsWithOverlay([real], overlay, options).diagnostics.get(real) ?? [];
  const bk = new Set(before.map(key));
  const added = after.filter((d) => !bk.has(key(d)));
  console.log(`  typecheck: ${before.length} diagnostics before, ${after.length} after, ${added.length} new`);
  for (const d of added) console.log('   NEW ' + lib.formatDiagnostic(d));
  failed += added.length;
}
console.log(`\n${toCheck.length} files checked, ${failed} failures`);
process.exitCode = failed ? 1 : 0;

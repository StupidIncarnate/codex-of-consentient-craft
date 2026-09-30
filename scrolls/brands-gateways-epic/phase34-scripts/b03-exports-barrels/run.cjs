// B03 steps 1 and 2: every workspace package's package.json `exports` gets the three-key form of EPIC
// concession 1 (`./*.proxy`, `./*.stub`, `./*`), and every package-root folder-type barrel
// (`packages/shared/contracts.ts`) moves inside the folder it covers (`packages/shared/src/contracts/contracts.ts`),
// which is where the `./*` key (`./src/*/*.ts`) looks for it.
//
// What it does per package:
//   - exports: drops every `./<folderType>` key (the `./*` key replaces it), keeps every other key
//     ('.', './testing', './tsconfig', './rule-tester.harness', ...), adds the three keys with dist
//     paths taken from the package's own tsconfig.build.json rootDir/outDir.
//   - barrels: writes src/<ft>/<ft>.ts with every relative specifier recomputed from the new
//     location, deletes the root file, and rewrites every relative import of the old root file in
//     the same package. Stub and proxy lines stay: stripping them is b03-strip-barrels, which runs
//     after b03-per-file-imports has moved every importer off them.
//   - lists every non-TypeScript mention of a moved root barrel (package.json `files`, tsconfig,
//     jest config) for an agent.
// Skips `@gateway/*` (already this form) and `@dungeonmaster/testing` (its public exports stay).
//
// Usage:
//   node scrolls/brands-gateways-epic/phase34-scripts/b03-exports-barrels/run.cjs [pkg ...]                       dry run
//   node scrolls/brands-gateways-epic/phase34-scripts/b03-exports-barrels/run.cjs shared --sample-out=<dir>       write the result under <dir>
//   node scrolls/brands-gateways-epic/phase34-scripts/b03-exports-barrels/run.cjs shared --verify=<file,...>      typecheck those importer
//                                          files against the planned tree (overlaid in memory), before vs after
//   node scrolls/brands-gateways-epic/phase34-scripts/b03-exports-barrels/run.cjs shared apply                    write it in place
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');

const { ts, ROOT, rel } = lib;
const args = process.argv.slice(2);
const APPLY = args.includes('apply');
const opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? null;
const sampleOut = opt('sample-out');
const verifyFiles = opt('verify')?.split(',').map((f) => path.resolve(ROOT, f)) ?? [];
const pkgArgs = args.filter((a) => !a.startsWith('--') && a !== 'apply');

const ws = lib.workspaces();
const selected = ws.filter(
  (w) => !w.isGateway && w.name !== lib.pkgName('testing') && (!pkgArgs.length || pkgArgs.includes(w.short)),
);
const resolveNow = lib.makeResolver();

const writes = new Map(); // abs -> text | null (delete)
const leftovers = [];
let diffText = '';
const summary = [];

const specFrom = (fromFile, targetAbs) => {
  const noExt = targetAbs.replace(/\.(ts|tsx)$/u, '');
  let r = path.relative(path.dirname(fromFile), noExt).split(path.sep).join('/');
  if (!r.startsWith('.')) r = './' + r;
  return r;
};

const rewriteRelativeSpecs = (text, oldFile, newFile, only = null) => {
  const sf = lib.parse(oldFile, text);
  const edits = [];
  const visit = (n) => {
    const lit =
      (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)
        ? n.moduleSpecifier
        : ts.isCallExpression(n) && n.arguments.length === 1 && ts.isStringLiteral(n.arguments[0]) &&
            (n.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(n.expression) && n.expression.text === 'require'))
          ? n.arguments[0]
          : null;
    if (lit && lit.text.startsWith('.')) {
      const target = resolveNow(lit.text, oldFile);
      if (target && (!only || only.has(target))) {
        const next = specFrom(newFile, only ? only.get(target) : target);
        if (next !== lit.text) edits.push({ start: lit.getStart(sf) + 1, end: lit.end - 1, text: next });
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return lib.applyEdits(text, edits);
};

for (const w of selected) {
  const old = w.packageJson.exports ?? {};
  const planned = lib.plannedExports(w, { keepUnmovedBarrels: false });
  const moves = new Map(); // old abs -> new abs
  for (const k of planned.dropped) {
    const ft = k.slice(2);
    const entry = old[k];
    const src = typeof entry === 'string' ? entry : (entry.source ?? entry.types);
    const oldAbs = path.resolve(w.dir, src);
    const newAbs = path.join(w.dir, 'src', ft, `${ft}.ts`);
    if (!fs.existsSync(oldAbs)) {
      leftovers.push({ kind: 'barrel-source-missing', pkg: w.short, key: k, source: src });
      continue;
    }
    if (oldAbs === newAbs) continue;
    if (fs.existsSync(newAbs)) {
      leftovers.push({ kind: 'barrel-target-exists', pkg: w.short, key: k, target: rel(newAbs) });
      continue;
    }
    moves.set(oldAbs, newAbs);
  }
  // package.json
  const pjBefore = fs.readFileSync(w.packageJsonPath, 'utf8');
  const pjAfter = JSON.stringify({ ...w.packageJson, exports: planned.exports }, null, 2) + '\n';
  if (pjAfter !== pjBefore) writes.set(w.packageJsonPath, pjAfter);
  // barrels
  for (const [oldAbs, newAbs] of moves) {
    writes.set(newAbs, rewriteRelativeSpecs(fs.readFileSync(oldAbs, 'utf8'), oldAbs, newAbs));
    writes.set(oldAbs, null);
  }
  // relative importers of a moved root barrel, anywhere in this package
  let importersRewritten = 0;
  if (moves.size) {
    for (const f of lib.walk(w.dir)) {
      if (moves.has(f)) continue;
      const text = fs.readFileSync(f, 'utf8');
      const next = rewriteRelativeSpecs(text, f, f, moves);
      if (next !== text) {
        writes.set(f, next);
        importersRewritten++;
      }
    }
    // non-TypeScript mentions of a moved root file
    for (const name of fs.readdirSync(w.dir)) {
      if (!/\.(json|js|cjs|mjs)$/u.test(name) || name === 'package.json') continue;
      const t = fs.readFileSync(path.join(w.dir, name), 'utf8');
      for (const oldAbs of moves.keys()) {
        const base = path.basename(oldAbs);
        if (t.includes(`"./${base}"`) || t.includes(`'./${base}'`) || t.includes(`"${base}"`)) {
          leftovers.push({ kind: 'non-ts-mention', pkg: w.short, file: `${w.rel}/${name}`, mentions: base });
        }
      }
    }
  }
  const fileKeys = Object.keys(w.packageJson).filter((k) => k === 'files');
  if (fileKeys.length && moves.size) {
    for (const oldAbs of moves.keys()) {
      if ((w.packageJson.files ?? []).some((f) => f.includes(path.basename(oldAbs)))) {
        leftovers.push({ kind: 'files-field-mention', pkg: w.short, mentions: path.basename(oldAbs) });
      }
    }
  }
  summary.push({
    pkg: w.short,
    keysBefore: Object.keys(typeof old === 'string' ? { '.': old } : old),
    keysAfter: Object.keys(planned.exports),
    barrelsMoved: [...moves].map(([a, b]) => `${rel(a)} -> ${rel(b)}`),
    importersRewritten,
  });
}

for (const [abs, text] of writes) {
  const before = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
  diffText += text === null ? `--- a/${rel(abs)}\n+++ /dev/null (deleted)\n` : lib.unifiedDiff(rel(abs), before, text);
}
const OUT = lib.outDir(__dirname);
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'last-run.diff'), diffText);
fs.writeFileSync(path.join(OUT, 'leftovers.json'), JSON.stringify(leftovers, null, 1));

for (const s of summary) {
  console.log(`\n${s.pkg}\n  exports: [${s.keysBefore.join(', ')}]\n       -> [${s.keysAfter.join(', ')}]`);
  for (const m of s.barrelsMoved) console.log(`  move ${m}`);
  if (s.importersRewritten) console.log(`  relative importers of moved barrels rewritten: ${s.importersRewritten}`);
}
const deletes = [...writes.values()].filter((v) => v === null).length;
console.log(`\n${APPLY ? 'APPLIED' : sampleOut ? 'SAMPLE' : 'DRY RUN'}: ${writes.size - deletes} files written, ${deletes} deleted, ${summary.length} packages`);
console.log('left for an agent (out/leftovers.json):', leftovers.length, [...new Set(leftovers.map((l) => l.kind))]);

if (verifyFiles.length) {
  const overlay = new Map();
  for (const [abs, text] of writes) {
    overlay.set(abs, text);
    const w = lib.workspaceOf(abs, ws);
    if (abs === w?.packageJsonPath) overlay.set(path.join(ROOT, 'node_modules', w.name, 'package.json'), text);
  }
  const key = (d) => `${d.code}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
  for (const f of verifyFiles) {
    const w = lib.workspaceOf(f, ws);
    const o = lib.packageCompilerOptions(w.dir);
    const before = lib.diagnosticsWithOverlay([f], new Map(), o).diagnostics.get(f) ?? [];
    const after = lib.diagnosticsWithOverlay([f], overlay, o).diagnostics.get(f) ?? [];
    const bk = new Set(before.map(key));
    const added = after.filter((d) => !bk.has(key(d)));
    const r = lib.makeResolver(overlay);
    const sf = lib.parse(f, overlay.get(f) ?? fs.readFileSync(f, 'utf8'));
    console.log(`\nverify ${rel(f)}`);
    for (const st of sf.statements) {
      if (!(ts.isImportDeclaration(st) || ts.isExportDeclaration(st)) || !st.moduleSpecifier) continue;
      if (!lib.SCOPE_RE.test(st.moduleSpecifier.text) && !st.moduleSpecifier.text.startsWith('.')) continue;
      const t = r(st.moduleSpecifier.text, f);
      console.log(`  ${t ? 'ok ' : 'NOT RESOLVED'} ${st.moduleSpecifier.text}${t ? '  ->  ' + rel(t) : ''}`);
    }
    console.log(`  typecheck: ${before.length} before, ${after.length} after, ${added.length} new`);
    for (const d of added) console.log('   NEW ' + lib.formatDiagnostic(d));
  }
}

if (sampleOut) {
  for (const [abs, text] of writes) {
    if (text === null) continue;
    const dest = path.join(path.resolve(ROOT, sampleOut), rel(abs));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, text);
  }
} else if (APPLY) {
  for (const [abs, text] of writes) {
    if (text === null) { const mv = path.join(lib.DELETIONS, '3.3', rel(abs)); fs.mkdirSync(path.dirname(mv), { recursive: true }); fs.renameSync(abs, mv); }
    else {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, text);
    }
  }
}

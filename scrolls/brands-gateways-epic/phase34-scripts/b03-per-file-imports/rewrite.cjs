// B03: rewrite every import that brings a stub or proxy in through a workspace barrel
// (`@dungeonmaster/shared/contracts`, `@dungeonmaster/orchestrator/testing`, `@dungeonmaster/orchestrator`,
// a package's own relative barrel, ...) to the per-file specifier of the file that declares it:
//   import { questContract, QuestStub } from '@dungeonmaster/shared/contracts';
// becomes
//   import { questContract } from '@dungeonmaster/shared/contracts';
//   import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
//
// "Stub or proxy" means the name's DECLARING FILE is a `.stub.ts`/`.proxy.ts` file, found by following
// the barrel's export graph through TypeScript's own module resolution — never by the name's suffix.
// A same-package declaring file gets a relative specifier; another package's gets
// `@dungeonmaster/<pkg>/<path under src, no extension>`. Every new specifier is checked to resolve
// back to the declaring file against the package.json each target package WILL have (the three-key
// exports form, overlaid in memory), so a dry run proves the rewrite before exports change.
//
// Targets: every workspace package except `@gateway/*` (already per-file) and `@dungeonmaster/testing`
// (its public test support stays as it is).
//
// Usage (from the repo root):
//   node tmp/phase34/b03-per-file-imports/rewrite.cjs                     dry run, whole repo
//   node tmp/phase34/b03-per-file-imports/rewrite.cjs --importers=web,mcp  only files in these packages
//   node tmp/phase34/b03-per-file-imports/rewrite.cjs --targets=shared     only names declared in shared
//   node tmp/phase34/b03-per-file-imports/rewrite.cjs --sample-out=<dir> --files=a.ts,b.ts
//                                                   write rewritten copies of those files into <dir>
//   node tmp/phase34/b03-per-file-imports/rewrite.cjs ... apply            write the edits in place
// Every run writes out/last-run.diff (full unified diff) and out/leftovers.json (what an agent must do).
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');

const { ts, ROOT, rel } = lib;
const args = process.argv.slice(2);
const flag = (n) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  return a ? a.slice(n.length + 3).split(',').filter(Boolean) : null;
};
const APPLY = args.includes('apply');
const importerFilter = flag('importers');
const targetFilter = flag('targets');
const sampleOut = flag('sample-out')?.[0] ?? null;
const onlyFiles = flag('files')?.map((f) => path.resolve(ROOT, f)) ?? null;
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

const ws = lib.workspaces();
const byName = new Map(ws.map((w) => [w.name, w]));
const targets = ws.filter(
  (w) => !w.isGateway && w.name !== '@dungeonmaster/testing' && (!targetFilter || targetFilter.includes(w.short)),
);
const targetNames = new Set(targets.map((w) => w.name));

// Planned package.json for every target, overlaid in memory for verification.
const overlay = new Map();
for (const w of targets) {
  const planned = { ...w.packageJson, exports: lib.plannedExports(w).exports };
  const text = JSON.stringify(planned, null, 2);
  overlay.set(w.packageJsonPath, text);
  // Resolution reads the package through its workspace symlink, so overlay that path too.
  overlay.set(path.join(ROOT, 'node_modules', w.name, 'package.json'), text);
}
const resolveNow = lib.makeResolver();
const resolvePlanned = lib.makeResolver(overlay);

const rootBarrel = (abs) => {
  const w = lib.workspaceOf(abs, ws);
  return w && path.dirname(abs) === w.dir;
};

const leftovers = [];
const moves = [];
const left = (kind, file, detail) => leftovers.push({ kind, file: rel(file), ...detail });

const importerWs = ws.filter((w) => !importerFilter || importerFilter.includes(w.short));
const files = onlyFiles ?? importerWs.flatMap((w) => lib.walk(w.dir));

const stats = { filesScanned: 0, filesChanged: 0, statementsRewritten: 0, namesMoved: 0, merged: 0 };
const perTarget = {};
const perImporterPkg = {};
let diffText = '';

const specFor = (declFile, importer) => {
  const dw = lib.workspaceOf(declFile, ws);
  const iw = lib.workspaceOf(importer, ws);
  const noExt = declFile.replace(/\.tsx?$/u, '');
  if (dw === iw) {
    let r = path.relative(path.dirname(importer), noExt).split(path.sep).join('/');
    if (!r.startsWith('.')) r = './' + r;
    return { spec: r, crossPackage: false };
  }
  const src = path.join(dw.dir, 'src') + path.sep;
  if (!declFile.startsWith(src)) return null;
  return { spec: `${dw.name}/${path.relative(src, noExt).split(path.sep).join('/')}`, crossPackage: true };
};

for (const file of files) {
  stats.filesScanned++;
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes('@dungeonmaster/') && !/from\s+['"]\.{1,2}\//u.test(text)) continue;
  const sf = lib.parse(file, text);
  const importerW = lib.workspaceOf(file, ws);

  // Non-import string mentions of a `/testing` barrel (jest.mock, registerModuleMock, fixtures).
  const visitStrings = (n) => {
    if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && /@dungeonmaster\/[\w-]+\/testing\b/u.test(n.text)) {
      const p = n.parent;
      if (!(p && (ts.isImportDeclaration(p) || ts.isExportDeclaration(p)))) {
        left('testing-barrel-string', file, { line: sf.getLineAndCharacterOfPosition(n.getStart()).line + 1, text: n.text });
      }
    }
    ts.forEachChild(n, visitStrings);
  };
  visitStrings(sf);

  if (rootBarrel(file)) continue; // a package-root barrel is B03-strip's job, not an importer

  const decls = sf.statements.filter(
    (st) =>
      (ts.isImportDeclaration(st) || ts.isExportDeclaration(st)) &&
      st.moduleSpecifier &&
      ts.isStringLiteral(st.moduleSpecifier),
  );
  const plan = []; // { st, keep: [el], moved: [{el, spec}] }
  for (const st of decls) {
    const spec = st.moduleSpecifier.text;
    const target = resolveNow(spec, file);
    if (!target) {
      const m = /^(@dungeonmaster\/[\w-]+)/u.exec(spec);
      if (m && targetNames.has(m[1])) left('unresolved-specifier', file, { spec });
      continue;
    }
    const tw = lib.workspaceOf(target, ws);
    if (!tw || !targetNames.has(tw.name)) continue;
    if (lib.STUB_OR_PROXY_FILE.test(target)) continue; // already per file
    // Any module can re-export a stub; the export graph below decides, so no barrel list is needed.
    let clause;
    if (ts.isImportDeclaration(st)) {
      const ic = st.importClause;
      if (!ic) continue;
      if (ic.namedBindings && ts.isNamespaceImport(ic.namedBindings)) {
        if (spec.startsWith('@dungeonmaster/') || rootBarrel(target)) left('namespace-import', file, { spec });
        continue;
      }
      clause = ic.namedBindings && ts.isNamedImports(ic.namedBindings) ? ic.namedBindings.elements : [];
      if (ic.name && (spec.startsWith('@dungeonmaster/') || rootBarrel(target))) left('default-import', file, { spec });
    } else {
      if (!st.exportClause || !ts.isNamedExports(st.exportClause)) continue;
      clause = st.exportClause.elements;
    }
    const keep = [];
    const moved = [];
    for (const el of clause) {
      const importedName = (el.propertyName ?? el.name).text;
      const found = lib.findDeclaringFile(target, importedName, resolveNow);
      if (!found) {
        left('unresolved-name', file, { spec, name: importedName });
        keep.push(el);
        continue;
      }
      if (found.kind !== 'decl' || !lib.STUB_OR_PROXY_FILE.test(found.file)) {
        if (/\/testing$/u.test(spec)) left('testing-barrel-non-stub', file, { spec, name: importedName, declaredIn: rel(found.file) });
        keep.push(el);
        continue;
      }
      const ns = specFor(found.file, file);
      if (!ns) {
        left('declared-outside-src', file, { spec, name: importedName, declaredIn: rel(found.file) });
        keep.push(el);
        continue;
      }
      const check = (ns.crossPackage ? resolvePlanned : resolveNow)(ns.spec, file);
      if (check !== found.file) {
        left('verify-failed', file, { spec, name: importedName, newSpec: ns.spec, resolvedTo: check && rel(check), expected: rel(found.file) });
        keep.push(el);
        continue;
      }
      if (!lib.isTestSupport(file)) left('production-importer', file, { name: importedName, newSpec: ns.spec });
      moved.push({ el, spec: ns.spec, declaredIn: found.file });
      moves.push({ file: rel(file), oldSpec: spec, name: importedName, newSpec: ns.spec });
      const tk = `${tw.short}${spec.startsWith('.') ? ' (relative)' : ''}`;
      perTarget[tk] = (perTarget[tk] ?? 0) + 1;
    }
    if (moved.length) plan.push({ st, keep, moved });
  }
  if (!plan.length) continue;

  // Group moved names per (new specifier, type-only-ness) across the whole file.
  const q = (st) => st.moduleSpecifier.getText(sf)[0];
  const kw = (st) => (ts.isImportDeclaration(st) ? 'import' : 'export');
  const isTypeOnly = (st) => (ts.isImportDeclaration(st) ? st.importClause.isTypeOnly : st.isTypeOnly);
  const groups = new Map();
  for (const p of plan) {
    for (const m of p.moved) {
      const key = `${kw(p.st)}\0${isTypeOnly(p.st)}\0${m.spec}`;
      if (!groups.has(key)) groups.set(key, { anchor: p.st, kw: kw(p.st), typeOnly: isTypeOnly(p.st), spec: m.spec, els: [] });
      const g = groups.get(key);
      const t = m.el.getText(sf);
      if (!g.els.includes(t)) g.els.push(t);
    }
  }
  // Merge into an untouched declaration that already imports the same specifier.
  const touched = new Set(plan.map((p) => p.st));
  const mergeInto = new Map();
  for (const g of groups.values()) {
    const existing = decls.find(
      (st) =>
        !touched.has(st) &&
        st.moduleSpecifier.text === g.spec &&
        kw(st) === g.kw &&
        isTypeOnly(st) === g.typeOnly &&
        (ts.isImportDeclaration(st)
          ? st.importClause && !st.importClause.name && st.importClause.namedBindings && ts.isNamedImports(st.importClause.namedBindings)
          : st.exportClause && ts.isNamedExports(st.exportClause)),
    );
    if (existing) {
      g.mergedInto = existing;
      mergeInto.set(existing, g);
      stats.merged++;
    }
  }
  const line = (k, typeOnly, els, spec, quote) => `${k}${typeOnly ? ' type' : ''} { ${els.join(', ')} } from ${quote}${spec}${quote};`;
  const edits = [];
  for (const p of plan) {
    const parts = [];
    if (p.keep.length || (ts.isImportDeclaration(p.st) && p.st.importClause.name)) {
      const def = ts.isImportDeclaration(p.st) && p.st.importClause.name ? p.st.importClause.name.text : null;
      const named = p.keep.map((e) => e.getText(sf));
      const typeOnly = isTypeOnly(p.st);
      const body = [def, named.length ? `{ ${named.join(', ')} }` : null].filter(Boolean).join(', ');
      parts.push(`${kw(p.st)}${typeOnly ? ' type' : ''} ${body} from ${q(p.st)}${p.st.moduleSpecifier.text}${q(p.st)};`);
    }
    for (const g of groups.values()) {
      if (g.anchor === p.st && !g.mergedInto) parts.push(line(g.kw, g.typeOnly, g.els, g.spec, q(p.st)));
    }
    edits.push({ start: p.st.getStart(sf), end: p.st.end, text: parts.join('\n') });
    stats.statementsRewritten++;
    stats.namesMoved += p.moved.length;
  }
  for (const [st, g] of mergeInto) {
    const cur = (ts.isImportDeclaration(st) ? st.importClause.namedBindings.elements : st.exportClause.elements).map((e) => e.getText(sf));
    const els = [...cur, ...g.els.filter((e) => !cur.includes(e))];
    edits.push({ start: st.getStart(sf), end: st.end, text: line(g.kw, g.typeOnly, els, g.spec, q(st)) });
  }
  // A removed statement leaves an empty line; collapse "\n\n" left where a whole statement vanished.
  let after = lib.applyEdits(text, edits).replace(/^[ \t]*\n(?=[ \t]*\n)/gmu, '');
  if (after === text) continue;
  stats.filesChanged++;
  perImporterPkg[importerW.short] = (perImporterPkg[importerW.short] ?? 0) + 1;
  diffText += lib.unifiedDiff(rel(file), text, after);
  if (sampleOut) {
    const dest = path.join(path.resolve(ROOT, sampleOut), rel(file));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, after);
  } else if (APPLY) {
    fs.writeFileSync(file, after);
  }
}

fs.writeFileSync(path.join(OUT, 'last-run.diff'), diffText);
fs.writeFileSync(path.join(OUT, 'leftovers.json'), JSON.stringify(leftovers, null, 1));
fs.writeFileSync(path.join(OUT, 'moves.json'), JSON.stringify(moves, null, 1));
const byKind = {};
for (const l of leftovers) byKind[l.kind] = (byKind[l.kind] ?? 0) + 1;
console.log(APPLY ? 'APPLIED' : sampleOut ? `SAMPLE written to ${sampleOut}` : 'DRY RUN (pass "apply" to write)');
console.log(stats);
console.log('files changed per importer package:', perImporterPkg);
console.log('names moved per declaring package:', perTarget);
console.log('left for an agent (out/leftovers.json):', byKind);
console.log(`full diff: ${rel(path.join(OUT, 'last-run.diff'))}`);

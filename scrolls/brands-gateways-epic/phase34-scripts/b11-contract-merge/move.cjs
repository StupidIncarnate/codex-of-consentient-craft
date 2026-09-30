// B11, after a human has decided a merge: point every importer of one contract copy at the copy that
// keeps the name, then delete the losing copy's contract, stub and test and its barrel lines.
//
//   node scrolls/brands-gateways-epic/phase34-scripts/b11-contract-merge/move.cjs --from=<losing -contract.ts> --to=<keeping -contract.ts>
//        [--sample-out=<dir>] [apply]
//
// Every name the losing contract file and its <base>.stub.ts export must also be exported by the
// keeper and its stub, or the run refuses (reconciling two different checks is the human's job, done
// in the keeper BEFORE this runs — B11's FolderType case). Importers are found by resolving every
// import in the repo to its declaring file, never by name. The new specifier is:
//   same package as the keeper       a relative path to the keeper file
//   a stub or proxy, other package   @dungeonmaster/<pkg>/<path under src>   (B03's per-file key)
//   a contract, other package        @dungeonmaster/<pkg>/contracts          (the folder barrel; refused
//                                    and listed if that barrel does not export the name)
// Each rewritten specifier is resolved back to the keeper under B03's planned exports, and an importer
// whose package.json does not depend on the keeper's package is listed (production importers need
// `dependencies`; tests may use `devDependencies`).
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');

const { ts, ROOT, rel } = lib;
const args = process.argv.slice(2);
const opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? null;
const APPLY = args.includes('apply');
const sampleOut = opt('sample-out');
const from = path.resolve(ROOT, opt('from') ?? '');
const to = path.resolve(ROOT, opt('to') ?? '');
if (!/-contract\.ts$/u.test(from) || !/-contract\.ts$/u.test(to) || !fs.existsSync(from) || !fs.existsSync(to)) {
  console.error('usage: move.cjs --from=<losing -contract.ts> --to=<keeping -contract.ts> [apply]');
  process.exit(2);
}
const stubOf = (c) => c.replace(/-contract\.ts$/u, '.stub.ts');
const testOf = (c) => c.replace(/-contract\.ts$/u, '-contract.test.ts');
const ws = lib.workspaces();
const resolveNow = lib.makeResolver();
const resolvePlanned = lib.makeResolver(lib.plannedExportsOverlay(ws));

const exportedNames = (f) => {
  if (!fs.existsSync(f)) return new Set();
  const sf = lib.parse(f);
  const out = new Set();
  for (const st of sf.statements) {
    if (!((ts.getCombinedModifierFlags(st) & ts.ModifierFlags.Export) !== 0)) continue;
    if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) ts.isIdentifier(d.name) && out.add(d.name.text);
    else if (st.name) out.add(st.name.text);
  }
  return out;
};
const pairs = [
  [from, to],
  [stubOf(from), stubOf(to)],
];
const missing = [];
for (const [a, b] of pairs) {
  const nb = exportedNames(b);
  for (const n of exportedNames(a)) if (!nb.has(n)) missing.push(`${n} (in ${rel(a)}, not in ${rel(b)})`);
}
if (missing.length) {
  console.log('REFUSED: the keeper does not export every name the losing copy does. Reconcile first:');
  for (const m of missing) console.log('  ' + m);
  process.exit(1);
}
// Two copies with different schemas are two checks: the losing copy's callers may read a field the
// keeper lacks (mcp's getQuestInputContract has `format`; shared's does not). Refuse unless the
// human has reconciled them, or says the difference is known.
const schemaTexts = (f) => {
  const sf = lib.parse(f);
  const out = new Map();
  for (const st of sf.statements) {
    if (!ts.isVariableStatement(st)) continue;
    for (const d of st.declarationList.declarations) {
      if (ts.isIdentifier(d.name) && d.initializer) out.set(d.name.text, d.initializer.getText(sf).replace(/\s+/gu, ' ').replace(/,\s*([}\])])/gu, '$1'));
    }
  }
  return out;
};
const fromSchemas = schemaTexts(from);
const toSchemas = schemaTexts(to);
const differ = [...fromSchemas].filter(([n, t]) => toSchemas.has(n) && toSchemas.get(n) !== t);
if (differ.length && !args.includes('--definitions-differ-ok')) {
  console.log('REFUSED: the two copies define different schemas. Reconcile the keeper first (or pass --definitions-differ-ok):');
  for (const [n, t] of differ) console.log(`  ${n}\n    losing: ${t.slice(0, 300)}\n    keeper: ${toSchemas.get(n).slice(0, 300)}`);
  process.exit(1);
}
const redirect = new Map(pairs.filter(([a]) => fs.existsSync(a)));
const losing = new Set([from, stubOf(from), testOf(from)].filter((f) => fs.existsSync(f)));
const keeperWs = lib.workspaceOf(to, ws);
const depends = (importerWs, prod) => {
  const pj = importerWs.packageJson;
  const names = { ...pj.dependencies, ...pj.peerDependencies, ...(prod ? {} : pj.devDependencies) };
  return importerWs === keeperWs || keeperWs.name in names;
};

const leftovers = [];
const writes = new Map();
let rewritten = 0;
for (const w of ws) {
  for (const f of lib.walk(w.dir)) {
    if (losing.has(f)) continue;
    const text = fs.readFileSync(f, 'utf8');
    const sf = lib.parse(f, text);
    const edits = [];
    for (const st of sf.statements) {
      if (!(ts.isImportDeclaration(st) || ts.isExportDeclaration(st)) || !st.moduleSpecifier || !ts.isStringLiteral(st.moduleSpecifier)) continue;
      const t = resolveNow(st.moduleSpecifier.text, f);
      if (!t) continue;
      const isExport = ts.isExportDeclaration(st);
      const lineEnd = text.indexOf('\n', st.end);
      const whole = { start: st.getStart(sf), end: lineEnd === -1 ? st.end : lineEnd + 1, text: '' };
      if (isExport && !st.exportClause) {
        if (redirect.has(t)) edits.push(whole); // a barrel's `export *` of the losing copy goes
        continue;
      }
      const clause = isExport
        ? st.exportClause && ts.isNamedExports(st.exportClause) ? st.exportClause.elements : []
        : st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings) ? st.importClause.namedBindings.elements : [];
      const keep = [];
      const groups = new Map();
      for (const el of clause) {
        const d = lib.findDeclaringFile(t, (el.propertyName ?? el.name).text, resolveNow);
        if (!d || !redirect.has(d.file)) {
          keep.push(el.getText(sf));
          continue;
        }
        if (isExport) continue; // a barrel re-export of the losing copy is dropped
        const target = redirect.get(d.file);
        let spec;
        if (lib.workspaceOf(f, ws) === keeperWs) {
          spec = path.relative(path.dirname(f), target.replace(/\.ts$/u, '')).split(path.sep).join('/');
          if (!spec.startsWith('.')) spec = './' + spec;
        } else if (lib.STUB_OR_PROXY_FILE.test(target)) {
          spec = `${keeperWs.name}/${path.relative(path.join(keeperWs.dir, 'src'), target.replace(/\.ts$/u, '')).split(path.sep).join('/')}`;
        } else {
          spec = `${keeperWs.name}/contracts`;
          const bt = resolvePlanned(spec, f);
          const bd = bt && lib.findDeclaringFile(bt, (el.propertyName ?? el.name).text, resolvePlanned);
          if (!bd || bd.file !== target) {
            leftovers.push({ kind: 'keeper-barrel-lacks-name', file: rel(f), name: (el.propertyName ?? el.name).text, barrel: spec });
            keep.push(el.getText(sf));
            continue;
          }
        }
        const back = (spec.startsWith('.') ? resolveNow : resolvePlanned)(spec, f);
        if (back !== target && !(spec.endsWith('/contracts') && back)) {
          leftovers.push({ kind: 'verify-failed', file: rel(f), spec, resolvedTo: back && rel(back) });
          keep.push(el.getText(sf));
          continue;
        }
        if (!depends(lib.workspaceOf(f, ws), !lib.isTestSupport(f))) {
          leftovers.push({ kind: 'missing-dependency', file: rel(f), needs: keeperWs.name, as: lib.isTestSupport(f) ? 'devDependencies' : 'dependencies' });
        }
        const typeOnly = st.importClause.isTypeOnly;
        const k = `${typeOnly}\0${spec}`;
        if (!groups.has(k)) groups.set(k, { typeOnly, spec, els: [] });
        groups.get(k).els.push(el.getText(sf));
      }
      if (keep.length === clause.length) continue;
      const q = st.moduleSpecifier.getText(sf)[0];
      const parts = [];
      const kw = isExport ? 'export' : 'import';
      const defName = !isExport && st.importClause.name ? st.importClause.name.text : null;
      const tOnly = isExport ? st.isTypeOnly : st.importClause.isTypeOnly;
      if (keep.length || defName) {
        parts.push(`${kw}${tOnly ? ' type' : ''} ${[defName, keep.length ? `{ ${keep.join(', ')} }` : null].filter(Boolean).join(', ')} from ${q}${st.moduleSpecifier.text}${q};`);
      }
      for (const g of groups.values()) parts.push(`import${g.typeOnly ? ' type' : ''} { ${g.els.join(', ')} } from ${q}${g.spec}${q};`);
      edits.push(parts.length ? { start: st.getStart(sf), end: st.end, text: parts.join('\n') } : whole);
    }
    if (edits.length) {
      writes.set(f, lib.mergeDuplicateImports(f, lib.applyEdits(text, edits)));
      rewritten++;
    }
  }
}

let diff = '';
for (const f of losing) diff += `--- a/${rel(f)}\n+++ /dev/null (deleted)\n`;
for (const [f, t] of writes) diff += lib.unifiedDiff(rel(f), fs.readFileSync(f, 'utf8'), t);
fs.mkdirSync(lib.outDir(__dirname), { recursive: true });
fs.writeFileSync(path.join(lib.outDir(__dirname), 'move-last-run.diff'), diff);
fs.writeFileSync(path.join(lib.outDir(__dirname), 'move-leftovers.json'), JSON.stringify(leftovers, null, 1));
console.log(`${APPLY ? 'APPLIED' : sampleOut ? 'SAMPLE' : 'DRY RUN'}: ${rel(from)} -> ${rel(to)}`);
console.log(`  ${rewritten} files rewritten, ${losing.size} files deleted, ${leftovers.length} left for an agent`, [...new Set(leftovers.map((l) => l.kind))]);
console.log(`  diff: ${path.join(lib.outDir(__dirname), 'move-last-run.diff')}`);
// An importer left pointing at the losing copy would break the moment it is deleted: nothing is
// written until every importer could be moved (a missing package dependency is listed, not blocking).
const blocking = leftovers.filter((l) => l.kind !== 'missing-dependency');
if (blocking.length) {
  console.log(`  BLOCKED: ${blocking.length} importers could not be moved (see out/move-leftovers.json); nothing will be written.`);
  process.exitCode = 1;
} else if (sampleOut) {
  for (const [f, t] of writes) {
    const dest = path.join(path.resolve(ROOT, sampleOut), rel(f));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, t);
  }
} else if (APPLY) {
  for (const f of losing) {
    const mv = path.join(lib.DELETIONS, 'W2', path.relative(ROOT, f));
    fs.mkdirSync(path.dirname(mv), { recursive: true });
    fs.renameSync(f, mv);
  }
  for (const [f, t] of writes) fs.writeFileSync(f, t);
}

// B13: apply every candidate on an overlay, typecheck each package's program, attribute new diagnostics to candidates.
// Usage: node .../validate.cjs [--tests] [--sample-out=dir]
const fs = require('fs');
const path = require('path');
const lib = require('../../lib/repo.cjs');
const { candidates, barrelExports, resolver, owners } = require('./retype.cjs');
const { ts, ROOT, rel } = lib;
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const ws = lib.workspaces();

// group per file
const buildOverlay = (cands) => {
const byFile = new Map();
for (const c of cands) (byFile.get(c.file) ?? byFile.set(c.file, []).get(c.file)).push(c);
const overlay = new Map();
const kept = [];
let dropped = 0;
for (const [f, cs] of byFile) {
  const text = fs.readFileSync(f, 'utf8');
  const sf = lib.parse(f, text);
  const imports = new Map(); // name -> spec
  for (const st of sf.statements) if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) for (const e of st.importClause.namedBindings.elements) imports.set(e.name.text, st.moduleSpecifier.text);
  const edits = [];
  const need = new Map();
  for (const c of cs) {
    let spec;
    if (c.ownerPkg === c.pkg) {
      let r = path.relative(path.dirname(f), c.ownerFile.replace(/\.ts$/u, ''));
      if (!r.startsWith('.')) r = './' + r;
      spec = r.split(path.sep).join('/');
    } else {
      if (!barrelExports(c.ownerPkg, c.owner)) { dropped++; continue; }
      spec = `${c.ownerPkg}/contracts`;
    }
    if (imports.has(c.owner) && imports.get(c.owner) !== spec) { dropped++; continue; }
    // top-level declared name clash
    if (sf.statements.some((s) => (ts.isTypeAliasDeclaration(s) || ts.isInterfaceDeclaration(s) || ts.isClassDeclaration(s)) && s.name?.text === c.owner)) { dropped++; continue; }
    if (!imports.has(c.owner)) need.set(c.owner, spec);
    edits.push({ start: c.strStart, end: c.strEnd, text: `${c.owner}['${c.key}']` });
    kept.push(c);
  }
  if (!edits.length) continue;
  const firstImport = sf.statements.find((s) => ts.isImportDeclaration(s));
  const anchor = firstImport ? firstImport.getStart(sf) : 0;
  const lines = [...need].map(([n, s]) => `import type { ${n} } from '${s}';`).join('\n');
  if (lines) edits.push({ start: anchor, end: anchor, text: lines + '\n' });
  overlay.set(f, lib.mergeDuplicateImports(f, lib.applyEdits(text, edits)));
}

return { overlay, kept, dropped };
};
const { overlay, kept, dropped } = buildOverlay(candidates);
console.log(`candidates ${candidates.length}, kept ${kept.length} (dropped ${dropped}: not on barrel / name clash), files ${overlay.size}`);

// typecheck: every package that has an edited file, plus every package depending on one
const editedPkgs = new Set([...overlay.keys()].map((f) => lib.workspaceOf(f, ws).name));
const target = ws.filter((w) => !w.isGateway && (editedPkgs.has(w.name) || Object.keys({ ...w.packageJson.dependencies, ...w.packageJson.devDependencies }).some((d) => editedPkgs.has(d))));
const keyOf = (d) => `${d.code}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
const fnOfCandidate = new Map(); // `${file}:${fnStart}` -> candidate list
const results = { newDiags: 0, attributed: 0, unattributed: 0, perCandidate: new Map() };
for (const c of kept) results.perCandidate.set(c, []);
const unattr = [];
const newDiagFiles = new Map();
const t0 = Date.now();
for (const w of target) {
  const files = lib.walk(w.dir).filter((f) => !f.includes('/dist/'));
  const options = lib.packageCompilerOptions(w.dir);
  const base = lib.diagnosticsWithOverlay(files, new Map(), options);
  const aft = lib.diagnosticsWithOverlay(files, overlay, options);
  const checker = aft.program.getTypeChecker();
  // map function nodes (in overlay text) of candidates: by file + position of strStart shift is hard; use name+file
  const candByFile = new Map();
  for (const c of kept) (candByFile.get(c.file) ?? candByFile.set(c.file, []).get(c.file)).push(c);
  let added = 0;
  for (const f of files) {
    const _pre = results.newDiags;
    const bk = new Set((base.diagnostics.get(f) ?? []).map(keyOf));
    const add = (aft.diagnostics.get(f) ?? []).filter((d) => !bk.has(keyOf(d)));
    if (add.length) (newDiagFiles.get(w) ?? newDiagFiles.set(w, new Set()).get(w)).add(f);
    for (const d of add) {
      added++;
      results.newDiags++;
      const sf = d.file;
      let node = sf ? (function find(n) { return ts.forEachChild(n, (c) => (d.start >= c.getStart(sf) && d.start < c.end ? find(c) : undefined)) ?? n; })(sf) : null;
      let hit = null;
      // 1) inside a function that holds a candidate parameter (same file)
      for (let n = node; n && !hit; n = n.parent) {
        if ((ts.isArrowFunction(n) || ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n)) && candByFile.has(f)) {
          const txt = n.parameters.map((p) => p.getText(sf)).join(',');
          hit = candByFile.get(f).find((c) => txt.includes(`${c.owner}['${c.key}']`) && txt.includes(c.name)) ?? null;
        }
      }
      // 2) a call whose callee is a candidate function
      for (let n = node; n && !hit; n = n.parent) {
        if (ts.isCallExpression(n)) {
          let sym = checker.getSymbolAtLocation(n.expression);
          if (sym && sym.flags & ts.SymbolFlags.Alias) sym = checker.getAliasedSymbol(sym);
          const decl = sym?.declarations?.[0];
          const dsf = decl?.getSourceFile();
          if (decl && dsf) {
            const df = path.resolve(dsf.fileName);
            const list = candByFile.get(df);
            if (list) {
              let fnNode = decl;
              if (ts.isVariableDeclaration(decl) && decl.initializer) fnNode = decl.initializer;
              const ptxt = fnNode.parameters ? fnNode.parameters.map((p) => p.getText(dsf)).join(',') : '';
              hit = list.find((c) => ptxt.includes(`${c.owner}['${c.key}']`) && ptxt.includes(c.name)) ?? null;
            }
          }
        }
      }
      if (hit) { results.attributed++; results.perCandidate.get(hit).push(lib.formatDiagnostic(d)); }
      else { results.unattributed++; if (unattr.length < 25) unattr.push(lib.formatDiagnostic(d)); }
    }
  }
  console.error(`${w.short}: ${files.length} files, ${added} new diagnostics (${(Date.now() - t0) / 1000}s)`);
}
// per-candidate isolation over the files that gained diagnostics
const isolated = new Map();
if (!process.argv.includes('--no-isolate')) {
  const live = new Map();
  const svcs = [...newDiagFiles.keys()].map((w) => ({ w, svc: lib.makeLanguageService(w.dir, live), files: [...newDiagFiles.get(w)] }));
  const diagCount = (extraFiles) => svcs.reduce((a, { svc, files, w }) => a + [...new Set([...files, ...extraFiles.filter((f) => f.startsWith(w.dir))])].reduce((b, f) => b + svc.service.getSemanticDiagnostics(f).length + svc.service.getSyntacticDiagnostics(f).length, 0), 0);
  const bump = (f, text) => live.set(f, { v: (live.get(f)?.v ?? 0) + 1, text });
  const baseCount = diagCount([]);
  let n = 0;
  for (const c of kept) {
    const { overlay: o } = buildOverlay([c]);
    for (const [f, t] of o) bump(f, t);
    const files = [...o.keys()];
    const total = diagCount(files);
    for (const f of files) bump(f, fs.readFileSync(f, 'utf8'));
    const baseHere = diagCount(files);
    isolated.set(c, total - baseHere);
    n++;
  }
  console.log('isolated: candidates with 0 new diagnostics on their own:', [...isolated.values()].filter((x) => x === 0).length, 'of', kept.length, ' (total when applied one by one:', [...isolated.values()].reduce((a, b) => a + b, 0), ')');
  console.log('isolated prod:', kept.filter((c) => !lib.isTestSupport(c.file) && isolated.get(c) === 0).length, 'of', kept.filter((c) => !lib.isTestSupport(c.file)).length);
}
const clean = kept.filter((c) => results.perCandidate.get(c).length === 0);
const isProd = (c) => !lib.isTestSupport(c.file);
console.log(JSON.stringify({ kept: kept.length, prodKept: kept.filter(isProd).length, cleanCandidates: clean.length, cleanProd: clean.filter(isProd).length, newDiagnostics: results.newDiags, attributed: results.attributed, unattributed: results.unattributed }));
// file-level: files whose every candidate is clean, and no unattributed diag
const fileClean = new Map();
for (const c of kept) fileClean.set(c.file, (fileClean.get(c.file) ?? true) && results.perCandidate.get(c).length === 0);
console.log('files fully clean:', [...fileClean.values()].filter(Boolean).length, 'of', fileClean.size);
const kinds = {};
for (const c of kept) for (const d of results.perCandidate.get(c)) { const m = /TS(\d+): (.{0,50})/.exec(d); const k = 'TS' + m[1] + ' ' + m[2].replace(/'[^']*'/g, 'X'); kinds[k] = (kinds[k] ?? 0) + 1; }
console.log('leftover kinds', JSON.stringify(Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 8)));
console.log('unattributed sample', unattr.slice(0, 5));
fs.mkdirSync(lib.outDir(__dirname), { recursive: true });
fs.writeFileSync(path.join(lib.outDir(__dirname), 'validate.json'), JSON.stringify({ kept: kept.map((c) => ({ ...c, file: rel(c.file), ownerFile: rel(c.ownerFile), diags: results.perCandidate.get(c) })) }, null, 1));
const out = arg('sample-out');
if (out) for (const [f, t] of overlay) { const d = path.join(ROOT, out, rel(f)); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.writeFileSync(d, t); }

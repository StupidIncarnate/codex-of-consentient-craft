// B03 step 3 and 4: no production barrel exports a stub or a proxy, and no `/testing` barrel exists.
//
// Production barrels = every file a non-gateway, non-testing workspace package's `exports` points at
// (its `source` condition) except `./testing`, plus every src/<ft>/<ft>.ts folder-type barrel.
// For each, drops every re-export whose declaring file (followed through the export graph with
// TypeScript's resolution) is a `.stub.ts`/`.proxy.ts`: a whole `export * from './x.stub'` line, or
// one name out of an `export { a, BStub } from ...` list.
//
// A package-root `testing.ts` is deleted, with its `./testing` exports key, ONLY when no file in the
// repo still imports it (every import specifier in every package is resolved to check). A barrel
// with importers left is listed with them; run b03-per-file-imports first.
//
// Usage:
//   node tmp/phase34/b03-strip-barrels/run.cjs [pkg ...]              dry run
//   node tmp/phase34/b03-strip-barrels/run.cjs shared --sample-out=<dir>
//   node tmp/phase34/b03-strip-barrels/run.cjs shared apply
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');

const { ts, ROOT, rel } = lib;
const args = process.argv.slice(2);
const APPLY = args.includes('apply');
const sampleOut = args.find((a) => a.startsWith('--sample-out='))?.slice(13) ?? null;
const pkgArgs = args.filter((a) => !a.startsWith('--') && a !== 'apply');

const ws = lib.workspaces();
const selected = ws.filter(
  (w) => !w.isGateway && w.name !== '@dungeonmaster/testing' && (!pkgArgs.length || pkgArgs.includes(w.short)),
);
const resolve = lib.makeResolver();
const writes = new Map();
const report = [];
const leftovers = [];

const exportSource = (entry) => (typeof entry === 'string' ? entry : (entry?.source ?? null));

for (const w of selected) {
  const ex = w.packageJson.exports ?? {};
  const barrels = new Set();
  let testingBarrel = null;
  for (const [k, v] of Object.entries(typeof ex === 'string' ? { '.': ex } : ex)) {
    const src = exportSource(v);
    if (!src || src.includes('*')) continue;
    const abs = path.resolve(w.dir, src);
    if (!fs.existsSync(abs)) continue;
    if (k === './testing') testingBarrel = abs;
    else barrels.add(abs);
  }
  for (const ft of lib.srcFolderTypes(w)) {
    const f = path.join(w.dir, 'src', ft, `${ft}.ts`);
    if (fs.existsSync(f)) barrels.add(f);
  }
  let stripped = 0;
  for (const b of barrels) {
    const text = fs.readFileSync(b, 'utf8');
    const sf = lib.parse(b, text);
    const edits = [];
    for (const st of sf.statements) {
      if (!ts.isExportDeclaration(st) || !st.moduleSpecifier || !ts.isStringLiteral(st.moduleSpecifier)) continue;
      const target = resolve(st.moduleSpecifier.text, b);
      if (!target) {
        leftovers.push({ kind: 'unresolved-reexport', barrel: rel(b), spec: st.moduleSpecifier.text });
        continue;
      }
      if (!st.exportClause) {
        if (lib.STUB_OR_PROXY_FILE.test(target)) {
          const lineEnd = text.indexOf('\n', st.end);
          edits.push({ start: st.getStart(sf), end: lineEnd === -1 ? st.end : lineEnd + 1, text: '' });
          stripped++;
        }
        continue;
      }
      if (!ts.isNamedExports(st.exportClause)) continue;
      const keep = [];
      let drop = 0;
      for (const el of st.exportClause.elements) {
        const found = lib.findDeclaringFile(target, (el.propertyName ?? el.name).text, resolve);
        if (found && found.kind === 'decl' && lib.STUB_OR_PROXY_FILE.test(found.file)) drop++;
        else keep.push(el.getText(sf));
      }
      if (!drop) continue;
      stripped += drop;
      if (!keep.length) {
        const lineEnd = text.indexOf('\n', st.end);
        edits.push({ start: st.getStart(sf), end: lineEnd === -1 ? st.end : lineEnd + 1, text: '' });
      } else {
        const q = st.moduleSpecifier.getText(sf)[0];
        edits.push({
          start: st.getStart(sf),
          end: st.end,
          text: `export${st.isTypeOnly ? ' type' : ''} { ${keep.join(', ')} } from ${q}${st.moduleSpecifier.text}${q};`,
        });
      }
    }
    if (edits.length) writes.set(b, lib.applyEdits(text, edits).replace(/\n{3,}/gu, '\n\n'));
  }
  report.push({ pkg: w.short, barrels: [...barrels].map(rel), stripped, testingBarrel: testingBarrel && rel(testingBarrel) });
  if (testingBarrel) {
    report[report.length - 1].testing = { abs: testingBarrel, importers: [] };
  }
}

// Importers of each /testing barrel, repo-wide.
const testingTargets = new Map(report.filter((r) => r.testing).map((r) => [r.testing.abs, r]));
if (testingTargets.size) {
  for (const w of ws) {
    for (const f of lib.walk(w.dir)) {
      if (testingTargets.has(f)) continue;
      const text = fs.readFileSync(f, 'utf8');
      if (!text.includes('testing')) continue;
      const sf = lib.parse(f, text);
      const visit = (n) => {
        const lit =
          (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)
            ? n.moduleSpecifier
            : ts.isCallExpression(n) && n.arguments[0] && ts.isStringLiteral(n.arguments[0]) ? n.arguments[0] : null;
        if (lit && /testing/u.test(lit.text)) {
          const t = resolve(lit.text, f);
          if (t && testingTargets.has(t)) testingTargets.get(t).testing.importers.push(rel(f));
        }
        ts.forEachChild(n, visit);
      };
      visit(sf);
    }
  }
  for (const r of testingTargets.values()) {
    const w = ws.find((x) => x.short === r.pkg);
    if (r.testing.importers.length) {
      leftovers.push({ kind: 'testing-barrel-still-imported', barrel: rel(r.testing.abs), importers: r.testing.importers });
      continue;
    }
    writes.set(r.testing.abs, null);
    const pj = JSON.parse(writes.get(w.packageJsonPath) ?? fs.readFileSync(w.packageJsonPath, 'utf8'));
    delete pj.exports['./testing'];
    writes.set(w.packageJsonPath, JSON.stringify(pj, null, 2) + '\n');
  }
}

let diffText = '';
for (const [abs, text] of writes) {
  diffText +=
    text === null ? `--- a/${rel(abs)}\n+++ /dev/null (deleted)\n` : lib.unifiedDiff(rel(abs), fs.readFileSync(abs, 'utf8'), text);
}
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'last-run.diff'), diffText);
fs.writeFileSync(path.join(OUT, 'leftovers.json'), JSON.stringify(leftovers, null, 1));
for (const r of report) {
  const t = r.testing ? `; testing barrel ${r.testingBarrel}: ${r.testing.importers.length} importers` : '';
  console.log(`${r.pkg}: ${r.barrels.length} production barrels, ${r.stripped} stub/proxy re-exports to drop${t}`);
}
console.log(`\n${APPLY ? 'APPLIED' : sampleOut ? 'SAMPLE' : 'DRY RUN'}: ${writes.size} files changed or deleted`);
console.log('left for an agent (out/leftovers.json):', leftovers.map((l) => `${l.kind} ${l.barrel ?? ''} ${l.importers ? l.importers.length + ' importers' : ''}`));

if (sampleOut) {
  for (const [abs, text] of writes) {
    if (text === null) continue;
    const dest = path.join(path.resolve(ROOT, sampleOut), rel(abs));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, text);
  }
} else if (APPLY) {
  for (const [abs, text] of writes) {
    if (text === null) { const mv = path.join(ROOT, 'tmp/deletions/3.3', rel(abs)); fs.mkdirSync(path.dirname(mv), { recursive: true }); fs.renameSync(abs, mv); }
    else fs.writeFileSync(abs, text);
  }
}

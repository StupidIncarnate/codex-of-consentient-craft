// B02: delete dead contracts, ONLY from a list a human has reviewed.
//
//   node scrolls/brands-gateways-epic/phase34-scripts/b02-contract-index/delete.cjs <reviewed-list.txt>          dry run
//   node scrolls/brands-gateways-epic/phase34-scripts/b02-contract-index/delete.cjs <reviewed-list.txt> apply    MOVE to tmp/deletions/3.1/<path> (never rm)
//
// The list is one repo-relative `*-contract.ts` path per line (`#` comments allowed); start from
// out/delete-candidates.txt, strike what the review keeps, and save it elsewhere. Every run
// re-builds the index, and a listed contract that is not in the `dead` class TODAY is refused, not
// deleted — B06 found two "dead" contracts that were live, and the tree moves between review and run.
//
// For each accepted contract: deletes the contract, its <base>.stub.ts and <base>-contract.test.ts,
// and removes every re-export of those files from any barrel in the repo (a whole `export *` line,
// or the names out of an `export { ... } from` list). Other files left in the folder are listed.
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');
const { buildIndex } = require('./index.cjs');

const { ts, ROOT, rel } = lib;
const listFile = process.argv[2];
const APPLY = process.argv.includes('apply');
if (!listFile) {
  console.error('usage: delete.cjs <reviewed-list.txt> [apply]');
  process.exit(2);
}
const wanted = fs
  .readFileSync(path.resolve(ROOT, listFile), 'utf8')
  .split('\n')
  .map((l) => l.replace(/#.*/u, '').trim())
  .filter(Boolean);

const { list, trioOf } = buildIndex();
const byFile = new Map(list.map((i) => [i.file, i]));
const accepted = [];
for (const w of wanted) {
  const i = byFile.get(w);
  if (!i) console.log(`REFUSED ${w}: not a contract file in today's index`);
  else if (i.cls !== 'dead') console.log(`REFUSED ${w}: class is now '${i.cls}' (uses: ${[...i.prodValueUses, ...i.prodTypeUses, ...i.testUses, ...i.stubUses, ...i.nestedIn].slice(0, 3).join(', ')})`);
  else accepted.push(path.join(ROOT, w));
}

const toDelete = new Set();
const leftInFolder = [];
for (const cf of accepted) {
  for (const f of trioOf(cf)) if (fs.existsSync(f)) toDelete.add(f);
  for (const other of fs.readdirSync(path.dirname(cf))) {
    const p = path.join(path.dirname(cf), other);
    if (!trioOf(cf).has(p)) leftInFolder.push(rel(p));
  }
}

// Barrel lines re-exporting a deleted file, anywhere in the repo.
const resolve = lib.makeResolver();
const writes = new Map();
if (toDelete.size) {
  for (const w of lib.workspaces()) {
    for (const f of lib.walk(w.dir)) {
      if (toDelete.has(f)) continue;
      const text = fs.readFileSync(f, 'utf8');
      if (!text.includes('export')) continue;
      const sf = lib.parse(f, text);
      const edits = [];
      for (const st of sf.statements) {
        if (!ts.isExportDeclaration(st) || !st.moduleSpecifier || !ts.isStringLiteral(st.moduleSpecifier)) continue;
        const t = resolve(st.moduleSpecifier.text, f);
        if (!t) continue;
        const lineEnd = text.indexOf('\n', st.end);
        const whole = { start: st.getStart(sf), end: lineEnd === -1 ? st.end : lineEnd + 1, text: '' };
        if (toDelete.has(t)) {
          edits.push(whole);
          continue;
        }
        if (!st.exportClause || !ts.isNamedExports(st.exportClause)) continue;
        const keep = st.exportClause.elements.filter((el) => {
          const d = lib.findDeclaringFile(t, (el.propertyName ?? el.name).text, resolve);
          return !(d && toDelete.has(d.file));
        });
        if (keep.length === st.exportClause.elements.length) continue;
        const q = st.moduleSpecifier.getText(sf)[0];
        edits.push(
          keep.length
            ? { start: st.getStart(sf), end: st.end, text: `export${st.isTypeOnly ? ' type' : ''} { ${keep.map((e) => e.getText(sf)).join(', ')} } from ${q}${st.moduleSpecifier.text}${q};` }
            : whole,
        );
      }
      if (edits.length) writes.set(f, lib.applyEdits(text, edits));
    }
  }
}

let diff = '';
for (const f of toDelete) diff += `--- a/${rel(f)}\n+++ /dev/null (moved to ${rel(path.join(lib.DELETIONS, '3.1'))})\n`;
for (const [f, t] of writes) diff += lib.unifiedDiff(rel(f), fs.readFileSync(f, 'utf8'), t);
fs.mkdirSync(lib.outDir(__dirname), { recursive: true });
fs.writeFileSync(path.join(lib.outDir(__dirname), 'delete-last-run.diff'), diff);
console.log(`\n${APPLY ? 'APPLIED' : 'DRY RUN'}: ${accepted.length} of ${wanted.length} listed contracts accepted; ${toDelete.size} files ${APPLY ? `moved to ${rel(path.join(lib.DELETIONS, '3.1'))}` : 'to move'}; ${writes.size} barrels edited`);
if (leftInFolder.length) console.log('other files left in those folders (read them):', leftInFolder);
console.log(`diff: ${path.join(lib.outDir(__dirname), 'delete-last-run.diff')}`);
// --verify: typecheck every edited barrel with the deleted files hidden and the edits overlaid.
if (process.argv.includes('--verify')) {
  const overlay = new Map([...toDelete].map((f) => [f, null]));
  for (const [f, t] of writes) overlay.set(f, t);
  const ws = lib.workspaces();
  for (const f of writes.keys()) {
    const o = lib.packageCompilerOptions(lib.workspaceOf(f, ws).dir);
    const d = lib.diagnosticsWithOverlay([f], overlay, o).diagnostics.get(f) ?? [];
    console.log(`verify ${rel(f)}: ${d.length} diagnostics`);
    for (const x of d) console.log('  ' + lib.formatDiagnostic(x));
  }
}
if (APPLY) {
  // EPIC rule 20: never remove a source file. Move it under tmp/deletions/3.1/<original path>.
  for (const f of toDelete) {
    const dest = path.join(lib.DELETIONS, '3.1', rel(f));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(f, dest);
  }
  for (const [f, t] of writes) fs.writeFileSync(f, t);
  for (const cf of accepted) if (fs.existsSync(path.dirname(cf)) && !fs.readdirSync(path.dirname(cf)).length) fs.rmdirSync(path.dirname(cf));
}

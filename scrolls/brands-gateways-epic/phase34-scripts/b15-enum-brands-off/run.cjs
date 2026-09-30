// Wave 3.2: an enum takes no brand (rules B1). Three steps, one script.
//
//   node scrolls/brands-gateways-epic/phase34-scripts/b15-enum-brands-off/run.cjs [pkg ...] [--sample-out=<dir>] [--census] [--no-gate] [apply]
//        1. census of every enum contract (z.enum, z.nativeEnum, z.literal, a z.union of those), its stub and
//           every use of the stub, repo-wide;
//        2. drops `.brand<...>()` from each branded enum contract of the named packages (all when none is
//           named). A whole-package typecheck of every named package and every package depending on it, before
//           against after, drops any contract whose removal adds a diagnostic and says why;
//        3. prints, per package in dependency order, the exact `b15-stub-unwrap` command lines with the enum
//           stubs that package's test files still wrap in a literal.
//
//   node scrolls/brands-gateways-epic/phase34-scripts/b15-enum-brands-off/run.cjs move-stubs [pkg ...] [--sample-out=<dir>] [--verify] [apply]
//        an enum stub that nothing references any more (not a test, a proxy, another stub, a harness or a
//        barrel-free import) moves, with its own test, to tmp/deletions/3.2/<original path>. Every barrel line
//        re-exporting it goes. Nothing is ever removed (EPIC rule 20). Run it after the unwrap has been applied.
//
// Dry run by default; `apply` writes. `--sample-out` writes the changed files, laid out as repo paths, into
// <dir> instead, for lib/verify-sample.cjs and for `b15-stub-unwrap --overlay-dir=<dir>`.
// Only enum contracts that sit at the top level of a contract file are touched: an enum brand inside an
// object contract's field is listed in out/inline-enum-brands.txt and left (it is that field's B3 brand).
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');

const { ts, ROOT, rel } = lib;
const args = process.argv.slice(2);
const opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? null;
const APPLY = args.includes('apply');
const MOVE = args.includes('move-stubs');
const CENSUS_ONLY = args.includes('--census');
const NO_GATE = args.includes('--no-gate');
const VERIFY = args.includes('--verify');
const sampleOut = opt('sample-out') ? path.resolve(ROOT, opt('sample-out')) : null;
const pkgArgs = args.filter((a) => !a.startsWith('--') && a !== 'apply' && a !== 'move-stubs');
const OUT = lib.outDir(__dirname);
fs.mkdirSync(OUT, { recursive: true });

const ws = lib.workspaces().filter((w) => !w.isGateway);
for (const p of pkgArgs) if (!ws.some((w) => w.short === p)) (console.error(`unknown package ${p}`), process.exit(2));

// ---------- dependency order (dependencies first) ----------
const depsOf = (w) => Object.keys({ ...w.packageJson.dependencies, ...w.packageJson.devDependencies }).filter((d) => ws.some((x) => x.name === d));
const order = [];
{
  const seen = new Set();
  const visit = (w) => {
    if (seen.has(w.name)) return;
    seen.add(w.name);
    for (const d of depsOf(w).sort()) visit(ws.find((x) => x.name === d));
    order.push(w);
  };
  for (const w of [...ws].sort((a, b) => a.short.localeCompare(b.short))) visit(w);
}
const wanted = pkgArgs.length ? order.filter((w) => pkgArgs.includes(w.short)) : order;
const dependentsClosure = (names) => {
  const out = new Set(names);
  for (let grew = true; grew; ) {
    grew = false;
    for (const w of ws) if (!out.has(w.name) && depsOf(w).some((d) => out.has(d))) (out.add(w.name), (grew = true));
  }
  return out;
};

// ---------- enum detection ----------
const zRoot = (callee) => (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) && (callee.expression.text === 'z' || callee.expression.text === 'zod') ? callee.name.text : null);
const peel = (n) => {
  while (n && (ts.isParenthesizedExpression(n) || ts.isAsExpression(n) || ts.isSatisfiesExpression(n) || ts.isNonNullExpression(n))) n = n.expression;
  return n;
};
// { isEnum, brands: [CallExpression] }: the `.brand<>()` calls on the enum's own chain (and on the members of a union).
const enumOf = (expr, consts, seen = new Set()) => {
  let cur = peel(expr);
  const brands = [];
  for (;;) {
    cur = peel(cur);
    if (ts.isCallExpression(cur)) {
      const zr = zRoot(cur.expression);
      if (zr) {
        if (zr === 'enum' || zr === 'nativeEnum' || zr === 'literal') return { isEnum: true, brands };
        if (zr === 'union') {
          const arr = cur.arguments[0];
          const subs = arr && ts.isArrayLiteralExpression(arr) && arr.elements.length ? arr.elements.map((e) => enumOf(e, consts, seen)) : [];
          if (subs.length && subs.every((s) => s.isEnum)) return { isEnum: true, brands: [...brands, ...subs.flatMap((s) => s.brands)] };
        }
        return { isEnum: false, brands: [] };
      }
      if (ts.isPropertyAccessExpression(cur.expression)) {
        if (cur.expression.name.text === 'brand') brands.push(cur);
        cur = cur.expression.expression;
        continue;
      }
      return { isEnum: false, brands: [] };
    }
    if (ts.isIdentifier(cur) && consts.has(cur.text) && !seen.has(cur.text)) {
      seen.add(cur.text);
      const r = enumOf(consts.get(cur.text), consts, seen);
      return { isEnum: r.isEnum, brands: r.isEnum ? brands : [] };
    }
    return { isEnum: false, brands: [] };
  }
};
const brandText = (call, sf) => {
  const ta = call.typeArguments?.[0];
  return ta ? ta.getText(sf).replace(/^['"]|['"]$/gu, '') : '?';
};

// ---------- pass 1: contracts, stubs ----------
const TEST_FILE = /\.(test|integration\.test|e2e|spec)\.tsx?$/u;
const enums = [];
const inline = [];
const stubDecls = new Map(); // stub name -> [{ file, isEnum }]
for (const w of ws) {
  for (const f of lib.walk(w.dir)) {
    if (!/-contract\.tsx?$/u.test(f)) continue;
    const text = fs.readFileSync(f, 'utf8');
    if (!/\bz(od)?\./u.test(text)) continue;
    const sf = lib.parse(f, text);
    const consts = new Map();
    for (const st of sf.statements) if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name) && d.initializer) consts.set(d.name.text, d.initializer);
    const top = new Set();
    for (const st of sf.statements) {
      if (!ts.isVariableStatement(st) || !st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
      for (const d of st.declarationList.declarations) {
        if (!ts.isIdentifier(d.name) || !d.initializer) continue;
        const e = enumOf(d.initializer, consts);
        if (!e.isEnum) continue;
        e.brands.forEach((b) => top.add(b));
        const dir = path.dirname(f);
        const base = path.basename(f).replace(/-contract\.tsx?$/u, '');
        const stubFile = path.join(dir, `${base}.stub.ts`);
        let stub = null;
        if (fs.existsSync(stubFile)) {
          const st2 = fs.readFileSync(stubFile, 'utf8');
          stub = [...st2.matchAll(/export const (\w+Stub)\b/gu)].map((m) => m[1]).find(() => st2.includes(d.name.text)) ?? null;
        }
        const stubTest = path.join(dir, `${base}.stub.test.ts`);
        enums.push({
          pkg: w, file: f, sf, text, name: d.name.text, brands: e.brands, brandTexts: e.brands.map((b) => brandText(b, sf)),
          stub, stubFile: stub ? stubFile : null, stubTest: fs.existsSync(stubTest) ? stubTest : null,
        });
      }
    }
    const v = (n) => {
      if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'brand' && !top.has(n) && enumOf(n.expression.expression, consts).isEnum)
        inline.push(`${rel(f)}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1} ${n.getText(sf).slice(0, 80)}`);
      ts.forEachChild(n, v);
    };
    v(sf);
  }
}
const enumStubFiles = new Set(enums.filter((e) => e.stubFile).map((e) => e.stubFile));
for (const w of ws) {
  for (const f of lib.walk(w.dir)) {
    if (!/\.stub\.tsx?$/u.test(f)) continue;
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/export const (\w+Stub)\b/gu)) {
      if (!stubDecls.has(m[1])) stubDecls.set(m[1], []);
      stubDecls.get(m[1]).push({ file: f, isEnum: enumStubFiles.has(f) });
    }
  }
}
// A stub name declared in a non-enum stub file too cannot be told apart by name: excluded from every list.
const enumStubNames = new Set(enums.map((e) => e.stub).filter(Boolean));
const ambiguous = new Set([...stubDecls].filter(([n, d]) => enumStubNames.has(n) && d.some((x) => !x.isEnum)).map(([n]) => n));
const stubNames = new Set(enums.filter((e) => e.stub && !ambiguous.has(e.stub)).map((e) => e.stub));

// ---------- pass 2: every use of an enum stub ----------
const uses = new Map(); // stub -> [{ file, pkg, kind, test, line }]
if (stubNames.size) {
  const re = new RegExp(`\\b(${[...stubNames].join('|')})\\b`, 'u');
  for (const w of ws) {
    for (const f of lib.walk(w.dir)) {
      if (/-contract\.tsx?$/u.test(f)) { /* a contract does not call a stub */ }
      const text = fs.readFileSync(f, 'utf8');
      if (!re.test(text)) continue;
      const sf = lib.parse(f, text);
      const test = TEST_FILE.test(f);
      const visit = (n) => {
        if (ts.isIdentifier(n) && stubNames.has(n.text)) {
          const p = n.parent;
          const skip = ts.isImportSpecifier(p) || ts.isExportSpecifier(p) || ts.isImportClause(p) || ts.isNamespaceImport(p) || (ts.isVariableDeclaration(p) && p.name === n);
          if (!skip) {
            let kind = 'ref';
            if (ts.isCallExpression(p) && p.expression === n) {
              const a = p.arguments;
              const pr = a.length === 1 && ts.isObjectLiteralExpression(a[0]) && a[0].properties.length === 1 ? a[0].properties[0] : null;
              const init = pr && ts.isPropertyAssignment(pr) && pr.name.getText(sf) === 'value' ? pr.initializer : null;
              kind = !a.length ? 'default' : init && (ts.isStringLiteral(init) || ts.isNumericLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init) || (ts.isPrefixUnaryExpression(init) && ts.isNumericLiteral(init.operand))) ? 'literal' : 'other';
            }
            if (!uses.has(n.text)) uses.set(n.text, []);
            uses.get(n.text).push({ file: f, pkg: w.short, kind, test, line: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1 });
          }
        }
        ts.forEachChild(n, visit);
      };
      visit(sf);
    }
  }
}

// ---------- census report ----------
const perPkg = new Map();
const row = (p) => {
  if (!perPkg.has(p)) perPkg.set(p, { pkg: p, enums: 0, branded: 0, stubs: 0, ambiguousStubs: 0, testLiteral: 0, testDefault: 0, testOther: 0, testRef: 0, nonTestUses: 0 });
  return perPkg.get(p);
};
for (const e of enums) {
  const r = row(e.pkg.short);
  r.enums++;
  if (e.brands.length) r.branded++;
  if (e.stub) (ambiguous.has(e.stub) ? r.ambiguousStubs++ : r.stubs++);
}
for (const [, list] of uses) for (const u of list) {
  const r = row(u.pkg);
  if (u.test) r[{ literal: 'testLiteral', default: 'testDefault', other: 'testOther', ref: 'testRef' }[u.kind]]++;
  else r.nonTestUses++;
}
const cols = ['pkg', 'enums', 'branded', 'stubs', 'ambiguousStubs', 'testLiteral', 'testDefault', 'testOther', 'testRef', 'nonTestUses'];
const censusRows = order.map((w) => row(w.short)).filter((r) => r.enums || r.testLiteral || r.testDefault || r.testOther || r.testRef || r.nonTestUses);
const sumRow = Object.fromEntries(cols.map((c) => [c, c === 'pkg' ? 'TOTAL' : censusRows.reduce((a, r) => a + r[c], 0)]));
console.log('census (packages in dependency order; test* count calls of an enum stub in test files, by the package that holds the test)');
console.log(cols.join('\t'));
for (const r of [...censusRows, sumRow]) console.log(cols.map((c) => r[c]).join('\t'));
fs.writeFileSync(path.join(OUT, 'census.csv'), [cols.join(','), ...[...censusRows, sumRow].map((r) => cols.map((c) => r[c]).join(','))].join('\n') + '\n');
fs.writeFileSync(
  path.join(OUT, 'enums.csv'),
  ['pkg,contract,brand,stub,stubCallsLiteral,stubCallsDefault,stubCallsOther,stubRefs,nonTestUses,file'].concat(
    enums.map((e) => {
      const l = e.stub ? uses.get(e.stub) ?? [] : [];
      const n = (k) => l.filter((u) => u.test && u.kind === k).length;
      return [e.pkg.short, e.name, e.brandTexts.join('|'), e.stub ?? '', n('literal'), n('default'), n('other'), n('ref'), l.filter((u) => !u.test).length, rel(e.file)].join(',');
    }),
  ).join('\n') + '\n',
);
fs.writeFileSync(path.join(OUT, 'inline-enum-brands.txt'), inline.join('\n') + (inline.length ? '\n' : ''));
if (ambiguous.size) console.log(`stub names also declared by a non-enum stub, excluded from every list: ${[...ambiguous].join(', ')}`);
if (inline.length) console.log(`${inline.length} enum brands inside another contract's field, left standing: out/inline-enum-brands.txt`);
if (CENSUS_ONLY) process.exit(0);

// ================= move-stubs =================
if (MOVE) {
  const wantedNames = new Set(wanted.map((w) => w.name));
  const cand = enums.filter((e) => e.stubFile && wantedNames.has(e.pkg.name));
  const toMove = new Map(); // file -> stub name
  const kept = [];
  for (const e of cand) {
    const refs = (uses.get(e.stub) ?? []).filter((u) => u.file !== e.stubFile && u.file !== e.stubTest);
    const dupDeclared = (stubDecls.get(e.stub) ?? []).length > 1;
    if (refs.length || ambiguous.has(e.stub)) kept.push(`${e.stub}: ${refs.length} use(s), e.g. ${refs.slice(0, 2).map((u) => `${rel(u.file)}:${u.line}`).join(', ')}${ambiguous.has(e.stub) ? ' (name shared with a non-enum stub)' : ''}`);
    else if (dupDeclared) kept.push(`${e.stub}: declared in more than one stub file; a use by name cannot be told apart, move by hand`);
    else {
      toMove.set(e.stubFile, e.stub);
      if (e.stubTest) toMove.set(e.stubTest, `${e.stub} (test)`);
    }
  }
  const resolve = lib.makeResolver();
  const writes = new Map();
  if (toMove.size) {
    for (const w of ws) {
      for (const f of lib.walk(w.dir)) {
        if (toMove.has(f)) continue;
        const text = fs.readFileSync(f, 'utf8');
        if (!/\bexport\b/u.test(text) || !/\.stub['"]/u.test(text)) continue;
        const sf = lib.parse(f, text);
        const edits = [];
        for (const st of sf.statements) {
          if (!ts.isExportDeclaration(st) || !st.moduleSpecifier || !ts.isStringLiteral(st.moduleSpecifier)) continue;
          const t = resolve(st.moduleSpecifier.text, f);
          if (!t) continue;
          const lineEnd = text.indexOf('\n', st.end);
          const whole = { start: st.getStart(sf), end: lineEnd === -1 ? st.end : lineEnd + 1, text: '' };
          if (toMove.has(t)) { edits.push(whole); continue; }
          if (!st.exportClause || !ts.isNamedExports(st.exportClause)) continue;
          const keep = st.exportClause.elements.filter((el) => {
            const d = lib.findDeclaringFile(t, (el.propertyName ?? el.name).text, resolve);
            return !(d && toMove.has(d.file));
          });
          if (keep.length === st.exportClause.elements.length) continue;
          const q = st.moduleSpecifier.getText(sf)[0];
          edits.push(keep.length ? { start: st.getStart(sf), end: st.end, text: `export${st.isTypeOnly ? ' type' : ''} { ${keep.map((x) => x.getText(sf)).join(', ')} } from ${q}${st.moduleSpecifier.text}${q};` } : whole);
        }
        if (edits.length) writes.set(f, lib.applyEdits(text, edits));
      }
    }
  }
  let diff = '';
  for (const f of toMove.keys()) diff += `--- a/${rel(f)}\n+++ /dev/null (moved to ${rel(path.join(lib.DELETIONS, '3.2'))})\n`;
  for (const [f, t] of writes) diff += lib.unifiedDiff(rel(f), fs.readFileSync(f, 'utf8'), t);
  fs.writeFileSync(path.join(OUT, 'move-stubs.diff'), diff);
  fs.writeFileSync(path.join(OUT, 'move-stubs-kept.txt'), kept.join('\n') + '\n');
  if (VERIFY || sampleOut) {
    const overlay = new Map([...toMove.keys()].map((f) => [f, null]));
    for (const [f, t] of writes) overlay.set(f, t);
    let bad = 0;
    for (const f of writes.keys()) {
      const o = lib.packageCompilerOptions(lib.workspaceOf(f, lib.workspaces()).dir);
      const d = lib.diagnosticsWithOverlay([f], overlay, o).diagnostics.get(f) ?? [];
      console.log(`verify ${rel(f)}: ${d.length} diagnostics`);
      for (const x of d) (bad++, console.log('  ' + lib.formatDiagnostic(x)));
    }
    if (bad) process.exitCode = 1;
  }
  console.log(`\n${APPLY ? 'APPLIED' : sampleOut ? 'SAMPLE' : 'DRY RUN'} move-stubs [${wanted.map((w) => w.short).join(', ')}]: ${cand.length} enum stubs, ${toMove.size} files (stubs and their tests) ${APPLY ? 'moved to' : 'to move to'} tmp/deletions/3.2, ${writes.size} barrels edited, ${kept.length} stubs still used`);
  console.log(`diff: ${rel(path.join(OUT, 'move-stubs.diff'))}; the stubs that stay and why: ${rel(path.join(OUT, 'move-stubs-kept.txt'))}`);
  if (sampleOut) for (const [f, t] of writes) (fs.mkdirSync(path.dirname(path.join(sampleOut, rel(f))), { recursive: true }), fs.writeFileSync(path.join(sampleOut, rel(f)), t));
  if (APPLY && !sampleOut) {
    for (const f of toMove.keys()) {
      const dest = path.join(lib.DELETIONS, '3.2', rel(f));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.renameSync(f, dest);
    }
    for (const [f, t] of writes) fs.writeFileSync(f, t);
  }
  process.exit(process.exitCode ?? 0);
}

// ================= brands off =================
const wantedNames = new Set(wanted.map((w) => w.name));
let active = enums.filter((e) => e.brands.length && wantedNames.has(e.pkg.name));
const editsOf = (e) => e.brands.map((b) => ({ start: b.expression.expression.end, end: b.end, text: '' }));
const rendered = (list) => new Map(list.map((e) => [e.file, lib.applyEdits(e.text, editsOf(e))]));
const dropped = [];

const keyOf = (d) => `${d.code}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
const gate = (list) => {
  const overlay = rendered(list);
  const names = dependentsClosure(new Set(list.map((e) => e.pkg.name)));
  const failed = new Set();
  const unattributed = [];
  for (const w of order.filter((x) => names.has(x.name))) {
    const options = lib.packageCompilerOptions(w.dir);
    const files = [...new Set([...(options.rootNames ?? []), ...[...overlay.keys()].filter((f) => lib.workspaceOf(f, ws)?.name === w.name)])].filter((f) => f.startsWith(w.dir + path.sep));
    const t0 = Date.now();
    const aft = lib.diagnosticsWithOverlay(files, overlay, options).diagnostics;
    const withDiag = files.filter((f) => aft.get(f)?.length);
    const base = withDiag.length ? lib.diagnosticsWithOverlay(withDiag, new Map(), options).diagnostics : new Map();
    let added = 0;
    for (const f of withDiag) {
      const bk = new Set((base.get(f) ?? []).map(keyOf));
      for (const d of aft.get(f).filter((x) => !bk.has(keyOf(x)))) {
        added++;
        const msg = lib.formatDiagnostic(d);
        const flat = ts.flattenDiagnosticMessageText(d.messageText, ' ');
        const brandsInMsg = new Set([...flat.matchAll(/\$brand<"([^"]+)">/gu)].map((m) => m[1]));
        const win = d.file ? d.file.text.slice(Math.max(0, d.file.text.lastIndexOf('\n', d.start ?? 0) - 400), (d.start ?? 0) + 400) : '';
        const ids = new Set(win.match(/\b[A-Za-z_$][\w$]*\b/gu));
        const hits = list.filter((e) => f === e.file || e.brandTexts.some((b) => brandsInMsg.has(b)) || ids.has(e.name) || ids.has(e.name.replace(/Contract$/u, '')) || (e.stub && ids.has(e.stub)));
        if (hits.length) hits.forEach((e) => (failed.add(e), (e.note = e.note ?? msg.slice(0, 220))));
        else unattributed.push(msg);
      }
    }
    console.error(`  gate ${w.short}: ${files.length} files, ${added} new diagnostics, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  return { failed, unattributed };
};

let gateNote = [];
if (!NO_GATE && active.length) {
  for (let round = 1; round <= 8 && active.length; round++) {
    const { failed, unattributed } = gate(active);
    gateNote = unattributed;
    if (!failed.size) break;
    for (const e of failed) dropped.push(`${rel(e.file)} ${e.name}: ${e.note}`);
    active = active.filter((e) => !failed.has(e));
    if (unattributed.length) break;
  }
}
const stillBranded = new Set(enums.filter((e) => e.brands.length && !active.includes(e) && wantedNames.has(e.pkg.name)).map((e) => e.name + '@' + rel(e.file)));

// diff and writes
let diffText = '';
const out = rendered(active);
for (const [f, t] of out) diffText += lib.unifiedDiff(rel(f), fs.readFileSync(f, 'utf8'), t);
fs.writeFileSync(path.join(OUT, 'brands-off.diff'), diffText);
fs.writeFileSync(path.join(OUT, 'brands-off-leftovers.txt'), [...dropped.map((d) => `GATE ${d}`), ...gateNote.map((d) => `UNATTRIBUTED ${d}`)].join('\n') + '\n');
if (sampleOut) for (const [f, t] of out) (fs.mkdirSync(path.dirname(path.join(sampleOut, rel(f))), { recursive: true }), fs.writeFileSync(path.join(sampleOut, rel(f)), t));
else if (APPLY && !gateNote.length) for (const [f, t] of out) fs.writeFileSync(f, t);
const perPkgBrands = {};
for (const e of active) perPkgBrands[e.pkg.short] = (perPkgBrands[e.pkg.short] ?? 0) + 1;
console.log(`\n${APPLY && !gateNote.length ? 'APPLIED' : sampleOut ? 'SAMPLE' : 'DRY RUN'} brands off [${wanted.map((w) => w.short).join(', ')}]: ${active.length} enum contracts unbranded ${JSON.stringify(perPkgBrands)}; ${dropped.length} kept by the gate; ${gateNote.length} unattributed new diagnostics${NO_GATE ? ' (gate skipped)' : ''}`);
console.log(`diff: ${rel(path.join(OUT, 'brands-off.diff'))}; kept and unattributed: ${rel(path.join(OUT, 'brands-off-leftovers.txt'))}`);
if (gateNote.length) (console.log('NOTHING WRITTEN: new diagnostics no contract explains:'), gateNote.slice(0, 10).forEach((m) => console.log('  ' + m)), (process.exitCode = 1));

// ---------- the unwrap command lines ----------
const unbrandedNow = (e) => !e.brands.length || active.includes(e);
const lines = [];
for (const w of order) {
  const stubs = new Set();
  for (const e of enums) {
    if (!e.stub || ambiguous.has(e.stub) || !unbrandedNow(e)) continue;
    if ((uses.get(e.stub) ?? []).some((u) => u.pkg === w.short && u.test && u.kind === 'literal')) stubs.add(e.stub);
  }
  if (!stubs.size) continue;
  const n = [...stubs].reduce((a, s) => a + (uses.get(s) ?? []).filter((u) => u.pkg === w.short && u.test && u.kind === 'literal').length, 0);
  lines.push(`# ${w.short}: ${n} literal wraps`);
  lines.push(`node scrolls/brands-gateways-epic/phase34-scripts/b15-stub-unwrap/run.cjs ${w.short} --stubs=${[...stubs].sort().join(',')}`);
}
fs.writeFileSync(path.join(OUT, 'unwrap-commands.txt'), lines.join('\n') + '\n');
console.log(`\nunwrap command lines (${rel(path.join(OUT, 'unwrap-commands.txt'))}), packages in dependency order:`);
console.log(lines.join('\n'));
if (stillBranded.size) console.log(`\nstubs of these still-branded enums are left out of the lists: ${[...stillBranded].join(', ')}`);

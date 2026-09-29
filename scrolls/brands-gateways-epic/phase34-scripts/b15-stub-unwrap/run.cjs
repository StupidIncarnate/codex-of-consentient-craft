// B15 stub shrinkage: once a brand is gone (a standalone scalar brand deleted under B2, a loose value
// made plain under B6, or an enum that never carried one), every `XStub({ value: <literal> })` of it
// is just the literal. This unwraps them for a list of stubs a human has decided, keeping only the
// unwraps the type checker accepts, and drops the stub's import where no use is left.
//
//   node tmp/phase34/b15-stub-unwrap/run.cjs <pkg> --stubs=ExecutionStepStatusStub,ContentTextStub
//        [--files=a.test.ts,...] [--sample-out=<dir>] [apply]
//
// Unwraps only a call whose single argument is `{ value: <string | number | no-substitution template
// literal> }`; `XStub()` (the stub's default) and computed values are counted and left. Test files
// only (`.test`, `.integration.test`, `.e2e`, `.spec`). Every accepted unwrap passes lib's gateEdits:
// the file's diagnostics after equal its diagnostics before. While the brand still exists the gate
// keeps nearly every wrap (the literal is not assignable), so running it early is safe but idle.
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');

const { ts, ROOT, rel } = lib;
const args = process.argv.slice(2);
const opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? null;
const APPLY = args.includes('apply');
const sampleOut = opt('sample-out');
const stubs = new Set((opt('stubs') ?? '').split(',').filter(Boolean));
const onlyFiles = opt('files')?.split(',').map((f) => path.resolve(ROOT, f)) ?? null;
const pkg = args.find((a) => !a.startsWith('--') && a !== 'apply');
const w = lib.workspaces().find((x) => x.short === pkg);
if (!w || !stubs.size) {
  console.error('usage: run.cjs <pkg> --stubs=AStub,BStub [--files=...] [--sample-out=<dir>] [apply]');
  process.exit(2);
}
const TEST_FILE = /\.(test|integration\.test|e2e|spec)\.tsx?$/u;
const live = new Map();
const { service, fileNames } = lib.makeLanguageService(w.dir, live);

const stats = { files: 0, filesChanged: 0, unwrapped: 0, kept: 0, defaultCalls: 0, nonLiteral: 0, importsDropped: 0 };
const keptList = [];
let diffText = '';
const t0 = Date.now();
for (const f of (onlyFiles ?? fileNames).filter((x) => TEST_FILE.test(x) && fs.existsSync(x))) {
  const text = fs.readFileSync(f, 'utf8');
  if (![...stubs].some((s) => text.includes(s))) continue;
  const sf = lib.parse(f, text);
  const cands = [];
  const visit = (n) => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && stubs.has(n.expression.text)) {
      const a = n.arguments;
      const p = a.length === 1 && ts.isObjectLiteralExpression(a[0]) && a[0].properties.length === 1 ? a[0].properties[0] : null;
      const init = p && ts.isPropertyAssignment(p) && p.name.getText(sf) === 'value' ? p.initializer : null;
      if (!a.length) stats.defaultCalls++;
      else if (init && (ts.isStringLiteral(init) || ts.isNumericLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init) || (ts.isPrefixUnaryExpression(init) && ts.isNumericLiteral(init.operand)))) {
        // A JSX attribute `status={XStub({ value: 'a' })}` becomes `status="a"`, not `status={'a'}`.
        const jsx = n.parent && ts.isJsxExpression(n.parent) && n.parent.parent && ts.isJsxAttribute(n.parent.parent) && ts.isStringLiteral(init) && !/["\\]/u.test(init.text);
        const span = jsx ? n.parent : n;
        cands.push({ start: span.getStart(sf), end: span.end, text: jsx ? `"${init.text}"` : init.getText(sf), ...lib.enclosingStatement(n, sf), line: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1, stub: n.expression.text });
      } else stats.nonLiteral++;
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  if (!cands.length) continue;
  stats.files++;
  // Drop an import specifier of a listed stub once no reference to it remains.
  const dropUnusedImports = (out) => {
    const s2 = lib.parse(f, out);
    const used = new Set();
    const v2 = (n) => {
      if (ts.isIdentifier(n) && stubs.has(n.text) && !(n.parent && ts.isImportSpecifier(n.parent))) used.add(n.text);
      ts.forEachChild(n, v2);
    };
    v2(s2);
    const edits = [];
    for (const st of s2.statements) {
      if (!ts.isImportDeclaration(st) || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings)) continue;
      const els = st.importClause.namedBindings.elements;
      const keep = els.filter((e) => !(stubs.has(e.name.text) && !used.has(e.name.text)));
      if (keep.length === els.length) continue;
      stats.importsDropped += els.length - keep.length;
      const lineEnd = out.indexOf('\n', st.end);
      if (!keep.length && !st.importClause.name) edits.push({ start: st.getStart(s2), end: lineEnd === -1 ? st.end : lineEnd + 1, text: '' });
      else {
        const q = st.moduleSpecifier.getText(s2)[0];
        const def = st.importClause.name ? `${st.importClause.name.text}, ` : '';
        edits.push({ start: st.getStart(s2), end: st.end, text: `import${st.importClause.isTypeOnly ? ' type' : ''} ${def}{ ${keep.map((e) => e.getText(s2)).join(', ')} } from ${q}${st.moduleSpecifier.text}${q};` });
      }
    }
    return lib.applyEdits(out, edits);
  };
  const render = (acc) => lib.applyEdits(text, acc);
  const accepted = lib.gateEdits({ service, live, file: f, text, cands, render });
  const kept = cands.filter((c) => !accepted.includes(c));
  stats.unwrapped += accepted.length;
  stats.kept += kept.length;
  for (const c of kept) keptList.push(`${rel(f)}:${c.line} ${c.stub}`);
  if (!accepted.length) continue;
  stats.filesChanged++;
  const after = dropUnusedImports(render(accepted));
  diffText += lib.unifiedDiff(rel(f), text, after);
  if (sampleOut) {
    const dest = path.join(path.resolve(ROOT, sampleOut), rel(f));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, after);
  } else if (APPLY) fs.writeFileSync(f, after);
}
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, `${w.short}.diff`), diffText);
fs.writeFileSync(path.join(OUT, `${w.short}-kept.txt`), keptList.join('\n') + '\n');
console.log(`${APPLY ? 'APPLIED' : sampleOut ? 'SAMPLE' : 'DRY RUN'} ${w.short} [${[...stubs].join(', ')}]:`, JSON.stringify(stats), `${((Date.now() - t0) / 1000).toFixed(0)}s`);
console.log(`diff: ${rel(path.join(OUT, `${w.short}.diff`))}; wraps the checker still needs: ${rel(path.join(OUT, `${w.short}-kept.txt`))}`);

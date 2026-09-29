// B15 "found along the way": remove every `as never` cast in a test file that the type checker does
// not need. A cast is removed only if the file's diagnostics after removal are exactly its
// diagnostics before (same code, line and message) — so a load-bearing cast (one hiding a real type
// mismatch) stays, and is listed for an agent to read.
//
// Scope: test files only (`.test.ts(x)`, `.integration.test.ts`, `.e2e.ts`, `.spec.ts`). A cast in a
// stub, proxy or harness can change an exported type other files see, so those are counted and left.
// `--stub-args-only` limits it to casts inside a `...Stub(...)` call's arguments (the case the
// source doc names: `StubArgument` already unbrands those fields).
//
// Method: one TypeScript LanguageService per package (its own tsconfig.json, resolution fenced to
// this worktree), and lib's gateEdits: drop every candidate cast, re-check the file, restore the
// casts inside each statement that gained a diagnostic, repeat until the file matches its baseline.
//
// Usage:
//   node tmp/phase34/b15-as-never/run.cjs <pkg> [--files=a.test.ts,b.test.ts] [--stub-args-only]
//        [--sample-out=<dir>] [apply]
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');

const { ts, ROOT, rel } = lib;
const args = process.argv.slice(2);
const opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? null;
const APPLY = args.includes('apply');
const stubArgsOnly = args.includes('--stub-args-only');
const sampleOut = opt('sample-out');
const onlyFiles = opt('files')?.split(',').map((f) => path.resolve(ROOT, f)) ?? null;
const pkg = args.find((a) => !a.startsWith('--') && a !== 'apply');
const w = lib.workspaces().find((x) => x.short === pkg || x.rel === `packages/${pkg}`);
if (!w) {
  console.error('usage: run.cjs <pkg> [--files=...] [--stub-args-only] [--sample-out=<dir>] [apply]');
  process.exit(2);
}
const TEST_FILE = /\.(test|integration\.test|e2e|spec)\.tsx?$/u;
const live = new Map();
const { service, fileNames } = lib.makeLanguageService(w.dir, live);

const candidatesIn = (f, text) => {
  const sf = lib.parse(f, text);
  const out = [];
  const visit = (n) => {
    if (ts.isAsExpression(n) && n.type.kind === ts.SyntaxKind.NeverKeyword) {
      let inStub = false;
      for (let p = n.parent; p; p = p.parent) {
        if (ts.isCallExpression(p)) {
          inStub = ts.isIdentifier(p.expression) && /Stub$/u.test(p.expression.text);
          break;
        }
      }
      if (!stubArgsOnly || inStub) {
        // Remove " as never": from the end of the expression to the end of the as-expression.
        out.push({ start: n.expression.end, end: n.end, text: '', ...lib.enclosingStatement(n, sf), line: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1 });
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
};

const files = (onlyFiles ?? fileNames).filter((f) => fs.existsSync(f));
const stats = { files: 0, filesChanged: 0, removed: 0, kept: 0, supportFileCasts: 0 };
const keptList = [];
let diffText = '';
const t0 = Date.now();
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  if (!text.includes('as never')) continue;
  if (!TEST_FILE.test(f)) {
    stats.supportFileCasts += candidatesIn(f, text).length;
    continue;
  }
  const cands = candidatesIn(f, text);
  if (!cands.length) continue;
  stats.files++;
  const render = (acc) => lib.applyEdits(text, acc);
  const removed = lib.gateEdits({ service, live, file: f, text, cands, render });
  const kept = cands.filter((c) => !removed.includes(c));
  stats.removed += removed.length;
  stats.kept += kept.length;
  for (const c of kept) keptList.push(`${rel(f)}:${c.line}`);
  if (!removed.length) continue;
  stats.filesChanged++;
  const after = render(removed);
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
console.log(`${APPLY ? 'APPLIED' : sampleOut ? 'SAMPLE' : 'DRY RUN'} ${w.short}${stubArgsOnly ? ' (stub args only)' : ''}:`, JSON.stringify(stats), `${((Date.now() - t0) / 1000).toFixed(0)}s`);
console.log(`diff: ${rel(path.join(OUT, `${w.short}.diff`))}; load-bearing casts kept: ${rel(path.join(OUT, `${w.short}-kept.txt`))}`);

// B04 driver: retype (+ optional-chain strip) production files of eslint-plugin/local-eslint on an
// in-memory overlay, typecheck before/after, report per-file leftovers. --sample-out=d writes copies.
// Usage: node scrolls/brands-gateways-epic/phase34-scripts/sd1-retype-residue/run.cjs [--pkg=eslint-plugin] [--only=substr,..] [--no-strip] [--sample-out=dir]
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');
const { retype } = require('./retype.cjs');
const { ts, ROOT, rel } = lib;
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const pkgs = (arg('pkg') ?? 'eslint-plugin,local-eslint').split(',');
const only = arg('only')?.split(',');
const kind = arg('kind') ?? 'all';
const kindOk = (f) => kind === 'all' || (kind === 'brokers') === /\/rule-[^/]*-broker\.ts$/u.test(f);
const strip = !process.argv.includes('--no-strip');
const sampleOut = arg('sample-out');
const EXCLUDE = /(contracts\/(tsestree|eslint-context)\/|statics\/tsestree-node-type\/)/u;

const nullable = (t) => {
  const parts = t.isUnion() ? t.types : [t];
  return parts.some((p) => p.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void | ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.TypeParameter | ts.TypeFlags.Never));
};

const stripPass = (svc, live, file, text) => {
  const program = svc.service.getProgram();
  const sf = program.getSourceFile(file);
  const checker = program.getTypeChecker();
  const edits = [];
  const visit = (n) => {
    if ((ts.isPropertyAccessExpression(n) || ts.isElementAccessExpression(n) || ts.isCallExpression(n)) && n.questionDotToken) {
      const t = checker.getTypeAtLocation(n.expression);
      if (!nullable(t)) {
        const q = n.questionDotToken;
        const next = ts.isPropertyAccessExpression(n) ? '.' : '';
        edits.push({ start: q.getStart(sf), end: q.end, text: next });
      }
    }
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) {
      const t = checker.getTypeAtLocation(n.left);
      if (!nullable(t)) edits.push({ start: n.left.end, end: n.end, text: '', qq: true });
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  // drop an edit that contains another edit (nested `a ?? b ?? c`); the next round redoes it
  return edits.filter((e) => !edits.some((o) => o !== e && o.start >= e.start && o.end <= e.end && (o.end > o.start || o.start > e.start)));
};

const main = () => {
  const ws = lib.workspaces();
  const summary = [];
  for (const pk of pkgs) {
    const w = ws.find((x) => x.short === pk);
    const files = lib.walk(path.join(w.dir, 'src')).filter((f) => !lib.isTestSupport(f) && !EXCLUDE.test(rel(f)));
    const cands = files.filter((f) => /\b(Tsestree|Eslint(Context|SourceCode|RuleFixer|Scope|Comment))\b|tsestreeNodeTypeStatics/u.test(fs.readFileSync(f, 'utf8')));
    const sel = only ? cands.filter((f) => only.some((o) => rel(f).includes(o))) : cands;
    const overlay = new Map();
    const stats = {};
    for (const f of cands.filter(kindOk)) {
      const text = fs.readFileSync(f, 'utf8');
      const r = retype(f, text);
      if (r.changed) overlay.set(f, r.text);
      stats[f] = r.stats;
    }
    const options = lib.packageCompilerOptions(w.dir);
    const t0 = Date.now();
    const base = lib.diagnosticsWithOverlay(sel, new Map(), options).diagnostics;
    const after1 = lib.diagnosticsWithOverlay(sel, overlay, options).diagnostics;
    console.error(`${pk}: ${sel.length} candidate files, retype pass ${(Date.now() - t0) / 1000}s`);
    let stripCount = { opt: 0, qq: 0 };
    const finalOverlay = new Map(overlay);
    if (strip) {
      const live = new Map();
      for (const [f, t] of overlay) live.set(f, { v: 1, text: t });
      const svc = lib.makeLanguageService(w.dir, live);
      for (let round = 0; round < 6; round++) {
        let any = false;
        for (const f of sel) {
          const cur = live.get(f)?.text ?? fs.readFileSync(f, 'utf8');
          if (!live.has(f)) live.set(f, { v: 1, text: cur });
          const edits = stripPass(svc, live, f, cur);
          if (!edits.length) continue;
          any = true;
          for (const e of edits) e.qq ? stripCount.qq++ : stripCount.opt++;
          const next = lib.applyEdits(cur, edits);
          live.set(f, { v: live.get(f).v + 1, text: next });
        }
        if (!any) break;
      }
      for (const f of sel) finalOverlay.set(f, live.get(f).text);
    }
    const after2 = strip ? lib.diagnosticsWithOverlay(sel, finalOverlay, options).diagnostics : after1;
    const key = (d) => `${d.code}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
    const rows = [];
    for (const f of sel) {
      const bk = new Set((base.get(f) ?? []).map(key));
      const a1 = (after1.get(f) ?? []).filter((d) => !bk.has(key(d)));
      const a2 = (after2.get(f) ?? []).filter((d) => !bk.has(key(d)));
      rows.push({ file: rel(f), pkg: pk, base: (base.get(f) ?? []).length, afterRetype: a1.length, afterStrip: a2.length, stats: stats[f], diags: a2.map(lib.formatDiagnostic) });
    }
    summary.push({ pk, stripCount, rows });
    if (sampleOut) {
      for (const [f, t] of finalOverlay) {
        const dest = path.join(ROOT, sampleOut, rel(f));
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, t);
      }
    }
  }
  const outFile = arg('json') ? path.resolve(lib.workDir(__dirname), arg('json')) : path.join(lib.outDir(__dirname), 'run.json');
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(summary, null, 1));
  for (const s of summary) {
    const z1 = s.rows.filter((r) => r.afterRetype === 0).length;
    const z2 = s.rows.filter((r) => r.afterStrip === 0).length;
    console.log(`${s.pk}: files=${s.rows.length} zero-after-retype=${z1} zero-after-strip=${z2} stripped ?.=${s.stripCount.opt} ??=${s.stripCount.qq}; errors retype=${s.rows.reduce((a, r) => a + r.afterRetype, 0)} strip=${s.rows.reduce((a, r) => a + r.afterStrip, 0)}`);
  }
};
main();

// SD1 residue pass over a run.cjs sample: guard (narrowing) each file with TS2339s, then write the result and
// the remaining diagnostics (the hand queue).
// Usage: node tmp/phase34/sd1-retype-residue/residue.cjs --sample=tmp/sd1-sample0 --out=tmp/sd1-sample2 [--json=out/residue.json]
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');
const { guardFile, widenBrandFile } = require('./guard.cjs');
const { narrowGated } = require('./narrow-gated.cjs');
const { census, eliminateFile } = require('./deadcond.cjs');
const { ROOT, rel } = lib;
fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const SAMPLE = path.join(ROOT, arg('sample'));
const out = arg('out');

const live = new Map();
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : live.set(path.join(ROOT, path.relative(SAMPLE, path.join(d, e.name))), { v: 1, text: fs.readFileSync(path.join(d, e.name), 'utf8') })));
walk(SAMPLE);

const report = { applied: {}, hand: [], packages: {} };
for (const short of ['eslint-plugin', 'local-eslint']) {
  const w = lib.workspaces().find((x) => x.short === short);
  const files = [...live.keys()].filter((f) => f.startsWith(w.dir + path.sep) && !lib.isTestSupport(f));
  const svc = lib.makeLanguageService(w.dir, live);
  const errs = () => files.reduce((a, f) => a + svc.service.getSemanticDiagnostics(f).length + svc.service.getSyntacticDiagnostics(f).length, 0);
  const before = errs();
  const guardAll = () => {
    for (const f of files) {
      if (!svc.service.getSemanticDiagnostics(f).some((d) => d.code === 2339)) continue;
      const r = guardFile(svc, live, f);
      for (const [k, v] of Object.entries(r.applied)) report.applied[k] = (report.applied[k] ?? 0) + v;
      for (const h of r.hand) handAll.set(`${rel(f)}:${h.line}`, { file: rel(f), ...h });
    }
  };
  const handAll = new Map();
  guardAll();
  if (process.argv.includes('--narrow') && short === 'eslint-plugin') {
    const acc = narrowGated(svc, live, files);
    report.narrowed = acc;
    guardAll();
  }
  for (const f of files) {
    const n = widenBrandFile(svc, live, f);
    if (n) report.applied['brand-widen'] = (report.applied['brand-widen'] ?? 0) + n;
  }
  guardAll();
  const deadBefore = census(svc, files);
  if (process.argv.includes('--dead')) {
    for (const f of files) {
      const a = eliminateFile(svc, live, f);
      for (const [k, v] of Object.entries(a)) report.dead = { ...(report.dead ?? {}), [k]: ((report.dead ?? {})[k] ?? 0) + v };
    }
  }
  report.deadCensus = { ...(report.deadCensus ?? {}), [short]: { before: deadBefore, after: census(svc, files) } };
  for (const h of handAll.values()) report.hand.push(h);
  const remaining = [];
  for (const f of files) {
    for (const d of [...svc.service.getSyntacticDiagnostics(f), ...svc.service.getSemanticDiagnostics(f)]) remaining.push(lib.formatDiagnostic(d));
  }
  report.packages[short] = { files: files.length, before, after: remaining.length };
  report.remaining = [...(report.remaining ?? []), ...remaining];
}
if (out) {
  for (const [f, t] of live) {
    const dest = path.join(ROOT, out, rel(f));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, t.text);
  }
}
fs.writeFileSync(path.join(__dirname, arg('json') ?? 'out/residue.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify({ dead: report.dead, deadCensus: report.deadCensus, applied: report.applied, packages: report.packages, hand: report.hand.length }));

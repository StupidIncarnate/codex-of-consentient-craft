// SD7 (chunk W8): the `z.unknown()` replacements from item 3's decisions table (b15-brand-migration.md).
//
//   json      `z.unknown()` -> `z.json()`
//   own       -> the row's own brand schema, or a reference to the named contract (import added)
//   gateway   left for hand: the gateway schema does not exist yet (G20 layout), listed in leftovers
//   exception the one recorded row (staged-call `args`) is skipped
//   responder the `responderResultContract.data` row -> ./responder-data.cjs (--responders)
//
// Each row is re-located by (file, field) in today's tree, not by its recorded line: a row whose site is
// gone is reported `gone`. A file's edits are kept only when the typecheck of its package and every package
// that depends on it adds no diagnostic; a diagnostic is attributed to the edited file it names, else the
// edited files in its folder, else the file whose contract names appear in its statement.
//
//   node --max-old-space-size=32000 tmp/phase34/b15-unknown-fields/run.cjs [--only=json,own] [--pkgs=a,b]
//        [--responders] [--sample-out=dir] [--no-gate] [--leftovers=file] [apply]
// Default is a dry run. `apply` writes packages/.
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');
const G = require('./gen.cjs');
const readTable = require('./table.cjs');

const { ts, ROOT, rel } = lib;
const args = process.argv.slice(2);
const flag = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const doApply = args.includes('apply');
const noGate = args.includes('--no-gate');
const withResponders = args.includes('--responders');
const only = flag('only')?.split(',');
const pkgs = flag('pkgs')?.split(',');
const sampleOut = flag('sample-out');
const leftoversOut = flag('leftovers') ?? path.join(__dirname, 'out', 'leftovers.json');
fs.mkdirSync(path.dirname(leftoversOut), { recursive: true });

const keyOfNode = (n) => {
  for (let p = n.parent; p; p = p.parent) {
    if (ts.isPropertyAssignment(p) || ts.isPropertySignature(p)) return p.name.getText().replace(/^['"]|['"]$/gu, '');
    if (ts.isVariableDeclaration(p)) return p.name.getText();
  }
  return null;
};
const isUnknownCall = (n) => ts.isCallExpression(n) && n.arguments.length === 0 && n.expression.getText() === 'z.unknown';

const rows = readTable().filter((r) => (!only || only.includes(r.decision)) && (!pkgs || pkgs.includes(r.file.split('/')[1])));
const leftovers = [];
const left = (r, reason) => leftovers.push({ n: r.n, file: r.file, field: r.field, decision: r.decision, reason });
const status = { edited: 0, gone: 0 };

// ---- locate every row's site in today's tree and build per-file edits
const byFile = new Map();
for (const r of rows) (byFile.get(r.file) ?? byFile.set(r.file, []).get(r.file)).push(r);
const overlay = new Map();
const brandsOf = new Map();
const plan = new Map(); // abs file -> { rows: [...] }
for (const [file, frows] of byFile) {
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) {
    frows.forEach((r) => (left(r, 'file gone'), status.gone++));
    continue;
  }
  let text = fs.readFileSync(abs, 'utf8');
  const sf = lib.parse(abs, text);
  const cands = [];
  const visit = (n) => {
    if (isUnknownCall(n)) cands.push({ node: n, key: keyOfNode(n), used: false });
    ts.forEachChild(n, visit);
  };
  visit(sf);
  const edits = [];
  const imports = [];
  const done = [];
  for (const r of frows) {
    const key = r.field.split('.').pop();
    const c = cands.find((x) => !x.used && x.key === key);
    if (!c) {
      left(r, 'no z.unknown() under that key today (already replaced or moved)');
      status.gone++;
      continue;
    }
    const e = G.expressionFor(r, abs);
    if (e.skip) continue;
    if (e.responder) {
      if (!withResponders) left(r, 'responder data contracts: run with --responders');
      continue;
    }
    if (e.hand) {
      left(r, e.hand);
      continue;
    }
    c.used = true;
    let target = c.node;
    const p = c.node.parent;
    const inArray = ts.isCallExpression(p) && p.expression.getText() === 'z.array' && p.arguments.length === 1;
    // `z.array(z.unknown())` -> a target that already is the array (`....shape.questions`, or an array
    // schema itself) replaces the whole call, not just its element
    if (inArray && (e.array || /\.shape\.\w*s$/u.test(e.code))) target = p;
    edits.push({ start: target.getStart(sf), end: target.end, text: e.code });
    imports.push(...e.imports);
    done.push(r);
    for (const b of e.code.matchAll(/brand<'(\w+)'>/gu)) (brandsOf.get(abs) ?? brandsOf.set(abs, []).get(abs)).push(b[1]);
  }
  if (!edits.length) continue;
  text = lib.applyEdits(text, edits);
  if (imports.length) text = G.addImports(text, abs, imports);
  overlay.set(abs, text);
  plan.set(abs, { rows: done, newBrands: brandsOf.get(abs) });
}
console.error(`sites: ${[...plan.values()].reduce((a, p) => a + p.rows.length, 0)} scripted in ${plan.size} files`);

// ---- the gate
const ws = G.ws;
const baseCache = new Map();
const keyD = (d) => `${d.file ? rel(d.file.fileName) : ''}|${d.code}|${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
const affectedPackages = (files) => {
  const set = new Map();
  for (const f of files) {
    const w = lib.workspaceOf(f, ws);
    if (!w || w.isGateway) continue;
    set.set(w.name, w);
    for (const d of ws) if (!d.isGateway && G.depsOf(d)[w.name]) set.set(d.name, d);
  }
  return [...set.values()];
};
const newDiagnostics = (ov, keys = [...ov.keys()]) => {
  const found = [];
  for (const w of affectedPackages(keys)) {
    const options = lib.packageCompilerOptions(w.dir);
    const files = [...options.rootNames].map((f) => path.resolve(f));
    if (!baseCache.has(w.name)) {
      const b = lib.diagnosticsWithOverlay(files, new Map(), options).diagnostics;
      baseCache.set(w.name, new Set([...b.values()].flat().filter(Boolean).map(keyD)));
    }
    const t0 = Date.now();
    const aft = lib.diagnosticsWithOverlay(files, ov, options).diagnostics;
    let n = 0;
    for (const ds of aft.values()) for (const d of ds ?? []) if (!baseCache.get(w.name).has(keyD(d))) (found.push({ pkg: w.short, d }), n++);
    console.error(`  gate ${w.short}: ${files.length} files, ${n} new diagnostics, ${(Date.now() - t0) / 1000}s`);
  }
  return found;
};

const namesIn = (file) => {
  const t = accepted.get(file) ?? overlay.get(file) ?? fs.readFileSync(file, 'utf8');
  return [...t.matchAll(/^export (?:const|type) (\w+)/gmu)].map((m) => m[1]);
};
const attribute = (found, edited) => {
  const drop = new Set();
  const unattributed = [];
  for (const { d } of found) {
    const msg = ts.flattenDiagnosticMessageText(d.messageText, ' ');
    const df = d.file ? path.resolve(d.file.fileName) : null;
    let hit = edited.filter((f) => f === df);
    if (!hit.length && df) hit = edited.filter((f) => path.dirname(f) === path.dirname(df));
    if (!hit.length) {
      // a brand this run introduced, named in the message
      const brands = [...msg.matchAll(/\$brand<"([^"]+)">/gu)].map((m) => m[1]);
      hit = edited.filter((f) => (plan.get(f).newBrands ?? []).some((b) => brands.includes(b)));
    }
    if (!hit.length && d.file) {
      const around = d.file.text.slice(Math.max(0, (d.start ?? 0) - 600), (d.start ?? 0) + 400) + ' ' + msg;
      const ids = new Set(around.match(/\b[A-Za-z_$][\w$]*\b/gu));
      hit = edited.filter((f) => namesIn(f).some((nm) => ids.has(nm)));
    }
    if (!hit.length) unattributed.push(lib.formatDiagnostic(d));
    hit.forEach((f) => drop.add(f));
    hit.forEach((f) => (plan.get(f).note = plan.get(f).note ?? lib.formatDiagnostic(d).slice(0, 220)));
  }
  return { drop, unattributed };
};

let accepted = new Map(overlay);
const unattributedAll = [];
if (!noGate) {
  for (let round = 1; round <= 5 && accepted.size; round++) {
    const found = newDiagnostics(accepted);
    if (!found.length) {
      console.error(`gate round ${round}: clean`);
      unattributedAll.length = 0;
      break;
    }
    const { drop, unattributed } = attribute(found, [...accepted.keys()]);
    unattributedAll.length = 0;
    unattributedAll.push(...unattributed);
    console.error(`gate round ${round}: ${found.length} new diagnostics, ${drop.size} files dropped, ${unattributed.length} unattributed`);
    if (!drop.size) break;
    for (const f of drop) {
      for (const r of plan.get(f).rows) left(r, `gate: ${plan.get(f).note}`);
      accepted.delete(f);
    }
  }
}

// ---- responder data contracts: gated per responder, on top of what the first pass accepted
if (withResponders) {
  const R = require('./responder-data.cjs');
  const exclude = new Set();
  const notes = new Map();
  let out = null;
  for (let round = 1; round <= 6; round++) {
    out = R.plan({ overlay: accepted, exclude });
    if (noGate) break;
    const found = newDiagnostics(new Map([...accepted, ...out.overlay]), [...out.overlay.keys()]);
    if (!found.length) {
      console.error(`responder gate round ${round}: clean`);
      break;
    }
    const groupOf = (f) => [...out.groups].find(([, files]) => files.includes(f))?.[0];
    const exportName = (f) => (out.overlay.get(f) ?? '').match(/export const (\w+)/u)?.[1];
    const bad = new Set();
    for (const { d } of found) {
      const df = d.file ? path.resolve(d.file.fileName) : null;
      const msg = ts.flattenDiagnosticMessageText(d.messageText, ' ');
      let g = df && groupOf(df);
      if (!g && d.file) {
        const around = d.file.text.slice(Math.max(0, (d.start ?? 0) - 400), (d.start ?? 0) + 300) + ' ' + msg;
        const ids = new Set(around.match(/\b[A-Za-z_$][\w$]*\b/gu));
        g = [...out.groups].find(([, files]) => files.some((f) => f.endsWith('-contract.ts') && ids.has(exportName(f))))?.[0];
      }
      if (g) {
        bad.add(g);
        if (!notes.has(g)) notes.set(g, lib.formatDiagnostic(d).slice(0, 220));
      } else unattributedAll.push('responder stage: ' + lib.formatDiagnostic(d));
    }
    console.error(`responder gate round ${round}: ${found.length} new diagnostics, ${bad.size} responders dropped`);
    if (!bad.size) break;
    for (const g of bad) {
      exclude.add(g);
      leftovers.push({ n: 73, file: g, field: 'data', decision: 'responder', reason: `gate: ${notes.get(g)}` });
    }
  }
  for (const l of out.leftovers) leftovers.push(l);
  for (const [f, tx] of out.overlay) {
    accepted.set(f, tx);
    plan.set(f, plan.get(f) ?? { rows: [], generated: true });
  }
  console.error(`responders: ${out.groups.size} rewritten, ${exclude.size} dropped by the gate`);
}

// ---- outputs
if (sampleOut)
  for (const [f, t] of accepted) {
    const d = path.join(path.resolve(ROOT, sampleOut), rel(f));
    fs.mkdirSync(path.dirname(d), { recursive: true });
    fs.writeFileSync(d, t);
  }
if (doApply) for (const [f, t] of accepted) (fs.mkdirSync(path.dirname(f), { recursive: true }), fs.writeFileSync(f, t));
fs.writeFileSync(leftoversOut, JSON.stringify({ leftovers, unattributed: unattributedAll }, null, 1));
const okRows = [...accepted.keys()].reduce((a, f) => a + (plan.get(f)?.rows.length ?? 0), 0);
const groups = {};
for (const l of leftovers) (groups[l.reason.replace(/^gate: .*/u, 'gate: new diagnostic').slice(0, 80)] ||= []).push(l.n);
console.log(`${okRows} of ${rows.length} rows rewritten in ${[...accepted.keys()].filter((f) => plan.get(f)?.rows.length).length} files; ${leftovers.length} left${doApply ? '; WRITTEN' : ' (dry run)'}`);
for (const [k, v] of Object.entries(groups).sort((a, b) => b[1].length - a[1].length)) console.log(`  ${v.length}  ${k}  [${v.join(',')}]`);
if (unattributedAll.length) console.log(`unattributed diagnostics (${unattributedAll.length}), first: ${unattributedAll[0]}`);

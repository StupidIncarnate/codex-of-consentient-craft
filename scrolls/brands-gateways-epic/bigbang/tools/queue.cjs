#!/usr/bin/env node
// Batches of red files for fixer agents, from diag.cjs output + graph.cjs output.
//
// Usage:
//   node tmp/bigbang/tools/queue.cjs --diag=diag.json --graph=graph.json [--max=5] [--mode=ready|all]
//        [--transitive] [--pkgs=a,b] [--out=queue.json]
//   node tmp/bigbang/tools/queue.cjs --diag=diag.json --by-template [--fine] [--min=1] [--out=templates.json]
//
// ready: a red group qualifies only when every group it imports (direct deps; --transitive = all reachable)
//        has no diagnostics. A red file outside the graph (bin/, package-root *.ts, @types) is always ready.
// all:   every red group, lowest level first.
// Batches never mix packages; groups are packed in folder order up to --max red files, and a group is never
// split across batches unless it alone holds more than --max red files (then it is chunked, `splitOf` set).
// --by-template: clusters diagnostics by `template` (coarse) or `templateFine` (--fine: keeps short quoted
// names such as a brand), with counts, files, packages, codes and 3 sample sites.
const path = require('path');
const L = require('./lib.cjs');

const A = L.args();
if (!A.diag) {
  console.error('need --diag=<diag.json>');
  process.exit(1);
}
const diags = L.readJson(A.diag);
const max = Number(A.max ?? 5);

// ---------------------------------------------------------------- by-template
if (A['by-template']) {
  const key = A.fine ? 'templateFine' : 'template';
  const m = new Map();
  for (const d of diags) {
    const k = `TS${d.code} ${d[key]}`;
    if (!m.has(k)) m.set(k, { template: d[key], code: d.code, count: 0, files: new Set(), pkgs: new Set(), samples: [] });
    const c = m.get(k);
    c.count++;
    c.files.add(d.file);
    c.pkgs.add(d.pkg);
    // samples from distinct files, spread across packages first
    if (c.samples.length < 3 && !c.samples.some((s) => s.file === d.file) && (c.samples.length < 1 || !c.samples.some((s) => s.pkg === d.pkg) || c.pkgs.size === 1))
      c.samples.push({ pkg: d.pkg, file: d.file, line: d.line, col: d.col, message: d.message });
  }
  const out = [...m.values()]
    .filter((c) => c.count >= Number(A.min ?? 1))
    .sort((a, b) => b.count - a.count)
    .map((c, i) => ({ id: `T${i + 1}`, code: c.code, template: c.template, count: c.count, fileCount: c.files.size, pkgs: [...c.pkgs].sort(), files: [...c.files].sort(), samples: c.samples }));
  if (A.out) L.writeJson(A.out, out);
  console.log(`${out.length} templates over ${diags.length} diagnostics (${A.fine ? 'fine' : 'coarse'})`);
  for (const c of out.slice(0, Number(A.top ?? 25)))
    console.log(`  ${c.id.padEnd(5)} ${String(c.count).padStart(6)}x ${String(c.fileCount).padStart(5)}f ${String(c.pkgs.length).padStart(2)}p  TS${c.code} ${c.template.slice(0, 150)}`);
  process.exit(0);
}

// ---------------------------------------------------------------- batches
if (!A.graph) {
  console.error('need --graph=<graph.json>');
  process.exit(1);
}
const graph = L.readJson(A.graph);
const { groups, fileToGroup } = graph;
const mode = A.mode ?? 'ready';
const pkgFilter = A.pkgs ? new Set(String(A.pkgs).split(',')) : null;

const byFile = new Map();
const unowned = [];
for (const d of diags) {
  if (!d.file) {
    unowned.push(d);
    continue;
  }
  if (!byFile.has(d.file)) byFile.set(d.file, []);
  byFile.get(d.file).push(d);
}
const redGroups = new Set();
const outside = []; // red files the graph does not hold
for (const f of byFile.keys()) {
  const g = fileToGroup[f];
  if (g === undefined) outside.push(f);
  else redGroups.add(g);
}

const reachRed = new Map();
const hasRedDep = (gid) => {
  if (!A.transitive) return groups[gid].deps.some((d) => redGroups.has(d));
  if (reachRed.has(gid)) return reachRed.get(gid);
  reachRed.set(gid, false);
  const r = groups[gid].deps.some((d) => redGroups.has(d) || hasRedDep(d));
  reachRed.set(gid, r);
  return r;
};

// units of work: red groups (+ pseudo-groups for red files outside the graph)
const list = L.workspaces();
const work = [];
for (const gid of redGroups) {
  const g = groups[gid];
  const blocked = hasRedDep(gid);
  if (mode === 'ready' && blocked) continue;
  const red = g.files.filter((f) => byFile.has(f));
  work.push({ gid, pkg: g.pkg, level: g.level, red, groupFiles: g.files, cycle: g.cycle, folder: path.dirname(red[0]) });
}
for (const f of outside) work.push({ gid: null, pkg: L.ownerOf(f, list) ?? '(outside packages)', level: 0, red: [f], groupFiles: [f], cycle: false, folder: path.dirname(f) });

const filtered = work.filter((w) => !pkgFilter || pkgFilter.has(w.pkg));
filtered.sort((a, b) => a.pkg.localeCompare(b.pkg) || (mode === 'all' ? a.level - b.level : 0) || a.folder.localeCompare(b.folder) || a.red[0].localeCompare(b.red[0]));

const dominant = (ds, n = 3) => {
  const m = new Map();
  for (const d of ds) {
    const k = `TS${d.code} ${d.template}`;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([template, count]) => ({ template, count }));
};

const batches = [];
let cur = null;
const flush = () => {
  if (cur && cur.files.length) batches.push(cur);
  cur = null;
};
const fileEntry = (f) => ({ file: f, diagnostics: byFile.get(f).map((d) => ({ line: d.line, col: d.col, code: d.code, message: d.message })) });
for (const w of filtered) {
  if (w.red.length > max) {
    flush();
    for (let i = 0; i < w.red.length; i += max) {
      batches.push({ pkg: w.pkg, levels: [w.level], groups: [w.gid], splitOf: w.gid, files: w.red.slice(i, i + max).map(fileEntry), context: w.groupFiles.filter((f) => !byFile.has(f)) });
    }
    continue;
  }
  if (!cur || cur.pkg !== w.pkg || cur.files.length + w.red.length > max) {
    flush();
    cur = { pkg: w.pkg, levels: [], groups: [], files: [], context: [] };
  }
  cur.groups.push(w.gid);
  if (!cur.levels.includes(w.level)) cur.levels.push(w.level);
  cur.files.push(...w.red.map(fileEntry));
  // green companions of the same group: files the fix may need to read or touch
  cur.context.push(...w.groupFiles.filter((f) => !byFile.has(f)));
}
flush();
batches.forEach((b, i) => {
  b.id = `B${String(i + 1).padStart(4, '0')}`;
  b.diagnosticCount = b.files.reduce((n, f) => n + f.diagnostics.length, 0);
  b.dominantTemplates = dominant(b.files.flatMap((f) => byFile.get(f.file)));
});
const ordered = batches.map(({ id, pkg, levels, groups: gs, splitOf, diagnosticCount, dominantTemplates, files, context }) => ({ id, pkg, levels, groups: gs, splitOf, diagnosticCount, dominantTemplates, files, context }));

// blockers: red groups that hold back the most red groups (direct)
const blockCount = new Map();
for (const gid of redGroups) for (const d of groups[gid].deps) if (redGroups.has(d)) blockCount.set(d, (blockCount.get(d) ?? 0) + 1);
const blockers = [...blockCount].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([gid, n]) => ({ group: gid, blocks: n, files: groups[gid].files.filter((f) => byFile.has(f)) }));

const stats = {
  mode,
  transitive: !!A.transitive,
  redFiles: byFile.size,
  redGroups: redGroups.size,
  redOutsideGraph: outside.length,
  diagnosticsWithoutFile: unowned.length,
  readyGroups: work.filter((w) => w.gid !== null).length,
  batches: ordered.length,
  filesInBatches: ordered.reduce((n, b) => n + b.files.length, 0),
};
if (A.out) L.writeJson(A.out, { stats, batches: ordered, blockers, unowned });
console.log(JSON.stringify(stats));
const perPkg = new Map();
for (const b of ordered) perPkg.set(b.pkg, (perPkg.get(b.pkg) ?? 0) + 1);
console.log('batches per package:', [...perPkg].map(([k, n]) => `${k}:${n}`).join(' '));
if (blockers.length) {
  console.log('top blockers (red group -> red groups it holds back):');
  for (const b of blockers) console.log(`  g${b.group} blocks ${b.blocks}: ${b.files.slice(0, 3).join(', ')}`);
}
if (unowned.length) console.log(`diagnostics with no file (config/options/global): ${unowned.length}`);

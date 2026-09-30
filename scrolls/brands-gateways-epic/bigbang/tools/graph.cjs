#!/usr/bin/env node
// Import graph over every .ts/.tsx under packages/*/{src,test} and packages/@gateway/*/{src,test}.
// Specifiers resolve with ts.resolveModuleName under the OWNING package's tsconfig.json options (node16 +
// `source` condition for most, bundler for web, `paths` for eslint-plugin), unfenced like ward's tsc.
// Edges: import/export-from, import = require, import(), require(), import('x') types.
//
// Grouping: every companion (*.test.ts(x), *.integration.test.ts, *.proxy.ts(x), *.stub.ts, *.e2e.ts,
// *.harness.ts) joins its subject's group when the subject sits beside it: same stem (`foo-broker.proxy.ts`
// -> `foo-broker.ts`), or the one `stem-<suffix>.ts` beside it (`foo.stub.ts` -> `foo-contract.ts`).
// Strongly connected components are then collapsed over those groups.
// level: 0 = depends on no other group; else 1 + max(level of deps).
//
// Usage: node tmp/bigbang/tools/graph.cjs [--out=graph.json] [--overlay=<json>]
// Output: { stats, groups: [{id, pkg, pkgs, files, deps, rdeps, level, cycle}], fileToGroup, unresolved }
const fs = require('fs');
const path = require('path');
const L = require('./lib.cjs');

const { ts, ROOT } = L;
const A = L.args();

const t0 = Date.now();
const list = L.workspaces();
const overlay = L.loadOverlay(A.overlay);

// ---- files
const files = [];
for (const w of list) for (const sub of ['src', 'test']) for (const f of L.walk(path.join(w.dir, sub))) files.push(f);
const fileSet = new Set(files);
const idx = new Map(files.map((f, i) => [f, i]));

// ---- per-package resolution
const pkgCtx = new Map();
const ctxOf = (w) => {
  if (pkgCtx.has(w.key)) return pkgCtx.get(w.key);
  const cfg = path.join(w.dir, 'tsconfig.json');
  const options = fs.existsSync(cfg) ? L.parseTsconfig(cfg).options : { module: ts.ModuleKind.Node16, moduleResolution: ts.ModuleResolutionKind.Node16, customConditions: ['source'] };
  const host = L.fencedHost(options, overlay, { fence: !!A.fence });
  const cache = ts.createModuleResolutionCache(w.dir, (x) => x, options);
  const c = { options, host, cache };
  pkgCtx.set(w.key, c);
  return c;
};
const realpath = (p) => {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
};

const specifiersOf = (sf) => {
  const out = [];
  const lit = (n) => (n && ts.isStringLiteralLike(n) ? n.text : null);
  const visit = (n) => {
    if ((ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier) {
      const s = lit(n.moduleSpecifier);
      if (s) out.push({ s, mode: ts.getModeForUsageLocation(sf, n.moduleSpecifier) });
    } else if (ts.isImportEqualsDeclaration(n) && ts.isExternalModuleReference(n.moduleReference)) {
      const s = lit(n.moduleReference.expression);
      if (s) out.push({ s, mode: undefined });
    } else if (ts.isCallExpression(n) && n.arguments.length >= 1) {
      const isImport = n.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire = ts.isIdentifier(n.expression) && n.expression.text === 'require';
      const isReqAct =
        ts.isPropertyAccessExpression(n.expression) &&
        ts.isIdentifier(n.expression.expression) &&
        n.expression.expression.text === 'jest' &&
        /^(requireActual|mock|requireMock|doMock)$/u.test(n.expression.name.text);
      if (isImport || isRequire || isReqAct) {
        const s = lit(n.arguments[0]);
        if (s) out.push({ s, mode: isImport ? ts.ModuleKind.ESNext : ts.ModuleKind.CommonJS });
      }
    } else if (ts.isImportTypeNode(n) && ts.isLiteralTypeNode(n.argument)) {
      const s = lit(n.argument.literal);
      if (s) out.push({ s, mode: undefined });
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
};

const inRepoSpec = (s) => s.startsWith('.') || s.startsWith('#') || s.startsWith('@dungeonmaster/');
const edges = files.map(() => new Set());
const unresolved = [];
for (const f of files) {
  const w = list.find((x) => f.startsWith(x.dir + path.sep));
  const { options, host, cache } = ctxOf(w);
  const text = overlay.has(f) ? overlay.get(f) : fs.readFileSync(f, 'utf8');
  if (text === null) continue;
  const sf = ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  // impliedNodeFormat decides import-vs-require conditions under node16
  sf.impliedNodeFormat = ts.getImpliedNodeFormatForFile(f, cache.getPackageJsonInfoCache(), host, options);
  for (const { s, mode } of specifiersOf(sf)) {
    const r = ts.resolveModuleName(s, f, options, host, cache, undefined, mode ?? sf.impliedNodeFormat);
    const target = r.resolvedModule ? realpath(r.resolvedModule.resolvedFileName) : null;
    if (target && fileSet.has(target)) {
      if (target !== f) edges[idx.get(f)].add(idx.get(target));
    } else if (!target && inRepoSpec(s)) unresolved.push({ file: L.rel(f), spec: s });
  }
}

// ---- union-find companions onto subjects
const parent = files.map((_, i) => i);
const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
const unite = (a, b) => {
  const ra = find(a);
  const rb = find(b);
  if (ra !== rb) parent[rb] = ra;
};
const byDir = new Map();
for (const f of files) {
  const d = path.dirname(f);
  if (!byDir.has(d)) byDir.set(d, []);
  byDir.get(d).push(path.basename(f));
}
let attached = 0;
for (const f of files) {
  const base = path.basename(f);
  if (!L.isCompanion(base)) continue;
  const stem = L.companionStem(base);
  const sibs = byDir.get(path.dirname(f)).filter((b) => !L.isCompanion(b));
  let subj = sibs.find((b) => b === `${stem}.ts` || b === `${stem}.tsx`);
  if (!subj) {
    const c = sibs.filter((b) => b.startsWith(`${stem}-`) && /^[a-z]+\.tsx?$/u.test(b.slice(stem.length + 1)));
    if (c.length === 1) subj = c[0];
  }
  if (subj) {
    // subject first so it stays the union's root
    const si = idx.get(path.join(path.dirname(f), subj));
    const ci = idx.get(f);
    const rs = find(si);
    const rc = find(ci);
    if (rs !== rc) parent[rc] = rs;
    attached++;
  }
}
const unitOf = files.map((_, i) => find(i));
const units = [...new Set(unitOf)];
const unitIdx = new Map(units.map((u, i) => [u, i]));
const unitFiles = units.map(() => []);
files.forEach((_, i) => unitFiles[unitIdx.get(unitOf[i])].push(i));
const unitEdges = units.map(() => new Set());
files.forEach((_, i) => {
  const a = unitIdx.get(unitOf[i]);
  for (const j of edges[i]) {
    const b = unitIdx.get(unitOf[j]);
    if (a !== b) unitEdges[a].add(b);
  }
});

// ---- Tarjan SCC (iterative). Emission order is reverse-topological: a component comes after all it reaches.
const tarjan = (adj) => {
  const N = adj.length;
  const index = new Int32Array(N).fill(-1);
  const low = new Int32Array(N);
  const onStack = new Uint8Array(N);
  const stack = [];
  const comp = new Int32Array(N).fill(-1);
  const comps = [];
  let counter = 0;
  for (let s = 0; s < N; s++) {
    if (index[s] !== -1) continue;
    const work = [[s, 0]];
    index[s] = low[s] = counter++;
    stack.push(s);
    onStack[s] = 1;
    while (work.length) {
      const top = work[work.length - 1];
      const v = top[0];
      if (top[1] < adj[v].length) {
        const w = adj[v][top[1]++];
        if (index[w] === -1) {
          index[w] = low[w] = counter++;
          stack.push(w);
          onStack[w] = 1;
          work.push([w, 0]);
        } else if (onStack[w]) low[v] = Math.min(low[v], index[w]);
      } else {
        work.pop();
        if (work.length) {
          const p = work[work.length - 1][0];
          low[p] = Math.min(low[p], low[v]);
        }
        if (low[v] === index[v]) {
          const c = [];
          let x;
          do {
            x = stack.pop();
            onStack[x] = 0;
            comp[x] = comps.length;
            c.push(x);
          } while (x !== v);
          comps.push(c);
        }
      }
    }
  }
  return { comp, comps };
};
const { comp, comps } = tarjan(unitEdges.map((x) => [...x]));
// Cycles in the raw per-file graph, before companions merge: tells a real import cycle from one the
// subject+companion grouping created.
const rawComps = tarjan(edges.map((x) => [...x])).comps.filter((c) => c.length > 1);

// ---- groups (one per SCC), in emission order so deps are finished first
const groups = comps.map((c, gi) => {
  const fl = c.flatMap((u) => unitFiles[u]).map((i) => L.rel(files[i])).sort();
  const pkgs = [...new Set(fl.map((f) => L.ownerOf(f, list)))];
  const deps = new Set();
  for (const u of c) for (const w of unitEdges[u]) if (comp[w] !== gi) deps.add(comp[w]);
  return { id: gi, pkg: pkgs[0], pkgs, files: fl, deps: [...deps].sort((a, b) => a - b), rdeps: [], level: 0, cycle: c.length > 1, units: c.length };
});
for (const g of groups) {
  g.level = g.deps.length ? 1 + Math.max(...g.deps.map((d) => groups[d].level)) : 0;
  for (const d of g.deps) groups[d].rdeps.push(g.id);
}
const fileToGroup = {};
for (const g of groups) for (const f of g.files) fileToGroup[f] = g.id;

const cycles = groups.filter((g) => g.cycle).sort((a, b) => b.files.length - a.files.length);
const maxLevel = Math.max(...groups.map((g) => g.level));
const levelHist = {};
for (const g of groups) levelHist[g.level] = (levelHist[g.level] ?? 0) + 1;
const stats = {
  files: files.length,
  companionsAttached: attached,
  groups: groups.length,
  cycles: cycles.length,
  filesInCycles: cycles.reduce((n, g) => n + g.files.length, 0),
  maxLevel,
  levelHist,
  rawFileCycles: rawComps.length,
  rawFilesInCycles: rawComps.reduce((n, c) => n + c.length, 0),
  rawBiggestCycle: Math.max(0, ...rawComps.map((c) => c.length)),
  unresolvedInRepoSpecifiers: unresolved.length,
  ms: Date.now() - t0,
  maxRssMB: Math.round(process.resourceUsage().maxRSS / 1024),
};
if (A.out) L.writeJson(A.out, { stats, groups, fileToGroup, unresolved });

console.log(JSON.stringify({ ...stats, levelHist: undefined }));
console.log('levels:', Object.entries(levelHist).map(([l, n]) => `${l}:${n}`).join(' '));
console.log(`biggest cycles (units / files):`);
for (const g of cycles.slice(0, Number(A.top ?? 8))) {
  const shown = g.files.filter((f) => !L.isCompanion(path.basename(f)));
  console.log(`  #${g.id} ${g.pkgs.join('+')} units=${g.units} files=${g.files.length} level=${g.level}: ${shown.slice(0, 6).join(', ')}${shown.length > 6 ? ', ...' : ''}`);
}
if (unresolved.length) {
  console.log('unresolved in-repo specifiers (first 10):');
  for (const u of unresolved.slice(0, 10)) console.log(`  ${u.file}: '${u.spec}'`);
}

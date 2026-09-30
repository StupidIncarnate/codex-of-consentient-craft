// B15 (and B11/B16): rename an exported symbol everywhere it is used, through TypeScript's own
// rename (LanguageService.findRenameLocations), so imports, re-exports, type references and
// shorthand properties all follow — the job a brand's derived text creates when it renames a type
// (`FailCount` -> `WorkItemRetryCount`) or its contract and stub consts.
//
// A LanguageService per package (its own tsconfig.json, fenced to this worktree) is built for the
// declaring package and every package that depends on it (dependencies or devDependencies,
// transitively); locations from all of them are unioned. Strings and comments are not touched: a
// brand text inside `.brand<'...'>()` is B12's autofix, and a comment is for the agent.
//
//   node scrolls/brands-gateways-epic/phase34-scripts/b15-rename/rename.cjs --file=<declaring file> --from=Old --to=New [--sample-out=<dir>] [apply]
//   node scrolls/brands-gateways-epic/phase34-scripts/b15-rename/rename.cjs --batch=<renames.json> [--sample-out=<dir>] [apply]
//        renames.json: [{ "file": "packages/...-contract.ts", "from": "FailCount", "to": "WorkItemRetryCount" }, ...]
// A rename is refused when `to` already appears as an identifier in any file it would touch.
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');

const { ts, ROOT, rel } = lib;
const args = process.argv.slice(2);
const opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? null;
const APPLY = args.includes('apply');
const sampleOut = opt('sample-out');
const renames = opt('batch')
  ? JSON.parse(fs.readFileSync(path.resolve(ROOT, opt('batch')), 'utf8'))
  : [{ file: opt('file'), from: opt('from'), to: opt('to') }];
if (renames.some((r) => !r.file || !r.from || !r.to)) {
  console.error('usage: rename.cjs --file=<f> --from=Old --to=New | --batch=<json> [--sample-out=<dir>] [apply]');
  process.exit(2);
}
const ws = lib.workspaces();
const byName = new Map(ws.map((w) => [w.name, w]));
const dependents = (w) => {
  const out = new Set([w]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const x of ws) {
      if (out.has(x)) continue;
      const pj = x.packageJson;
      const deps = Object.keys({ ...pj.dependencies, ...pj.devDependencies, ...pj.peerDependencies });
      if (deps.some((d) => byName.has(d) && out.has(byName.get(d)))) {
        out.add(x);
        grew = true;
      }
    }
  }
  return out;
};

const declPos = (abs, name) => {
  const sf = lib.parse(abs);
  let pos = null;
  const visit = (n) => {
    if (pos !== null) return;
    if ((ts.isVariableDeclaration(n) || ts.isTypeAliasDeclaration(n) || ts.isInterfaceDeclaration(n) || ts.isFunctionDeclaration(n) || ts.isClassDeclaration(n) || ts.isEnumDeclaration(n)) && n.name && ts.isIdentifier(n.name) && n.name.text === name) {
      pos = n.name.getStart(sf);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return pos;
};

const jobs = renames.map((r) => {
  const abs = path.resolve(ROOT, r.file);
  const pos = fs.existsSync(abs) ? declPos(abs, r.from) : null;
  return { ...r, abs, pos, locs: new Map(), refused: pos === null ? `no declaration of ${r.from} in ${r.file}` : null };
});
const pkgs = new Set();
for (const j of jobs) if (!j.refused) for (const w of dependents(lib.workspaceOf(j.abs, ws))) pkgs.add(w);

const t0 = Date.now();
for (const w of pkgs) {
  if (!fs.existsSync(path.join(w.dir, 'tsconfig.json'))) continue;
  const { service } = lib.makeLanguageService(w.dir);
  for (const j of jobs) {
    if (j.refused || !service.getProgram().getSourceFile(j.abs)) continue;
    const locs = service.findRenameLocations(j.abs, j.pos, false, false, { providePrefixAndSuffixTextForRename: false }) ?? [];
    for (const l of locs) {
      const f = path.resolve(l.fileName);
      if (!lib.inRoot(f) || f.includes(`${path.sep}node_modules${path.sep}`) && !fs.realpathSync(f).startsWith(ROOT)) continue;
      const real = fs.realpathSync(f);
      j.locs.set(`${real}\0${l.textSpan.start}`, { file: real, start: l.textSpan.start, end: l.textSpan.start + l.textSpan.length });
    }
  }
  process.stderr.write(`  scanned ${w.short} (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
}

const perFile = new Map();
for (const j of jobs) {
  if (j.refused) continue;
  const files = new Set([...j.locs.values()].map((l) => l.file));
  const clash = [...files].filter((f) => new RegExp(`\\b${j.to}\\b`, 'u').test(fs.readFileSync(f, 'utf8')));
  if (clash.length) {
    j.refused = `${j.to} already appears in ${clash.slice(0, 3).map(rel).join(', ')}${clash.length > 3 ? ' ...' : ''}`;
    continue;
  }
  for (const l of j.locs.values()) {
    if (!perFile.has(l.file)) perFile.set(l.file, []);
    perFile.get(l.file).push({ start: l.start, end: l.end, text: j.to });
  }
}
// The same text left behind: a local alias of the same name (a different symbol), a comment, a string.
const leftovers = [];
for (const j of jobs) {
  if (j.refused) continue;
  const re = new RegExp(`\\b${j.from}\\b`, 'u');
  for (const w of pkgs) {
    for (const f of lib.walk(w.dir)) {
      const text = fs.readFileSync(f, 'utf8');
      if (!re.test(text)) continue;
      const renamedHere = new Set([...j.locs.values()].filter((l) => l.file === f).map((l) => l.start));
      text.split('\n').reduce((off, line, i) => {
        const m = new RegExp(`\\b${j.from}\\b`, 'gu');
        for (let x = m.exec(line); x; x = m.exec(line)) {
          if (!renamedHere.has(off + x.index)) leftovers.push(`${rel(f)}:${i + 1}: ${line.trim().slice(0, 120)}`);
        }
        return off + line.length + 1;
      }, 0);
    }
  }
}
fs.mkdirSync(lib.outDir(__dirname), { recursive: true });
fs.writeFileSync(path.join(lib.outDir(__dirname), 'leftovers.txt'), leftovers.join('\n') + '\n');

let diff = '';
const writes = new Map();
for (const [f, edits] of perFile) {
  const text = fs.readFileSync(f, 'utf8');
  const uniq = [...new Map(edits.map((e) => [e.start, e])).values()];
  const after = lib.applyEdits(text, uniq);
  writes.set(f, after);
  diff += lib.unifiedDiff(rel(f), text, after);
}
fs.mkdirSync(lib.outDir(__dirname), { recursive: true });
fs.writeFileSync(path.join(lib.outDir(__dirname), 'last-run.diff'), diff);
for (const j of jobs) {
  console.log(j.refused ? `REFUSED ${j.from} -> ${j.to}: ${j.refused}` : `${j.from} -> ${j.to}: ${j.locs.size} locations in ${new Set([...j.locs.values()].map((l) => l.file)).size} files`);
}
console.log(`same text NOT renamed (another symbol of that name, a comment or a string): ${leftovers.length}, listed in ${path.join(lib.outDir(__dirname), 'leftovers.txt')}`);
console.log(`${APPLY ? 'APPLIED' : sampleOut ? 'SAMPLE' : 'DRY RUN'}: ${writes.size} files; ${pkgs.size} packages scanned in ${((Date.now() - t0) / 1000).toFixed(0)}s; diff tmp/phase34/b15-rename/out/last-run.diff`);
if (sampleOut) {
  for (const [f, t] of writes) {
    const dest = path.join(path.resolve(ROOT, sampleOut), rel(f));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, t);
  }
} else if (APPLY) for (const [f, t] of writes) fs.writeFileSync(f, t);

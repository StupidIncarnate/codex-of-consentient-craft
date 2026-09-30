// B11 census: every `export const <name>Contract` declared in more than one workspace package, with
// what each definition is (object contract, or a standalone scalar/enum that B15's B2 deletes) and
// which packages every user already depends on — the candidates to keep the name.
//
// Usage: node scrolls/brands-gateways-epic/phase34-scripts/b11-contract-merge/census.cjs            (read-only; writes out/duplicates.json)
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');
const { buildIndex } = require('../b02-contract-index/index.cjs');

const { ts, ROOT, rel } = lib;
const ws = lib.workspaces().filter((w) => !w.isGateway);
const byShort = new Map(ws.map((w) => [w.short, w]));
const { list } = buildIndex();

const shapeOf = (file, name) => {
  const sf = lib.parse(path.join(ROOT, file));
  let kind = 'other';
  const visit = (n) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === name && n.initializer) {
      const t = n.initializer.getText(sf).replace(/\s+/gu, ' ');
      kind = /^z\s*\.\s*object\(|\.extend\(|\.merge\(|z\.discriminatedUnion|z\.union\(\[\s*z\.object/u.test(t)
        ? 'object'
        : /^z\s*\.\s*(string|number|int|boolean|bigint)\(/u.test(t)
          ? /\.brand/u.test(t) ? 'scalar-brand' : 'scalar'
          : /^z\s*\.\s*enum\(/u.test(t) ? 'enum' : /^z\s*\.\s*array\(/u.test(t) ? 'array' : 'other';
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return kind;
};

// A production user needs the keeper in its dependencies (transitively); a test user may reach it
// through devDependencies too.
const closure = (short, withDev, seen = new Set()) => {
  if (seen.has(short)) return seen;
  seen.add(short);
  const pj = byShort.get(short)?.packageJson ?? {};
  const names = { ...pj.dependencies, ...pj.peerDependencies, ...(withDev ? pj.devDependencies : {}) };
  for (const d of Object.keys(names)) {
    const s = d.replace(lib.SCOPE_RE, '');
    if (d.startsWith(lib.SCOPE) && byShort.has(s)) closure(s, false, seen);
  }
  return seen;
};
const prodDeps = new Map(ws.map((w) => [w.short, closure(w.short, false)]));
const allDeps = new Map(ws.map((w) => [w.short, closure(w.short, true)]));

const byName = new Map();
for (const i of list) {
  for (const c of i.exportsConsts) {
    if (!/Contract$/u.test(c)) continue;
    if (!byName.has(c)) byName.set(c, []);
    byName.get(c).push(i);
  }
}
const dups = [];
for (const [name, defs] of byName) {
  const pkgs = new Set(defs.map((d) => d.pkg));
  if (pkgs.size < 2) continue;
  const prodUsers = new Set();
  const testUsers = new Set();
  const pk = (u) => lib.workspaceOf(path.join(ROOT, u), ws).short;
  for (const d of defs) {
    for (const u of [...d.prodValueUses, ...d.prodTypeUses, ...d.nestedIn]) prodUsers.add(pk(u));
    for (const u of [...d.testUses, ...d.stubUses]) testUsers.add(pk(u));
    prodUsers.add(d.pkg);
  }
  const missing = (p) => [
    ...[...prodUsers].filter((u) => !prodDeps.get(u)?.has(p)),
    ...[...testUsers].filter((u) => !allDeps.get(u)?.has(p)).map((u) => u + '(test)'),
  ];
  const keepCandidates = [...pkgs].filter((p) => !missing(p).length);
  const nearest = keepCandidates.length ? null : [...pkgs].map((p) => ({ p, missing: missing(p) })).sort((a, b) => a.missing.length - b.missing.length)[0];
  const users = [...prodUsers, ...[...testUsers].map((u) => u + '(test)')];
  dups.push({
    name,
    definitions: defs.map((d) => ({ file: d.file, pkg: d.pkg, shape: shapeOf(d.file, name), class: d.cls })),
    users: users.sort(),
    keepCandidates,
    nearest,
  });
}
dups.sort((a, b) => a.name.localeCompare(b.name));
fs.mkdirSync(lib.outDir(__dirname), { recursive: true });
fs.writeFileSync(path.join(lib.outDir(__dirname), 'duplicates.json'), JSON.stringify(dups, null, 1));
const objectDups = dups.filter((d) => d.definitions.some((x) => x.shape === 'object'));
console.log(`${dups.length} contract names declared in more than one package; ${objectDups.length} have an object definition (B11 merges these; scalar/enum ones wait for B15's B2).`);
for (const d of dups) {
  const defs = d.definitions.map((x) => `${x.pkg}:${x.shape}/${x.class}`).join(' ');
  console.log(`  ${d.name.padEnd(34)} ${defs.padEnd(70)} keep in: ${d.keepCandidates.join(',') || `NONE; nearest ${d.nearest.p}, missing a dependency from ${d.nearest.missing.join(',')}`}`);
}

// B13 parameter retype prototype: `questId: string` -> `Quest['id']` (+ type import) when the name matches an
// owner contract's `<owner><key>` on camelCase word boundaries, longest owner wins.
// Usage: node .../retype.cjs [--pkgs=a,b] [--validate] [--sample-out=dir] [--tests]
const fs = require('fs');
const path = require('path');
const lib = require('../../lib/repo.cjs');
const { buildIndex, words, ws } = require('./index.cjs');
const { ts, ROOT, rel } = lib;
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const includeTests = process.argv.includes('--tests');
const onlyPkgs = arg('pkgs')?.split(',');

const owners = buildIndex();
// name matcher entries: every (owner, key) pair -> word sequence
const entries = [];
for (const o of owners) for (const k of o.keys) entries.push({ ...o, key: k, seq: [...o.words, ...words(k)], ownerLen: o.words.length });
const endsWith = (a, b) => b.length <= a.length && b.every((w, i) => a[a.length - b.length + i] === w);
const match = (name) => {
  const nw = words(name);
  const hits = entries.filter((e) => endsWith(nw, e.seq));
  if (!hits.length) return null;
  // longest owner wins; then longest whole sequence
  hits.sort((a, b) => b.ownerLen - a.ownerLen || b.seq.length - a.seq.length);
  const top = hits[0];
  const same = hits.filter((h) => h.ownerLen === top.ownerLen && h.seq.length === top.seq.length);
  return { top, ambiguous: new Set(same.map((h) => `${h.pkg}:${h.owner}`)).size > 1, same };
};

// which packages can a file import from
const reach = (w) => {
  const pj = w.packageJson;
  const deps = new Set([w.name, ...Object.keys(pj.dependencies ?? {}), ...Object.keys(pj.devDependencies ?? {})]);
  return deps;
};
const resolver = lib.makeResolver();
const barrelCache = new Map();
const barrelExports = (pkgName, name) => {
  const w = ws.find((x) => x.name === pkgName);
  const k = `${pkgName}\0${name}`;
  if (barrelCache.has(k)) return barrelCache.get(k);
  const barrel = path.join(w.dir, 'src/contracts/contracts.ts');
  const legacy = path.join(w.dir, 'contracts.ts');
  const b = fs.existsSync(barrel) ? barrel : fs.existsSync(legacy) ? legacy : null;
  let ok = false;
  if (b) ok = !!lib.findDeclaringFile(b, name, resolver);
  barrelCache.set(k, ok);
  return ok;
};

// A harness is a test boundary: its parameters take raw input (plain strings), and its callers pass plain values. A retype
// to `Owner['key']` there makes every caller wrap what it passes.
const HARNESS_FILE = /(^|\/)test\/harnesses\/|\.harness\.tsx?$/u;
const candidates = [];
const skipped = { ambiguous: 0, unreachable: 0, nameClash: 0, notBarrel: 0, harness: 0 };
const fileTexts = new Map();
for (const w of ws) {
  if (w.isGateway) continue;
  if (onlyPkgs && !onlyPkgs.includes(w.short)) continue;
  const reachable = reach(w);
  const files = lib.walk(w.dir).filter((f) => !f.includes('/dist/') && (includeTests || !lib.isTestSupport(f)) && (!HARNESS_FILE.test(rel(f)) || (skipped.harness++, false)));
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    if (!/:\s*string\b/u.test(text)) continue;
    const sf = lib.parse(f, text);
    const consider = (nameNode, typeNode, site) => {
      const name = nameNode.text;
      const isStr = typeNode.kind === ts.SyntaxKind.StringKeyword;
      let strNode = isStr ? typeNode : null;
      if (!strNode && ts.isUnionTypeNode(typeNode)) strNode = typeNode.types.find((t) => t.kind === ts.SyntaxKind.StringKeyword) ?? null;
      if (!strNode) return;
      const m = match(name);
      if (!m) return;
      if (m.ambiguous) {
        // prefer an owner in a package the file can reach; ambiguity remains if >1 there
        const r = m.same.filter((h) => reachable.has(h.pkg));
        if (r.length !== 1) return void skipped.ambiguous++;
        m.top = r[0];
      }
      const t = m.top;
      if (!reachable.has(t.pkg)) return void skipped.unreachable++;
      candidates.push({ file: f, pkg: w.name, name, owner: t.owner, key: t.key, ownerPkg: t.pkg, ownerFile: t.file, strStart: strNode.getStart(sf), strEnd: strNode.end, site, isId: t.key === 'id' });
    };
    const visit = (n) => {
      if (ts.isParameter(n) && ts.isIdentifier(n.name) && n.type) consider(n.name, n.type, 'param');
      if (ts.isPropertySignature(n) && n.type && ts.isIdentifier(n.name)) {
        // property of a type literal that is (part of) a parameter annotation
        let p = n.parent;
        if (ts.isTypeLiteralNode(p) && p.parent && ts.isParameter(p.parent)) consider(n.name, n.type, 'destructured-prop');
        else if (process.argv.includes('--all-sites') && (ts.isTypeLiteralNode(p) || ts.isInterfaceDeclaration(p))) consider(n.name, n.type, 'other-type-member');
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
    fileTexts.set(f, text);
  }
}
module.exports = { candidates, skipped, owners, match, barrelExports, resolver, fileTexts };

if (require.main === module) {
  const byPkg = {};
  candidates.forEach((c) => (byPkg[c.pkg] = (byPkg[c.pkg] ?? 0) + 1));
  const byName = {};
  candidates.forEach((c) => { const k = `${c.name} -> ${c.owner}['${c.key}']`; byName[k] = (byName[k] ?? 0) + 1; });
  console.log('owners', owners.length, 'candidates', candidates.length, 'files', new Set(candidates.map((c) => c.file)).size, 'sites', JSON.stringify(candidates.reduce((a, c) => ((a[c.site] = (a[c.site] ?? 0) + 1), a), {})));
  console.log('skipped', skipped, 'id-key', candidates.filter((c) => c.isId).length);
  console.log('by pkg', JSON.stringify(byPkg));
  console.log(Object.entries(byName).sort((a, b) => b[1] - a[1]).slice(0, 40).map((e) => e[1] + ' ' + e[0]).join('\n'));
  fs.mkdirSync(lib.outDir(__dirname), { recursive: true });
  fs.writeFileSync(path.join(lib.outDir(__dirname), 'candidates.json'), JSON.stringify(candidates.map((c) => ({ ...c, file: rel(c.file), ownerFile: rel(c.ownerFile) })), null, 1));
}

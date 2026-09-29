// SD7 (chunk W8): turns one row of item 3's decisions table into the zod expression that replaces a
// `z.unknown()`, plus the contract imports that expression needs. Nothing here touches disk except reads.
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');

const { ROOT, rel } = lib;
const ws = lib.workspaces();
const PRIM = { string: 'z.string()', number: 'z.number()', boolean: 'z.boolean()', null: 'z.null()' };

// every `export const xContract` in a non-test contract file: name -> [{ pkg, file }]
let index = null;
const contractIndex = () => {
  if (index) return index;
  index = new Map();
  for (const w of ws) {
    if (w.isGateway) continue;
    for (const f of lib.walk(path.join(w.dir, 'src'))) {
      if (!/-contract\.ts$/u.test(f)) continue;
      for (const m of fs.readFileSync(f, 'utf8').matchAll(/^export const (\w+Contract)\b/gmu)) {
        if (!index.has(m[1])) index.set(m[1], []);
        index.get(m[1]).push({ pkg: w.name, file: f });
      }
    }
  }
  return index;
};

const depsOf = (w) => ({ ...w.packageJson.dependencies, ...w.packageJson.devDependencies });

// relative imports of `file` (contracts import contracts relatively inside a package)
const relImports = (file) => {
  const t = fs.readFileSync(file, 'utf8');
  const out = [];
  for (const m of t.matchAll(/from '(\.[^']+)'/gu)) {
    const base = path.resolve(path.dirname(file), m[1]);
    for (const c of [base + '.ts', path.join(base, 'index.ts')]) if (fs.existsSync(c)) out.push(c);
  }
  return out;
};
const reaches = (from, target, seen = new Set()) => {
  if (from === target) return true;
  if (seen.has(from)) return false;
  seen.add(from);
  return relImports(from).some((f) => reaches(f, target, seen));
};

const specFor = (siteFile, def) => {
  const sw = lib.workspaceOf(siteFile, ws);
  if (def.pkg === sw.name) {
    let x = path.relative(path.dirname(siteFile), def.file.replace(/\.ts$/u, ''));
    if (!x.startsWith('.')) x = './' + x;
    return x.split(path.sep).join('/');
  }
  return `${def.pkg}/contracts`;
};

// A contract by name, as the site's package can reach it: own package first, then a dependency.
const resolveContract = (name, siteFile, hintPath) => {
  const defs = contractIndex().get(name) ?? [];
  const sw = lib.workspaceOf(siteFile, ws);
  const reach = defs.filter((d) => d.pkg === sw.name || depsOf(sw)[d.pkg]);
  const hinted = hintPath && hintPath.startsWith('packages/') ? reach.filter((d) => rel(d.file) === hintPath) : hintPath ? reach.filter((d) => rel(d.file) === 'packages/' + hintPath) : [];
  const def = (hinted[0] ?? reach.find((d) => d.pkg === sw.name) ?? reach[0]);
  if (!def) return { hand: defs.length ? `${name} is in ${defs.map((d) => d.pkg).join(', ')}, which ${sw.name} does not depend on` : `no contract named ${name}` };
  if (def.pkg !== sw.name) {
    const tw = ws.find((w) => w.name === def.pkg);
    if (!tw.packageJson.exports?.['./contracts']) return { hand: `${def.pkg} has no ./contracts export yet (B03 gives it one)` };
  }
  if (def.file === siteFile) return { hand: `${name} is the contract being edited` };
  if (def.pkg === sw.name && reaches(def.file, siteFile)) return { hand: `import cycle: ${name}'s file already reaches ${rel(siteFile)}` };
  return { def, import: { names: [name], spec: specFor(siteFile, def) } };
};

const conv = (tok, ctx) => {
  tok = tok.trim();
  if (PRIM[tok]) return PRIM[tok];
  let m = tok.match(/^array of (.+)$/u);
  if (m) {
    const inner = conv(m[1], ctx);
    return inner && `z.array(${inner})`;
  }
  if (/^\w+Contract$/u.test(tok)) {
    const r = resolveContract(tok, ctx.file);
    if (r.hand) return (ctx.hand = r.hand), null;
    ctx.imports.push(r.import);
    return tok;
  }
  ctx.hand = `cannot read "${tok}"`;
  return null;
};

// -> { code, imports } | { hand } | { skip }
const expressionFor = (row, siteFile) => {
  const today = row.target.match(/\(today (\w+)\)$/u)?.[1];
  let t = row.target.replace(/\s*\(today \w+\)$/u, '');
  // the named owner does not exist yet: its id is still the standalone `today` contract
  if (today && !contractIndex().has(t.match(/^(\w+Contract)/u)?.[1])) t = today;
  const ctx = { file: siteFile, imports: [], hand: null };
  if (row.decision === 'exception') return { skip: 'the recorded exception' };
  if (row.decision === 'gateway') return { hand: 'gateway schema to create (G20 layout)' };
  if (/one `data` contract per responder/u.test(t)) return { responder: true };
  if (t === 'z.json()') return { code: 'z.json()', imports: [] };
  let m = t.match(/^z\.union\(\[(.+)\]\) branded (\w+)$/u);
  if (m) {
    const parts = m[1].split(/,\s*(?![^(]*\))/u).map((p) => conv(p, ctx));
    return ctx.hand ? { hand: ctx.hand } : { code: `z.union([${parts.join(', ')}]).brand<'${m[2]}'>()`, imports: ctx.imports };
  }
  m = t.match(/^z\.union\(\[(.+)\]\)$/u);
  if (m) {
    const parts = m[1].split(/,\s*(?![^(]*\))/u).map((p) => conv(p, ctx));
    return ctx.hand ? { hand: ctx.hand } : { code: `z.union([${parts.join(', ')}])`, imports: ctx.imports };
  }
  m = t.match(/^(z\.[\w.()]+?\)) branded (\w+)$/u);
  if (m) return { code: `${m[1]}.brand<'${m[2]}'>()`, imports: [] };
  if (/ branded /u.test(t) || t.startsWith('z.object(')) return { hand: `object schema with a brand, written by hand: ${t.slice(0, 70)}` };
  m = t.match(/^z\.array\((\w+Contract)\)$/u);
  if (m) {
    const r = resolveContract(m[1], siteFile, row.targetPath !== '-' ? row.targetPath : null);
    return r.hand ? { hand: r.hand } : { code: `z.array(${m[1]})`, imports: [r.import], array: true };
  }
  m = t.match(/^(\w+Contract)((?:\.shape\.\w+)*)(?: \(minus ([\w, ]+)\))?(?: \(.*\))?$/u);
  if (m) {
    const r = resolveContract(m[1], siteFile, row.targetPath !== '-' ? row.targetPath : null);
    if (r.hand) return { hand: r.hand };
    const omit = m[3] ? `.omit({ ${m[3].split(/,\s*/u).map((k) => `${k}: true`).join(', ')} })` : '';
    return { code: `${m[1]}${m[2]}${omit}`, imports: [r.import] };
  }
  return { hand: `target not readable: ${t.slice(0, 80)}` };
};

// add `names` from `spec` to the file's imports (merged into an existing value import of that spec)
const addImports = (text, file, imports) => {
  const sf = lib.parse(file, text);
  const bySpec = new Map();
  for (const i of imports) bySpec.set(i.spec, [...new Set([...(bySpec.get(i.spec) ?? []), ...i.names])]);
  const edits = [];
  let lastImportEnd = 0;
  for (const st of sf.statements) {
    if (!lib.ts.isImportDeclaration(st)) continue;
    lastImportEnd = st.end;
    const spec = st.moduleSpecifier.text;
    const nb = st.importClause?.namedBindings;
    if (bySpec.has(spec) && nb && lib.ts.isNamedImports(nb) && !st.importClause.isTypeOnly && !st.importClause.name) {
      const have = nb.elements.map((e) => e.getText(sf));
      const names = [...new Set([...have, ...bySpec.get(spec)])].sort();
      edits.push({ start: st.getStart(sf), end: st.end, text: `import { ${names.join(', ')} } from '${spec}';` });
      bySpec.delete(spec);
    }
  }
  if (bySpec.size) {
    const add = [...bySpec].map(([s, n]) => `\nimport { ${n.sort().join(', ')} } from '${s}';`).join('');
    edits.push({ start: lastImportEnd, end: lastImportEnd, text: add });
  }
  return lib.applyEdits(text, edits);
};

module.exports = { expressionFor, addImports, contractIndex, resolveContract, specFor, ws, depsOf };

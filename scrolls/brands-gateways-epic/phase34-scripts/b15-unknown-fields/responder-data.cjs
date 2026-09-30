// SD7 (chunk W8), row 73: `responderResultContract.data` stops being `z.unknown()`.
//
// For every `responderResultContract.parse({ status, data })` in packages/server production code the
// checker types `data`. An `{ error }` site parses through one shared `responderErrorDataContract`; every
// other site's type is printed as zod (a `string & $brand<"X">` becomes the contract carrying that brand,
// an object with a brand becomes its contract, anything else becomes a strict object) into one
// `<responder>-response-data` contract per responder; the site's `data` is wrapped in that contract's
// `.parse(..)`; and `responderResultContract.data` becomes the union of the error contract and every
// generated one. Strict objects, so a union member never strips a key another member carries.
//
// What it does not write: the `.stub.ts` and `-contract.test.ts` each new contract needs (listed in
// out/responder-data-todo.txt), and any shape that prints `unknown`, a bare `{}`, a function or a class
// (out to leftovers with the reason).
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');
const G = require('./gen.cjs');

const { ts, ROOT, rel } = lib;
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/gu, '$1-$2').toLowerCase();
const camel = (s) => s[0].toLowerCase() + s.slice(1);

class Unprintable extends Error {}

const brandIndex = () => {
  const map = new Map();
  for (const [name, defs] of G.contractIndex()) {
    for (const d of defs) {
      const t = fs.readFileSync(d.file, 'utf8');
      const m = t.match(new RegExp(`export const ${name}\\s*=([\\s\\S]*?);\\n`, 'u'));
      const b = m?.[1].match(/\.brand<'(\w+)'>\(\)\s*(?:\.describe\([^)]*\))?\s*$/u);
      if (b && !map.has(b[1])) map.set(b[1], name);
    }
  }
  return map;
};

const measure = ({ pkgDir = path.join(ROOT, 'packages/server'), overlay = new Map() } = {}) => {
  const { service, fileNames } = lib.makeLanguageService(pkgDir, new Map([...overlay].map(([f, t]) => [f, { v: 1, text: t }])));
  const prog = service.getProgram();
  const chk = prog.getTypeChecker();
  const sites = [];
  for (const f of fileNames) {
    if (lib.isTestSupport(f) || !f.includes('/src/responders/')) continue;
    const sf = prog.getSourceFile(f);
    if (!sf) continue;
    const visit = (n) => {
      if (ts.isCallExpression(n) && n.expression.getText(sf) === 'responderResultContract.parse' && n.arguments[0] && ts.isObjectLiteralExpression(n.arguments[0])) {
        const dp = n.arguments[0].properties.find((p) => (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) && p.name.getText(sf) === 'data');
        if (dp) {
          const node = ts.isShorthandPropertyAssignment(dp) ? dp.name : dp.initializer;
          sites.push({ file: f, sf, dp, node, type: chk.getTypeAtLocation(node), line: sf.getLineAndCharacterOfPosition(dp.getStart()).line + 1 });
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
  return { sites, chk, prog };
};

const printer = (chk, brands, siteFile) => {
  const imports = [];
  const notes = [];
  const needContract = (name) => {
    const r = G.resolveContract(name, siteFile);
    if (r.hand) throw new Unprintable(r.hand);
    imports.push(r.import);
    return name;
  };
  const brandOf = (t) => {
    const p = t.getProperties().find((x) => x.name.startsWith('__@$brand'));
    if (!p) return null;
    const bt = chk.getTypeOfSymbol(p);
    return bt.getProperties().map((x) => x.name)[0] ?? null;
  };
  const print = (t, depth = 0) => {
    if (depth > 8) throw new Unprintable('nested too deep');
    if (t.flags & ts.TypeFlags.Any || t.flags & ts.TypeFlags.Unknown) throw new Unprintable('unknown or any inside the data');
    if (t.flags & ts.TypeFlags.StringLiteral) return `z.literal(${JSON.stringify(t.value)})`;
    if (t.flags & ts.TypeFlags.Boolean || t.flags & ts.TypeFlags.BooleanLiteral) return 'z.boolean()';
    if (t.flags & ts.TypeFlags.String) return (notes.push('plain string'), 'z.string()');
    if (t.flags & ts.TypeFlags.Number) return (notes.push('plain number'), 'z.number()');
    if (t.flags & ts.TypeFlags.Null) return 'z.null()';
    if (t.isUnion()) {
      const parts = t.types.filter((x) => !(x.flags & (ts.TypeFlags.Undefined)));
      const hasNull = parts.some((x) => x.flags & ts.TypeFlags.Null);
      const rest = parts.filter((x) => !(x.flags & ts.TypeFlags.Null));
      // boolean is `true | false`
      if (rest.length && rest.every((x) => x.flags & ts.TypeFlags.BooleanLiteral)) return hasNull ? 'z.boolean().nullable()' : 'z.boolean()';
      if (rest.length && rest.every((x) => x.flags & ts.TypeFlags.StringLiteral)) {
        const e = `z.enum([${rest.map((x) => JSON.stringify(x.value)).join(', ')}])`;
        return hasNull ? `${e}.nullable()` : e;
      }
      const inner = rest.length === 1 ? print(rest[0], depth + 1) : `z.union([${rest.map((x) => print(x, depth + 1)).join(', ')}])`;
      return hasNull ? `${inner}.nullable()` : inner;
    }
    if (t.isIntersection()) {
      const b = t.types.map((x) => brandOf(x) ?? (x.getProperties().length === 1 && x.getProperties()[0].name.startsWith('__@$brand') ? chk.getTypeOfSymbol(x.getProperties()[0]).getProperties()[0]?.name : null)).find(Boolean);
      const base = t.types.find((x) => x.flags & (ts.TypeFlags.String | ts.TypeFlags.Number));
      if (b && base) {
        const owner = brands.get(b);
        if (owner) return needContract(owner);
        notes.push(`inline brand ${b}`);
        return `${base.flags & ts.TypeFlags.String ? 'z.string()' : 'z.number()'}.brand<'${b}'>()`;
      }
      // `{ .. } & $brand<'X'>`: the object part carries the fields, the brand part its name
      const objs = t.types.filter((x) => x.flags & ts.TypeFlags.Object && x.getProperties().some((p) => !p.name.startsWith('__@')));
      if (b && objs.length === 1) {
        const owner = brands.get(b);
        if (owner) return needContract(owner);
        const inner = print(objs[0], depth + 1);
        return inner.startsWith('z.strictObject') && !inner.includes(').brand<') ? `${inner}.brand<'${b}'>()` : inner;
      }
      throw new Unprintable(`intersection ${chk.typeToString(t).slice(0, 60)}`);
    }
    if (chk.isArrayType(t) || chk.isTupleType?.(t) || (t.symbol?.name === 'ReadonlyArray')) {
      const el = chk.getTypeArguments(t)[0];
      if (!el) throw new Unprintable('array without element type');
      return `z.array(${print(el, depth + 1)})`;
    }
    if (t.flags & ts.TypeFlags.Object) {
      if (t.getCallSignatures().length) throw new Unprintable('function');
      const b = brandOf(t);
      if (b && brands.get(b)) return needContract(brands.get(b));
      const props = t.getProperties().filter((p) => !p.name.startsWith('__@'));
      if (!props.length) throw new Unprintable('object with no known keys ({} / record)');
      const decl = t.symbol?.declarations?.[0];
      if (decl && (ts.isClassDeclaration(decl) || /Map|Set|Date|Error/u.test(t.symbol.name))) throw new Unprintable(`class ${t.symbol.name}`);
      const fields = props.map((p) => {
        const pt = chk.getTypeOfSymbol(p);
        const optional = !!(p.flags & ts.SymbolFlags.Optional);
        let code = print(pt, depth + 1);
        if (optional) code += '.optional()';
        return `${/^[A-Za-z_$][\w$]*$/u.test(p.name) ? p.name : JSON.stringify(p.name)}: ${code}`;
      });
      const nb = b ? `.brand<'${b}'>()` : '';
      return `z.strictObject({ ${fields.join(', ')} })${nb}`;
    }
    throw new Unprintable(`type ${chk.typeToString(t).slice(0, 60)}`);
  };
  return { print, imports, notes };
};

const isErrorOnly = (t) => {
  const ps = t.getProperties();
  return ps.length === 1 && ps[0].name === 'error';
};

// -> { overlay: Map(file -> text), leftovers: [], todo: [] }
const plan = ({ overlay: parentOverlay = new Map(), exclude = new Set() } = {}) => {
  const serverDir = path.join(ROOT, 'packages/server');
  const { sites, chk } = measure({ overlay: parentOverlay });
  const brands = brandIndex();
  const overlay = new Map();
  const leftovers = [];
  const todo = [];
  const byFile = new Map();
  const groups = new Map(); // responder file -> [files it wrote]
  for (const s of sites.filter((x) => !exclude.has(rel(x.file)))) (byFile.get(s.file) ?? byFile.set(s.file, []).get(s.file)).push(s);

  const contractsDir = path.join(serverDir, 'src/contracts');
  const errFile = path.join(contractsDir, 'responder-error-data/responder-error-data-contract.ts');
  const generated = []; // { name (const), file }
  const edits = new Map();

  for (const [file, ss] of byFile) {
    const text = fs.readFileSync(file, 'utf8');
    const respName = (text.match(/export const (\w+Responder)\b/u) ?? [])[1];
    if (!respName) {
      leftovers.push({ n: 73, file: rel(file), field: 'data', decision: 'responder', reason: 'no exported Responder const' });
      continue;
    }
    const base = respName.replace(/Responder$/u, '') + 'ResponseData';
    const cname = camel(base) + 'Contract';
    const succ = ss.filter((s) => !isErrorOnly(s.type));
    const errs = ss.filter((s) => isErrorOnly(s.type));
    const codes = [];
    const pr = printer(chk, brands, path.join(contractsDir, kebab(base), `${kebab(base)}-contract.ts`));
    const bad = [];
    for (const s of succ) {
      try {
        const c = pr.print(s.type);
        s.code = c;
        if (!codes.includes(c)) codes.push(c);
      } catch (e) {
        if (!(e instanceof Unprintable)) throw e;
        bad.push(s);
        leftovers.push({ n: 73, file: rel(file), field: `data@${s.line}`, decision: 'responder', reason: e.message });
      }
    }
    const good = succ.filter((s) => !bad.includes(s));
    const fileEdits = [];
    const needs = [];
    for (const s of errs) {
      needs.push({ names: ['responderErrorDataContract'], spec: relSpec(file, errFile) });
      fileEdits.push(wrap(s, 'responderErrorDataContract'));
    }
    if (good.length && codes.length === 1 && /^\w+Contract$/u.test(codes[0])) {
      // the data already has a contract of its own: wrap in that, write nothing
      const own = G.resolveContract(codes[0], file);
      if (own.hand) leftovers.push({ n: 73, file: rel(file), field: 'data', decision: 'responder', reason: own.hand });
      else {
        needs.push(own.import);
        generated.push({ name: codes[0], file: own.def.file, existing: true, pkg: own.def.pkg });
        for (const s of good) fileEdits.push(wrap(s, codes[0]));
      }
    } else if (good.length) {
      // one contract per distinct shape; one file for the responder
      const members = codes.map((c, i) => (c.includes('.brand<') && c.startsWith('z.strictObject') ? c : c.startsWith('z.strictObject') ? `${c}.brand<'${base}${codes.length > 1 ? i + 1 : ''}'>()` : c));
      const body = members.length === 1 ? members[0] : `z.union([${members.join(', ')}])`;
      const cfile = path.join(contractsDir, kebab(base), `${kebab(base)}-contract.ts`);
      const impNames = pr.imports;
      const impText = mergeImports(impNames);
      overlay.set(
        cfile,
        `/**\n * PURPOSE: Defines the \`data\` ${respName} returns on success\n *\n * USAGE:\n * const data = ${cname}.parse(value);\n * // Returns validated ${base}\n */\n\nimport { z } from '${lib.ZOD_SPEC}';\n${impText}\nexport const ${cname} = ${body};\n\nexport type ${base} = z.infer<typeof ${cname}>;\n`,
      );
      generated.push({ name: cname, file: cfile });
      todo.push(`${rel(cfile)}: needs ${kebab(base)}.stub.ts and ${kebab(base)}-contract.test.ts${pr.notes.length ? ` (${[...new Set(pr.notes)].join('; ')})` : ''}`);
      needs.push({ names: [cname], spec: relSpec(file, cfile) });
      for (const s of good) fileEdits.push(wrap(s, cname));
    }
    if (!fileEdits.length) continue;
    let out = lib.applyEdits(text, fileEdits);
    out = G.addImports(out, file, needs);
    overlay.set(file, out);
    groups.set(rel(file), [file, ...(good.length && !generated.at(-1)?.existing ? [generated.at(-1).file] : [])]);
  }

  // the shared error contract and the base union
  overlay.set(
    errFile,
    `/**\n * PURPOSE: Defines the \`data\` a responder returns when it fails\n *\n * USAGE:\n * const data = responderErrorDataContract.parse({ error: 'Invalid params' });\n * // Returns { error } with a branded message\n */\n\nimport { z } from '${lib.ZOD_SPEC}';\n\nexport const responderErrorDataContract = z\n  .strictObject({ error: z.string().brand<'ResponderErrorMessage'>() })\n  .brand<'ResponderErrorData'>();\n\nexport type ResponderErrorData = z.infer<typeof responderErrorDataContract>;\n`,
  );
  todo.push(`${rel(errFile)}: needs responder-error-data.stub.ts and responder-error-data-contract.test.ts`);
  const baseFile = path.join(contractsDir, 'responder-result/responder-result-contract.ts');
  const members = ['responderErrorDataContract', ...new Set(generated.map((g) => g.name))];
  const impText = mergeImports([{ names: ['responderErrorDataContract'], spec: relSpec(baseFile, errFile) }, ...generated.map((g) => ({ names: [g.name], spec: g.existing ? G.resolveContract(g.name, baseFile).import?.spec : relSpec(baseFile, g.file) }))]);
  const baseText = fs.readFileSync(baseFile, 'utf8').replace('data: z.unknown(),', `data: z.union([${members.join(', ')}]),`);
  overlay.set(baseFile, G.addImports(baseText, baseFile, [{ names: [], spec: '' }].slice(0, 0)).replace(`import { z } from '${lib.ZOD_SPEC}';\n`, `import { z } from '${lib.ZOD_SPEC}';\n${impText}`));
  return { overlay, leftovers, todo, groups, baseFile, errFile, generated };
};

const relSpec = (from, to) => {
  let x = path.relative(path.dirname(from), to.replace(/\.ts$/u, ''));
  if (!x.startsWith('.')) x = './' + x;
  return x.split(path.sep).join('/');
};
const mergeImports = (imports) => {
  const by = new Map();
  for (const i of imports) by.set(i.spec, [...new Set([...(by.get(i.spec) ?? []), ...i.names])]);
  return [...by].map(([s, n]) => `import { ${n.sort().join(', ')} } from '${s}';`).join('\n') + (by.size ? '\n' : '');
};
const wrap = (s, cname) => {
  const sf = s.sf;
  if (ts.isShorthandPropertyAssignment(s.dp)) return { start: s.dp.getStart(sf), end: s.dp.end, text: `data: ${cname}.parse(${s.node.getText(sf)})` };
  return { start: s.node.getStart(sf), end: s.node.end, text: `${cname}.parse(${s.node.getText(sf)})` };
};

module.exports = { plan, measure };

if (require.main === module) {
  const out = plan();
  const n = [...out.overlay.keys()].length;
  console.log(`${n} files (${out.todo.length} new contracts); ${out.leftovers.length} leftovers`);
  for (const l of out.leftovers) console.log(' ', l.file.split('/').slice(-1)[0], l.field, l.reason);
  const sample = process.argv.find((a) => a.startsWith('--sample-out='))?.slice(13);
  if (sample)
    for (const [f, t] of out.overlay) {
      const d = path.join(path.resolve(ROOT, sample), rel(f));
      fs.mkdirSync(path.dirname(d), { recursive: true });
      fs.writeFileSync(d, t);
    }
  fs.mkdirSync(lib.outDir(__dirname), { recursive: true });
  fs.writeFileSync(path.join(lib.outDir(__dirname), 'responder-data-todo.txt'), out.todo.join('\n') + '\n');
}

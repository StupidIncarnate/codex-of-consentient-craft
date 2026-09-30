// B14 (SD6, chunk W7): every ad-hoc object shape that can leave a module-level function, alias, variable or type
// argument becomes a zod contract branded per B1/B3, with its stub and contract test, and the declaration is
// rewritten to name it: the return type / alias / variable type / type argument becomes the contract's type, every
// returned object goes through `<name>Contract.parse(..)`.
//
//   alias      `type X = { .. }`          -> alias removed; functions annotated with it parse their returns
//   return     `(): { .. } => ..`         -> `(): X => ..`, each `return e` becomes `return xContract.parse(e)`
//   variable   `const s: { .. } = { .. }` -> `const s: X = xContract.parse({ .. })`
//   typearg    `new Map<K, { .. }>()`     -> `new Map<K, X>()`
//
// What it will not touch, each listed with its reason in out/leftovers.txt: method sets (all members functions,
// left alone by B9), shapes that mix data and functions, `unknown`/`any` members, types with no contract
// (`type-ref:X`), a boolean or always-true single fact (the item's `Promise<boolean>` rule: callers and tests
// change with it, so a person does it), an exported alias (its importers must be re-pointed), a name it cannot
// make unique, and any shape whose rewrite adds a TypeScript diagnostic anywhere in its package or a package that
// depends on it (the gate).
//
// Usage (from the repo root, or pass --root=DIR; settings in lib/port-config.cjs):
//   node scrolls/brands-gateways-epic/phase34-scripts/b14-shape-contracts/run.cjs [pkg ...] [--sample-out=dir] [--no-gate] [--census] [apply]
// Default is a dry run: counts per package, out/leftovers.txt, out/leftovers.json, out/generated.json.
// `--sample-out` writes every new and changed file under <dir>/<repo path> for lib/verify-sample.cjs.
// `apply` writes packages/ (do not, until the operator says so).
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');
const S = require('./shapes.cjs');

const { ts, ROOT, rel } = lib;
const { pascal, camel, kebab, q, GATEWAY_TYPES } = S;
const args = process.argv.slice(2);
const flag = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const doApply = args.includes('apply');
const noGate = args.includes('--no-gate');
const censusOnly = args.includes('--census');
const sampleOut = flag('sample-out');
const pkgFilter = args.filter((a) => !a.startsWith('--') && a !== 'apply');
const outDir = lib.outDir(__dirname);
fs.mkdirSync(outDir, { recursive: true });

const relSpec = (fromFile, toFileNoExt) => {
  let x = path.relative(path.dirname(fromFile), toFileNoExt);
  if (!x.startsWith('.')) x = './' + x;
  return x.split(path.sep).join('/');
};

// ---------- names: unique across the repo (C8), derived from where the shape lives ----------
const SUFFIX = /(Broker|Transformer|Responder|Guard|Binding|State|Flow|Adapter|Middleware|Startup)$/u;
const GENERIC = new Set(['state', 'cache', 'pending', 'internalState', 'value', 'data']);
const candidateNames = (s) => {
  const nm = pascal(s.name);
  const file = pascal(s.fileBase);
  const stripped = pascal(nm.replace(SUFFIX, ''));
  const pure = s.ft === 'transformers' || s.ft === 'guards';
  if (s.kind === 'alias') return [nm, file + nm, file + nm + 'Shape'];
  if (s.kind === 'return') return [pure ? stripped : stripped + 'Result', nm + 'Result', stripped + 'Output', nm + 'Output', file + 'Result'];
  const own = GENERIC.has(s.name) ? [] : [nm];
  const withFile = GENERIC.has(s.name) && /State$/u.test(file) ? file : file + nm;
  return [...own, withFile, withFile + 'Shape'];
};
const contractKeys = (file, constName) => {
  const sf = lib.parse(file);
  let keys = null;
  const visit = (n) => {
    if (keys) return;
    if (ts.isCallExpression(n) && n.expression.getText(sf).endsWith('z.object') && n.arguments[0] && ts.isObjectLiteralExpression(n.arguments[0]))
      keys = n.arguments[0].properties.map((p) => p.name?.getText(sf).replace(/^'|'$/gu, '')).sort().join(',');
    else ts.forEachChild(n, visit);
  };
  for (const st of sf.statements)
    if (ts.isVariableStatement(st) && st.declarationList.declarations.some((d) => d.name.getText(sf) === constName)) visit(st);
  return keys;
};
const shapeKeys = (s, sp) => {
  if (sp.rest.length !== 1 || !ts.isTypeLiteralNode(sp.rest[0])) return null;
  return sp.rest[0].members.map((m) => m.name?.getText(s.sf).replace(/^'|'$/gu, '')).sort().join(',');
};
const usedNames = new Set();
const nameTaken = (s, n) =>
  S.typeIndex.has(n) || S.contractNames.has(camel(n) + 'Contract') || S.contractDirs.has(kebab(n)) || usedNames.has(n) ||
  s.fileImports.has(n) || (s.localAliases.has(n) && !(s.kind === 'alias' && s.name === n));
const chooseName = (s, sp) => {
  const cands = candidateNames(s);
  for (const n of cands) {
    if (S.typeIndex.has(n) && !usedNames.has(n)) {
      // the same package already has a contract of this name over the same keys: name it instead of writing a twin
      const same = S.typeIndex.get(n).find((c) => c.pkg === s.pkg);
      const want = shapeKeys(s, sp);
      if (same && want && contractKeys(same.file, same.contractConst) === want) return { reuse: same, name: n };
    }
    if (!nameTaken(s, n)) return { name: n };
  }
  return null;
};

// ---------- source edits ----------
const wrapReturn = (e, nullable, sf, cname, edits) => {
  let x = e;
  while (ts.isParenthesizedExpression(x)) x = x.expression;
  if (x.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(x) && x.text === 'undefined')) return;
  if (ts.isConditionalExpression(x)) {
    wrapReturn(x.whenTrue, nullable, sf, cname, edits);
    wrapReturn(x.whenFalse, nullable, sf, cname, edits);
    return;
  }
  // a nullable return that is not an object literal may be null at run time; the gate judges its type
  if (nullable && !ts.isObjectLiteralExpression(x)) return;
  edits.push({ start: x.getStart(sf), end: x.end, text: `${cname}.parse(${x.getText(sf)})` });
};
const returnEdits = (fn, sp, sf, cname) => {
  const isAsync = !!fn.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword);
  if (sp.promise && !isAsync) return { bail: 'non-async function returning Promise' };
  const nullable = sp.nullable || sp.optional;
  const edits = [];
  if (!ts.isBlock(fn.body)) wrapReturn(fn.body, nullable, sf, cname, edits);
  else {
    const visit = (n) => {
      if (n !== fn && ts.isFunctionLike(n)) return;
      if (ts.isReturnStatement(n) && n.expression) wrapReturn(n.expression, nullable, sf, cname, edits);
      ts.forEachChild(n, visit);
    };
    ts.forEachChild(fn.body, visit);
  }
  return { edits };
};
const typeReplacement = (sp, base) => base + (sp.nullable ? ' | null' : '') + (sp.optional ? ' | undefined' : '');
const mentions = (typeNode, name, sf) => {
  let hit = false;
  const v = (n) => {
    if (hit) return;
    if (ts.isTypeReferenceNode(n) && n.typeName.getText(sf) === name) hit = true;
    else ts.forEachChild(n, v);
  };
  v(typeNode);
  return hit;
};
const leadingCommentStart = (text, node, sf) => {
  const r = ts.getLeadingCommentRanges(text, node.getFullStart());
  return r?.length ? r[0].pos : node.getStart(sf);
};

const identifierCounts = (sf) => {
  const m = new Map();
  const v = (n) => {
    if (ts.isImportDeclaration(n)) return;
    if (ts.isIdentifier(n)) m.set(n.text, (m.get(n.text) ?? 0) + 1);
    ts.forEachChild(n, v);
  };
  sf.statements.forEach(v);
  return m;
};
// Drops an import specifier, or a non-exported type alias, that the rewrite left unused (used before, unused now).
const dropUnused = (abs, before, after) => {
  const sfB = lib.parse(abs, before);
  const sf = lib.parse(abs, after);
  const cb = identifierCounts(sfB);
  const ca = identifierCounts(sf);
  const dead = (nm) => (cb.get(nm) ?? 0) > 0 && (ca.get(nm) ?? 0) === 0;
  const edits = [];
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings) && !st.importClause.name) {
      const els = st.importClause.namedBindings.elements;
      const keep = els.filter((e) => !dead(e.name.text));
      if (keep.length === els.length) continue;
      if (!keep.length) {
        const le = after.indexOf('\n', st.end);
        edits.push({ start: st.getStart(sf), end: le === -1 ? st.end : le + 1, text: '' });
      } else edits.push({ start: st.getStart(sf), end: st.end, text: `import${st.importClause.isTypeOnly ? ' type' : ''} { ${keep.map((e) => e.getText(sf)).join(', ')} } from ${st.moduleSpecifier.getText(sf)};` });
    }
    if (ts.isTypeAliasDeclaration(st) && !st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) && (ca.get(st.name.text) ?? 0) === 1 && (cb.get(st.name.text) ?? 0) > 1) {
      const le = after.indexOf('\n', st.end);
      edits.push({ start: leadingCommentStart(after, st, sf), end: le === -1 ? st.end : le + 1, text: '' });
    }
  }
  return lib.applyEdits(after, edits);
};

// ---------- stub, contract and test text ----------
const stubLits = (() => {
  let m = null;
  return (name) => {
    if (!m) {
      m = new Map();
      for (const w of S.ws) {
        if (w.isGateway) continue;
        for (const f of lib.walk(path.join(w.dir, 'src'))) {
          if (!/\.(test|stub|proxy)\.tsx?$/u.test(f)) continue;
          for (const x of fs.readFileSync(f, 'utf8').matchAll(/\b([A-Z]\w*)Stub\(\{ value: ('[^'\n]*'|-?\d+) \}\)/gu)) if (!m.has(x[1])) m.set(x[1], x[2]);
        }
      }
    }
    return m.get(name);
  };
})();
const stubNeedsValue = (r) => {
  const stubFile = r.file.replace(/-contract\.ts$/u, '.stub.ts');
  if (!fs.existsSync(stubFile)) return false;
  return !/=\s*\{\}\s*\)|= \{\}\):|\?:/u.test(fs.readFileSync(stubFile, 'utf8').split('=>')[0]);
};
const makeSample = (s, p) => {
  const refs = [...p.refs.values()];
  const sample = (t) => {
    if (ts.isParenthesizedTypeNode(t)) return sample(t.type);
    switch (t.kind) {
      case ts.SyntaxKind.StringKeyword: return "'sample'";
      case ts.SyntaxKind.NumberKeyword: return '0';
      case ts.SyntaxKind.BooleanKeyword: return 'false';
      default:
    }
    if (ts.isLiteralTypeNode(t)) return t.literal.kind === ts.SyntaxKind.NullKeyword ? 'null' : t.literal.getText();
    if (ts.isTupleTypeNode(t)) return `[${t.elements.map(sample).join(', ')}]`;
    if (ts.isArrayTypeNode(t) || ts.isTypeOperatorNode(t)) return '[]';
    if (ts.isTypeReferenceNode(t)) {
      const n = t.typeName.getText(s.sf);
      const a = t.typeArguments ?? [];
      if (n === 'Array' || n === 'ReadonlyArray') return '[]';
      if (n === 'Record') return '{}';
      if (n === 'Map' || n === 'ReadonlyMap') return 'new Map()';
      if (n === 'Set' || n === 'ReadonlySet') return 'new Set()';
      if (n === 'Readonly' || n === 'NonNullable') return sample(a[0]);
      if (GATEWAY_TYPES[n] && (['Error', 'Uint8Array', 'Buffer'].includes(n) || s.fileImports.has(n))) {
        if (!GATEWAY_TYPES[n].sample) throw new Error(`no sample value for ${n}`);
        return GATEWAY_TYPES[n].sample;
      }
      const local = s.localAliases.get(n);
      if (local && !refs.some((x) => x.type === n)) return sample(local.type);
      const r = refs.find((x) => x.type === n);
      if (r && stubNeedsValue(r)) {
        const lit = stubLits(n);
        return lit ? `${n}Stub({ value: ${lit} })` : `${n}Stub()`;
      }
      return `${n}Stub()`;
    }
    if (ts.isIndexedAccessTypeNode(t) && ts.isTypeReferenceNode(t.objectType)) return `${t.objectType.typeName.getText(s.sf)}Stub().${t.indexType.literal.text}`;
    if (ts.isUnionTypeNode(t)) {
      const rest = t.types.filter((x) => !S.isNullKw(x) && !S.isUndefKw(x));
      return sample(rest[0]);
    }
    if (ts.isTypeLiteralNode(t)) return `{ ${t.members.filter((m) => !m.questionToken).map((m) => `${m.name.getText(s.sf)}: ${sample(m.type)}`).join(', ')} }`;
    return 'undefined';
  };
  return sample;
};
const stubFor = (s, p, base, cname, cfile, refsAll) => {
  const sample = makeSample(s, p);
  const sp = p.split;
  const one = sp.rest.length === 1 ? sp.rest[0] : null;
  const objs = sp.rest.filter((x) => ts.isTypeLiteralNode(x));
  const isObj = objs.length === sp.rest.length && objs.length > 0;
  let body;
  if (isObj) body = sample(objs[0]);
  else if (one && (ts.isArrayTypeNode(one) || ts.isTypeOperatorNode(one))) body = '[]';
  else if (one && ts.isTypeReferenceNode(one) && /^(Map|ReadonlyMap)$/u.test(one.typeName.getText(s.sf))) body = 'new Map()';
  else if (one && ts.isTypeReferenceNode(one) && /^(Set|ReadonlySet)$/u.test(one.typeName.getText(s.sf))) body = 'new Set()';
  else if (one && ts.isTypeReferenceNode(one) && one.typeName.getText(s.sf) === 'Record') body = '{}';
  else body = sample(one ?? sp.rest[0]);
  const specFor = (r) => (r.pkg === s.pkg ? relSpec(cfile, r.file.replace(/-contract\.ts$/u, '.stub')) : `${r.pkg}/${path.relative(path.join(S.ws.find((w) => w.name === r.pkg).dir, 'src'), r.file).replace(/-contract\.ts$/u, '.stub').split(path.sep).join('/')}`);
  const bySpec = new Map();
  for (const r of refsAll) if (new RegExp(`\\b${r.type}Stub\\b`, 'u').test(body)) (bySpec.get(specFor(r)) ?? bySpec.set(specFor(r), []).get(specFor(r))).push(`${r.type}Stub`);
  const withProps = (b) => (/^\{\s*\}$/u.test(b) ? '{ ...props }' : b.replace(/\s*\}$/u, ', ...props }'));
  const kb = kebab(base);
  const stubText = `/**\n * PURPOSE: Builds a valid ${base} for tests\n *\n * USAGE:\n * ${base}Stub();\n * // Returns a valid ${base}\n */\n${isObj && objs.length === 1 ? "import type { StubArgument } from '@dungeonmaster/shared/@types';\n" : ''}${[...bySpec].map(([sp2, names]) => `import { ${[...new Set(names)].join(', ')} } from '${sp2}';`).join('\n')}\n\nimport { ${cname} } from './${kb}-contract';\nimport type { ${base} } from './${kb}-contract';\n\nexport const ${base}Stub = (${isObj && objs.length === 1 ? `{ ...props }: StubArgument<${base}> = {}` : ''}): ${base} =>\n  ${cname}.parse(${isObj && objs.length === 1 ? withProps(body) : body});\n`;
  const first = objs[0]?.members[0];
  const firstName = first ? first.name.getText(s.sf) : null;
  const bad = first?.type && (first.type.kind === ts.SyntaxKind.BooleanKeyword || first.type.kind === ts.SyntaxKind.NumberKeyword) ? "'nope'" : '123';
  const invalid = firstName
    ? `it('INVALID: {${firstName}: wrong type} => throws', () => {\n      expect(() => ${cname}.parse({ ...${base}Stub(), ${firstName}: ${bad} })).toThrow(/expected|invalid/iu);\n    });`
    : `it('INVALID: {value: wrong type} => throws', () => {\n      expect(() => ${cname}.parse(123)).toThrow(/expected|invalid/iu);\n    });`;
  const testText = `import { ${base}Stub } from './${kb}.stub';\nimport { ${cname} } from './${kb}-contract';\n\ndescribe('${cname}', () => {\n  describe('valid inputs', () => {\n    it('VALID: {stub} => parses successfully', () => {\n      const stub = ${base}Stub();\n\n      expect(${cname}.parse(stub)).toStrictEqual(stub);\n    });\n  });\n\n  describe('invalid inputs', () => {\n    ${invalid}\n  });\n});\n`;
  return { stubText, testText };
};
const purposeOf = (s, base) =>
  s.kind === 'alias' ? `Defines the ${base} shape that ${s.fileBase} builds` : s.kind === 'return' ? `Defines the data \`${s.name}\` returns` : s.kind === 'variable' ? `Defines the data held by \`${s.name}\` in ${s.fileBase}` : `Defines the value type \`${s.name}\` holds in ${s.fileBase}`;

// ---------- one shape ----------
const gatewayFiles = (name, pkg) => {
  const g = GATEWAY_TYPES[name];
  const kind = S.gatewayKind(pkg);
  const dir = path.join(ROOT, lib.GATEWAY_DIR, kind, 'src', g.sub);
  const schemaFile = path.join(dir, `${g.file}.ts`);
  const barrel = path.join(dir, `${g.sub}.ts`);
  return [
    [schemaFile, `/**\n * PURPOSE: The one real runtime check for a \`${name}\` value, branded \`'${g.brand}'\` so every contract that holds one shares this check (BR C9)\n *\n * USAGE:\n * ${g.schema}.parse(${g.sample});\n * // Returns the same value, typed as ${name} & branded '${g.brand}'\n */\nimport { z } from 'zod';\n\nexport const ${g.schema} = z.instanceof(${g.ctor}).brand<'${g.brand}'>();\n`],
    [barrel, `/**\n * PURPOSE: Reaches the ${name} global's schema through the gateway\n *\n * USAGE:\n * import { ${g.schema} } from '${lib.GW}${kind}/${g.sub}';\n */\n\nexport { ${g.schema} } from './${g.file}';\n`],
  ];
};


// Every file that imports `name` from `aliasFile` (through the resolver, so barrels do not match): the import
// statement to rewrite. A re-export of the name, or an importer in another package, sends the shape to a person.
const importerCache = new Map();
const allSourceFiles = () => {
  if (!importerCache.has('files'))
    importerCache.set('files', S.ws.filter((w) => !w.isGateway).flatMap((w) => ['src', 'test', 'e2e'].flatMap((d) => lib.walk(path.join(w.dir, d)))).filter((f) => /\.tsx?$/u.test(f)));
  return importerCache.get('files');
};
const resolverFn = lib.makeResolver();
const findImporters = (aliasFile, name, pkg) => {
  const out = [];
  for (const f of allSourceFiles()) {
    if (f === aliasFile) continue;
    const text = fs.readFileSync(f, 'utf8');
    if (!text.includes(name)) continue;
    const sf = lib.parse(f, text);
    for (const st of sf.statements) {
      if (ts.isExportDeclaration(st) && st.moduleSpecifier && st.exportClause && ts.isNamedExports(st.exportClause) && st.exportClause.elements.some((e) => (e.propertyName ?? e.name).text === name)) {
        const r = resolverFn(st.moduleSpecifier.text, f);
        if (r && path.resolve(r) === path.resolve(aliasFile)) return { bail: `re-exported from ${rel(f)}` };
      }
      if (!ts.isImportDeclaration(st) || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings)) continue;
      const els = st.importClause.namedBindings.elements;
      if (!els.some((e) => (e.propertyName ?? e.name).text === name)) continue;
      const r = resolverFn(st.moduleSpecifier.text, f);
      if (!r || path.resolve(r) !== path.resolve(aliasFile)) continue;
      if (lib.workspaceOf(f, S.ws)?.name !== pkg) return { bail: `imported from another package (${rel(f)})` };
      if (els.some((e) => e.propertyName)) return { bail: `aliased import in ${rel(f)}` };
      out.push({ file: f, sf, st, els });
    }
  }
  return { out };
};

// Plans one shape: the contract, stub and test files, and the edits to its source file (positions in the original
// text). Returns { ok:false, reason } for a shape it will not write.
const planShape = (s, ctxFile) => {
  const probe = S.printShape(s, 'Probe', { localShapes: ctxFile.localShapes });
  if (!probe.ok) return { ok: false, reason: probe.reason };
  const sp = probe.split;
  const one = sp.rest.length === 1 && ts.isTypeLiteralNode(sp.rest[0]) && sp.rest[0].members.length === 1 && s.kind === 'return' ? sp.rest[0].members[0] : null;
  if (one?.type) {
    if (one.type.kind === ts.SyntaxKind.BooleanKeyword) return { ok: false, reason: 'one-fact-boolean (return the boolean: Promise<boolean>; callers and tests change)' };
    if (ts.isLiteralTypeNode(one.type) && one.type.literal.kind === ts.SyntaxKind.TrueKeyword) return { ok: false, reason: 'always-true-single-fact (B18 split b / R1: nothing to check)' };
  }
  const chosen = chooseName(s, sp);
  if (!chosen) return { ok: false, reason: 'no-unique-name' };
  const base = chosen.name;
  const p = S.printShape(s, base, { localShapes: ctxFile.localShapes });
  if (!p.ok) return { ok: false, reason: p.reason };
  const w = S.ws.find((x) => x.name === s.pkg);
  const dir = chosen.reuse ? path.dirname(chosen.reuse.file) : path.join(w.dir, 'src/contracts', kebab(base));
  const cfile = chosen.reuse ? chosen.reuse.file : path.join(dir, `${kebab(base)}-contract.ts`);
  const cname = chosen.reuse ? chosen.reuse.contractConst : camel(base) + 'Contract';
  const refsAll = [...p.refs].map(([c, r]) => ({ ...r, contractConst: c }));
  for (const n of p.locals) refsAll.push({ type: ctxFile.localShapes.get(n).type, file: ctxFile.localShapes.get(n).file, pkg: s.pkg, contractConst: ctxFile.localShapes.get(n).const });
  const text = fs.readFileSync(s.file, 'utf8');
  const sf = s.sf;
  const edits = [];
  const otherEdits = [];
  const sp2 = p.split;
  if (s.kind === 'alias' && s.node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
    if (base !== s.name) return { ok: false, reason: 'exported-alias needs another name (the contract name is taken)' };
    const im = findImporters(s.file, s.name, s.pkg);
    if (im.bail) return { ok: false, reason: `exported-alias: ${im.bail}` };
    for (const i of im.out) {
      const spec = relSpec(i.file, cfile.replace(/\.ts$/u, ''));
      const keep = i.els.filter((e) => e.name.text !== s.name);
      const kw = i.st.importClause.isTypeOnly ? 'import type' : 'import';
      const le = i.sf.text.indexOf('\n', i.st.end);
      otherEdits.push({
        file: i.file,
        importText: `import type { ${s.name} } from '${spec}';\n`,
        edits: [keep.length
          ? { start: i.st.getStart(i.sf), end: i.st.end, text: `${kw} { ${keep.map((e) => e.getText(i.sf)).join(', ')} } from ${i.st.moduleSpecifier.getText(i.sf)};` }
          : { start: i.st.getStart(i.sf), end: le === -1 ? i.st.end : le + 1, text: '' }],
      });
    }
  }
  if (s.kind === 'alias') {
    let touched = 0;
    const find = (n) => {
      const isCore = (tn) => {
        const c = splitOf(tn, sf);
        return c.rest.length === 1 && ts.isTypeReferenceNode(c.rest[0]) && c.rest[0].typeName.getText(sf) === s.name;
      };
      if (ts.isFunctionLike(n) && n.type && n.body && mentions(n.type, s.name, sf)) {
        if (isCore(n.type)) {
          const r = returnEdits(n, splitOf(n.type, sf), sf, cname);
          if (r.bail) throw new Error(r.bail);
          edits.push(...r.edits);
        }
        touched++;
      } else if (ts.isVariableDeclaration(n) && n.type && n.initializer && ts.isObjectLiteralExpression(n.initializer) && mentions(n.type, s.name, sf)) {
        if (isCore(n.type)) edits.push({ start: n.initializer.getStart(sf), end: n.initializer.end, text: `${cname}.parse(${n.initializer.getText(sf)})` });
        touched++;
      }
      if (base !== s.name && ts.isTypeReferenceNode(n) && n.typeName.getText(sf) === s.name) edits.push({ start: n.typeName.getStart(sf), end: n.typeName.end, text: base });
      ts.forEachChild(n, find);
    };
    try {
      for (const st of sf.statements) if (st !== s.node) find(st);
    } catch (e) {
      return { ok: false, reason: e.message };
    }
    if (!touched) return { ok: false, reason: 'alias-used-by-no-annotated-function (importers or parameters only)' };
    const le = text.indexOf('\n', s.node.end);
    edits.push({ start: leadingCommentStart(text, s.node, sf), end: le === -1 ? s.node.end : le + 1, text: '' });
  } else {
    edits.push({ start: sp2.inner.getStart(sf), end: sp2.inner.end, text: typeReplacement(sp2, base) });
    if (s.kind === 'return') {
      const r = returnEdits(s.fnNode, sp2, sf, cname);
      if (r.bail) return { ok: false, reason: r.bail };
      edits.push(...r.edits);
    } else if (s.kind === 'variable' && s.decl.initializer && ts.isObjectLiteralExpression(s.decl.initializer))
      edits.push({ start: s.decl.initializer.getStart(sf), end: s.decl.initializer.end, text: `${cname}.parse(${s.decl.initializer.getText(sf)})` });
  }
  // a local alias whose right-hand side was expanded into the contract goes when nothing else uses it (dropUnused)
  const spec = relSpec(s.file, cfile.replace(/\.ts$/u, ''));
  const wraps = edits.some((e) => e.text.startsWith(cname + '.parse('));
  const importText = `${wraps ? `import { ${cname} } from '${spec}';\n` : ''}import type { ${base} } from '${spec}';\n`;
  const out = { ok: true, s, base, cname, cfile, dir, edits, otherEdits, importText, reused: !!chosen.reuse, gateway: p.gateway, sampleErr: null };
  if (!chosen.reuse) {
    const imports = new Map();
    for (const r of refsAll) {
      const sp3 = r.pkg === s.pkg ? relSpec(cfile, r.file.replace(/\.ts$/u, '')) : `${r.pkg}/contracts`;
      (imports.get(sp3) ?? imports.set(sp3, []).get(sp3)).push(r.contractConst);
    }
    for (const [name, schema] of p.gateway) (imports.get(S.gatewaySpec(name, s.pkg)) ?? imports.set(S.gatewaySpec(name, s.pkg), []).get(S.gatewaySpec(name, s.pkg))).push(schema);
    const importLines = [...imports].map(([sp3, names]) => `import { ${[...new Set(names)].join(', ')} } from '${sp3}';`).join('\n');
    out.contractText = `/**\n * PURPOSE: ${purposeOf(s, base)}\n *\n * USAGE:\n * ${cname}.parse(value);\n * // Returns validated ${base}\n */\nimport { z } from '${lib.ZOD_SPEC}';\n${importLines}\n\nexport const ${cname} = ${p.code};\n\nexport type ${base} = z.infer<typeof ${cname}>;\n`;
    try {
      Object.assign(out, stubFor(s, p, base, cname, cfile, refsAll));
    } catch (e) {
      return { ok: false, reason: `stub: ${e.message}` };
    }
    out.extraFiles = [...p.gateway.keys()].filter((n) => !GATEWAY_TYPES[n].exists).flatMap((n) => gatewayFiles(n, s.pkg));
  }
  return out;
};
const splitOf = (typeNode, sf) => S.splitType(typeNode, sf);

// ---------- run ----------
let prettier = null;
const fmt = async (file, text) => {
  prettier ??= require(path.join(ROOT, 'node_modules/prettier'));
  // The repo's own prettier config, found the way prettier finds it (a consumer may have none, or not .prettierrc.json).
  const cfg = (await prettier.resolveConfig(file)) ?? {};
  return prettier.format(text, { ...cfg, filepath: file });
};

const main = async () => {
  const all = S.census(pkgFilter);
  const impl = all.filter((s) => !s.isTest);
  const leftovers = [];
  const left = (s, reason) => leftovers.push({ pkg: s.pkg, file: rel(s.file), line: s.sf.getLineAndCharacterOfPosition(s.typeNode.getStart(s.sf)).line + 1, kind: s.kind, name: s.name, ft: s.ft, reason, text: s.text.replace(/\s+/gu, ' ').slice(0, 140) });
  const byFile = new Map();
  for (const s of impl) {
    if (s.klass === 'method-set') continue;
    if (s.klass === 'mixed') {
      left(s, 'mixed-data-and-functions');
      continue;
    }
    (byFile.get(s.file) ?? byFile.set(s.file, []).get(s.file)).push(s);
  }
  const found = impl.filter((s) => s.klass !== 'method-set').length;
  if (censusOnly) {
    const by = {};
    for (const s of impl) (by[s.pkg] ??= { data: 0, mixed: 0, methodSet: 0 })[s.klass === 'data' ? 'data' : s.klass === 'mixed' ? 'mixed' : 'methodSet']++;
    console.table(by);
    return;
  }

  // plan every file: aliases first, so a return in the same file can name the alias's contract
  const plans = []; // { file, shapes: [plan...], text }
  for (const [file, list] of [...byFile].sort((a, b) => a[0].localeCompare(b[0]))) {
    const ctxFile = { localShapes: new Map() };
    const done = [];
    for (const s of [...list].sort((a, b) => (a.kind === 'alias' ? 0 : 1) - (b.kind === 'alias' ? 0 : 1))) {
      const pl = planShape(s, ctxFile);
      if (!pl.ok) {
        left(s, pl.reason);
        continue;
      }
      usedNames.add(pl.base);
      if (s.kind === 'alias') ctxFile.localShapes.set(s.name, { const: pl.cname, type: pl.base, file: pl.cfile });
      done.push(pl);
    }
    if (done.length) plans.push({ file, shapes: done, pkg: list[0].pkg });
  }

  // ---------- build every output file ----------
  const buildOutputs = async (activePlans) => {
    const overlay = new Map();
    const perFile = new Map();
    const slot = (f) => perFile.get(f) ?? perFile.set(f, { edits: [], imports: [] }).get(f);
    for (const pf of activePlans)
      for (const x of pf.shapes) {
        slot(pf.file).edits.push(...x.edits);
        slot(pf.file).imports.push(x.importText);
        for (const o of x.otherEdits ?? []) {
          slot(o.file).edits.push(...o.edits);
          slot(o.file).imports.push(o.importText);
        }
      }
    for (const [file, { edits, imports }] of perFile) {
      const text = fs.readFileSync(file, 'utf8');
      const ordered = [...edits].sort((a, b) => a.start - b.start);
      for (let i = 1; i < ordered.length; i++) if (ordered[i].start < ordered[i - 1].end) throw new Error(`overlapping edits in ${rel(file)}`);
      let cur = lib.applyEdits(text, edits);
      const sf2 = lib.parse(file, cur);
      const first = sf2.statements.find((x) => ts.isImportDeclaration(x));
      const anchor = first ? first.getStart(sf2) : 0;
      cur = cur.slice(0, anchor) + [...new Set(imports)].join('') + cur.slice(anchor);
      for (let i = 0; i < 4; i++) {
        const next = dropUnused(file, text, cur);
        if (next === cur) break;
        cur = next;
      }
      overlay.set(file, lib.mergeDuplicateImports(file, cur));
    }
    for (const pf of activePlans)
      for (const x of pf.shapes) {
        if (x.reused) continue;
        const kb = kebab(x.base);
        overlay.set(x.cfile, await fmt(x.cfile, x.contractText));
        overlay.set(path.join(x.dir, `${kb}.stub.ts`), await fmt(x.cfile, x.stubText));
        overlay.set(path.join(x.dir, `${kb}-contract.test.ts`), await fmt(x.cfile, x.testText));
        for (const [f, t] of x.extraFiles ?? []) overlay.set(f, t);
      }
    return overlay;
  };

  // ---------- the gate: whole packages, before against after ----------
  const keyOf = (d) => `${d.code}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
  const dependents = (pkgName) => S.ws.filter((w) => !w.isGateway && w.name !== pkgName && { ...w.packageJson.dependencies, ...w.packageJson.devDependencies }[pkgName]);
  const gateOnce = async (activePlans, overlay, failNote) => {
    const pkgs = new Map();
    for (const pf of activePlans) pkgs.set(pf.pkg, S.ws.find((w) => w.name === pf.pkg));
    for (const w of [...pkgs.values()]) for (const d of dependents(w.name)) pkgs.set(d.name, d);
    const failed = new Set();
    const byName = new Map();
    for (const pf of activePlans) for (const x of pf.shapes) byName.set(x.s.name, pf);
    for (const [pn, w] of pkgs) {
      const options = lib.packageCompilerOptions(w.dir);
      const mine = [...overlay.keys()].filter((f) => lib.workspaceOf(f, S.ws)?.name === pn && !lib.cfg.inside(f, path.join(ROOT, lib.GATEWAY_DIR)));
      const files = [...new Set([...(options.rootNames ?? []), ...mine])].filter((f) => f.includes(`${w.rel}/`) || f.startsWith(w.dir));
      const t0 = Date.now();
      const aft = lib.diagnosticsWithOverlay(files, overlay, options).diagnostics;
      const withDiag = files.filter((f) => aft.get(f)?.length);
      const existing = withDiag.filter((f) => fs.existsSync(f));
      const base = existing.length ? lib.diagnosticsWithOverlay(existing, new Map(), options).diagnostics : new Map();
      let added = 0;
      for (const f of withDiag) {
        const bk = new Set((base.get(f) ?? []).map(keyOf));
        for (const d of aft.get(f).filter((x) => !bk.has(keyOf(x)))) {
          added++;
          const msg = lib.formatDiagnostic(d);
          // attribute: the file's own plan, else a plan whose function or contract name appears in the diagnostic's statement
          let owner = activePlans.find((pf) => pf.file === f || pf.shapes.some((x) => [x.cfile, path.join(x.dir, `${kebab(x.base)}.stub.ts`), path.join(x.dir, `${kebab(x.base)}-contract.test.ts`)].includes(f)));
          let hit = owner ? owner.shapes.filter((x) => !x.reused).map((x) => x.s.name) : null;
          if (!owner) {
            const brands = [...ts.flattenDiagnosticMessageText(d.messageText, ' ').matchAll(/\$brand<"([^"]+)">/gu)].map((m) => m[1]);
            const cands = activePlans.flatMap((pf) => pf.shapes.filter((x) => brands.some((b) => b === x.base || b.startsWith(x.base))).map((x) => ({ pf, x })));
            cands.sort((l, r) => r.x.base.length - l.x.base.length);
            if (cands.length) (owner = cands[0].pf), (hit = [cands[0].x.s.name]);
          }
          if (!owner && d.file) {
            const line = d.file.text.slice(Math.max(0, d.file.text.lastIndexOf('\n', d.start ?? 0) - 400), (d.start ?? 0) + 400);
            const ids = new Set(line.match(/\b[A-Za-z_$][\w$]*\b/gu));
            for (const [nm, pf] of byName) if (ids.has(nm) || pf.shapes.some((x) => ids.has(x.base) && x.s.name === nm)) (owner = pf), (hit = [nm]);
          }
          if (owner) {
            // a diagnostic in a shape's own file fails the shapes whose text it touches; in another file, the named ones
            const pfShapes = owner.shapes.filter((x) => (hit ? hit.includes(x.s.name) : true));
            const targets = pfShapes.length && f !== owner.file ? pfShapes : owner.shapes;
            for (const x of targets) failed.add(x);
            for (const x of targets) x.gateNote = x.gateNote ?? msg.slice(0, 200);
          } else failNote.push(msg);
        }
      }
      console.error(`  gate ${w.short}: ${files.length} files, ${added} new diagnostics, ${(Date.now() - t0) / 1000}s`);
    }
    return failed;
  };

  let active = plans;
  const gateFailed = [];
  const unattributed = [];
  if (!noGate) {
    for (let round = 1; round <= 4 && active.length; round++) {
      const overlay = await buildOutputs(active);
      const notes = [];
      const failed = await gateOnce(active, overlay, notes);
      unattributed.length = 0;
      unattributed.push(...notes);
      console.error(`gate round ${round}: ${failed.size} shapes dropped, ${notes.length} unattributed diagnostics`);
      if (!failed.size) break;
      for (const x of failed) {
        gateFailed.push(x);
        left(x.s, `gate: ${x.gateNote ?? 'new diagnostic'}`);
      }
      for (const pf of active) pf.shapes = pf.shapes.filter((x) => !failed.has(x));
      active = active.filter((pf) => pf.shapes.length);
    }
  }
  // a plan file whose shapes depend on a dropped same-file alias is caught by the gate (its type no longer resolves)

  const overlay = await buildOutputs(active);
  if (sampleOut) {
    for (const [f, t] of overlay) {
      const d = path.join(path.resolve(ROOT, sampleOut), rel(f));
      fs.mkdirSync(path.dirname(d), { recursive: true });
      fs.writeFileSync(d, t);
    }
  }
  if (doApply) for (const [f, t] of overlay) (fs.mkdirSync(path.dirname(f), { recursive: true }), fs.writeFileSync(f, t));

  // ---------- reports ----------
  const generated = active.flatMap((pf) => pf.shapes.map((x) => ({ pkg: pf.pkg, file: rel(pf.file), kind: x.s.kind, name: x.s.name, contract: x.base, reused: x.reused })));
  fs.writeFileSync(path.join(outDir, 'generated.json'), JSON.stringify(generated, null, 1));
  fs.writeFileSync(path.join(outDir, 'leftovers.json'), JSON.stringify(leftovers, null, 1));
  const groups = {};
  for (const l of leftovers) (groups[l.reason.replace(/^gate: .*/u, 'gate: new diagnostic').replace(/:.*$/u, (m) => (l.reason.startsWith('type-ref') || l.reason.startsWith('ambiguous') || l.reason.startsWith('indexed') || l.reason.startsWith('kind') || l.reason.startsWith('member') ? m : ''))] ??= []).push(l);
  const lines = [`Leftovers for hand (${leftovers.length}), grouped by reason. Each row: package  file:line  kind name  type`, ''];
  for (const [r, list] of Object.entries(groups).sort((a, b) => b[1].length - a[1].length)) {
    lines.push(`## ${r} (${list.length})`);
    for (const l of list.sort((a, b) => (a.file + a.line).localeCompare(b.file + b.line))) lines.push(`${l.pkg.replace(lib.SCOPE, '')}  ${l.file}:${l.line}  ${l.kind} ${l.name}  ${l.text}${l.reason.startsWith('gate: ') ? `\n      ${l.reason.slice(6)}` : ''}`);
    lines.push('');
  }
  if (unattributed.length) lines.push(`## unattributed downstream diagnostics after the last round (${unattributed.length})`, ...unattributed.slice(0, 40), '');
  fs.writeFileSync(path.join(outDir, 'leftovers.txt'), lines.join('\n'));
  const per = {};
  for (const s of impl) (per[s.pkg.replace(lib.SCOPE, '')] ??= { found: 0, methodSet: 0, generated: 0, left: 0 })[s.klass === 'method-set' ? 'methodSet' : 'found']++;
  for (const g of generated) per[g.pkg.replace(lib.SCOPE, '')].generated++;
  for (const l of leftovers) per[l.pkg.replace(lib.SCOPE, '')].left++;
  console.table(per);
  console.log(JSON.stringify({ found, generated: generated.length, reused: generated.filter((g) => g.reused).length, leftovers: leftovers.length, gateDropped: gateFailed.length, filesWritten: overlay.size, applied: doApply }));
};
main().catch((e) => {
  console.error(e);
  process.exit(1);
});

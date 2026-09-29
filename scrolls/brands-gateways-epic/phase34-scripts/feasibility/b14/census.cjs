// B14 census + zod printer: module-level object type literals (alias / return type / variable type / type argument)
// outside proxies, widgets and contracts; method sets, mixed shapes, data shapes; and which data shapes print to zod.
const fs = require('fs');
const path = require('path');
const lib = require('../../phase34/lib/repo.cjs');
const { ts, ROOT, rel } = lib;
const ws = lib.workspaces();
const resolver = lib.makeResolver();
const pickCandidate = (name, ctx) => {
  const cands = typeIndex.get(name);
  const spec = ctx.fileImports.get(name);
  const r = resolver(spec, ctx.sf.fileName);
  if (r) {
    const d = lib.findDeclaringFile(r, name, resolver);
    const hit = d && cands.find((x) => path.resolve(x.file) === path.resolve(d.file));
    if (hit) return hit;
  }
  return cands.length === 1 ? cands[0] : cands.find((x) => x.pkg === ctx.pkg) ?? null;
};

const pascal = (s) => s.replace(/(^|[-_ ])(\w)/gu, (_, __, c) => c.toUpperCase());
const camel = (s) => s[0].toLowerCase() + s.slice(1);
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/gu, '$1-$2').replace(/([A-Z]+)([A-Z][a-z])/gu, '$1-$2').toLowerCase();

// ---- index of contract types: `export type X = z.infer<typeof yContract>` ----
const typeIndex = new Map(); // name -> [{ contractConst, file, pkg }]
const contractNames = new Set();
for (const w of ws) {
  if (w.isGateway) continue;
  for (const f of lib.walk(path.join(w.dir, 'src'))) {
    if (!/-contract\.ts$/u.test(f)) continue;
    const sf = lib.parse(f);
    for (const st of sf.statements) {
      if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name) && /Contract$/u.test(d.name.text)) contractNames.add(d.name.text);
      if (ts.isTypeAliasDeclaration(st) && st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) && ts.isTypeReferenceNode(st.type) && /z\.(infer|output)$/u.test(st.type.typeName.getText(sf))) {
        const a = st.type.typeArguments?.[0];
        if (a && ts.isTypeQueryNode(a)) {
          const list = typeIndex.get(st.name.text) ?? [];
          list.push({ contractConst: a.exprName.getText(sf), file: f, pkg: w.name });
          typeIndex.set(st.name.text, list);
        }
      }
    }
  }
}

class Unprintable extends Error {}
const no = (r) => {
  throw new Unprintable(r);
};

const isFnMember = (m) => ts.isMethodSignature(m) || (ts.isPropertySignature(m) && m.type && (ts.isFunctionTypeNode(m.type) || (ts.isParenthesizedTypeNode(m.type) && ts.isFunctionTypeNode(m.type.type))));
const literalClass = (tl) => {
  const fn = tl.members.filter(isFnMember).length;
  if (fn === tl.members.length) return 'method-set';
  return fn ? 'mixed' : 'data';
};

// finds object type literals reachable without crossing a function type
const literalsIn = (t, out = []) => {
  if (ts.isTypeLiteralNode(t)) out.push(t);
  else if (ts.isTypeReferenceNode(t)) t.typeArguments?.forEach((a) => literalsIn(a, out));
  else if (ts.isUnionTypeNode(t) || ts.isIntersectionTypeNode(t)) t.types.forEach((a) => literalsIn(a, out));
  else if (ts.isArrayTypeNode(t)) literalsIn(t.elementType, out);
  else if (ts.isParenthesizedTypeNode(t)) literalsIn(t.type, out);
  else if (ts.isTupleTypeNode(t)) t.elements.forEach((a) => literalsIn(a, out));
  else if (ts.isTypeOperatorNode(t)) literalsIn(t.type, out);
  return out;
};

// ---- zod printer ----
// ctx: { sf, owner (Pascal), imports: Map<name, {kind:'contract', name}>, fileImports: Map<typeName, spec>, refs: Set }
const zodOf = (t, ctx, keyPath) => {
  const brandText = () => ctx.owner + keyPath.map(pascal).join('');
  if (ts.isParenthesizedTypeNode(t)) return zodOf(t.type, ctx, keyPath);
  switch (t.kind) {
    case ts.SyntaxKind.StringKeyword:
      return `z.string().brand<'${brandText()}'>()`;
    case ts.SyntaxKind.NumberKeyword:
      return `z.number().brand<'${brandText()}'>()`;
    case ts.SyntaxKind.BooleanKeyword:
      return 'z.boolean()';
    case ts.SyntaxKind.NullKeyword:
      return 'z.null()';
    case ts.SyntaxKind.UndefinedKeyword:
      return 'z.undefined()';
    case ts.SyntaxKind.UnknownKeyword:
    case ts.SyntaxKind.AnyKeyword:
      return no('unknown/any');
    case ts.SyntaxKind.VoidKeyword:
      return no('void');
    default:
  }
  if (ts.isLiteralTypeNode(t)) {
    const l = t.literal;
    if (ts.isStringLiteral(l)) return `z.literal(${JSON.stringify(l.text).replace(/^"|"$/gu, "'")})`;
    if (ts.isNumericLiteral(l)) return `z.literal(${l.text})`;
    if (l.kind === ts.SyntaxKind.TrueKeyword) return 'z.literal(true)';
    if (l.kind === ts.SyntaxKind.FalseKeyword) return 'z.literal(false)';
    if (l.kind === ts.SyntaxKind.NullKeyword) return 'z.null()';
    return no('literal-kind');
  }
  if (ts.isArrayTypeNode(t)) return `z.array(${zodOf(t.elementType, ctx, keyPath)})`;
  if (ts.isTypeReferenceNode(t)) {
    const name = t.typeName.getText(ctx.sf);
    if (name === 'Array' && t.typeArguments?.length === 1) return `z.array(${zodOf(t.typeArguments[0], ctx, keyPath)})`;
    if (name === 'Record' && t.typeArguments?.length === 2) return `z.record(${zodOf(t.typeArguments[0], ctx, [...keyPath, 'Key'])}, ${zodOf(t.typeArguments[1], ctx, keyPath)})`;
    if (ctx.fileImports.has(name) && typeIndex.has(name)) {
      const c = pickCandidate(name, ctx);
      if (!c) return no(`ambiguous-contract-type:${name}`);
      ctx.refs.set(c.contractConst, { type: name, file: c.file, pkg: c.pkg });
      return c.contractConst;
    }
    return no(`type-ref:${name}`);
  }
  if (ts.isIndexedAccessTypeNode(t) && ts.isTypeReferenceNode(t.objectType) && ts.isLiteralTypeNode(t.indexType) && ts.isStringLiteral(t.indexType.literal)) {
    const owner = t.objectType.typeName.getText(ctx.sf);
    const key = t.indexType.literal.text;
    if (ctx.fileImports.has(owner) && typeIndex.has(owner)) {
      const c = pickCandidate(owner, ctx);
      if (c) {
        ctx.refs.set(c.contractConst, { type: owner, file: c.file, pkg: c.pkg });
        return `${c.contractConst}.shape.${key}`;
      }
    }
    return no(`indexed-access:${owner}`);
  }
  if (ts.isUnionTypeNode(t)) {
    let nullable = false;
    let optional = false;
    const rest = t.types.filter((x) => {
      if (x.kind === ts.SyntaxKind.NullKeyword || (ts.isLiteralTypeNode(x) && x.literal.kind === ts.SyntaxKind.NullKeyword)) return (nullable = true), false;
      if (x.kind === ts.SyntaxKind.UndefinedKeyword) return (optional = true), false;
      return true;
    });
    let base;
    if (rest.length && rest.every((x) => ts.isLiteralTypeNode(x) && ts.isStringLiteral(x.literal))) {
      base = `z.enum([${rest.map((x) => `'${x.literal.text}'`).join(', ')}])`;
    } else if (rest.length === 1) base = zodOf(rest[0], ctx, keyPath);
    else if (rest.every((x) => ts.isTypeLiteralNode(x))) {
      // discriminated union on a shared literal key
      const keys = rest.map((x) => new Set(x.members.filter((m) => ts.isPropertySignature(m) && m.type && ts.isLiteralTypeNode(m.type)).map((m) => m.name.getText(ctx.sf))));
      const shared = [...keys[0]].find((k) => keys.every((s) => s.has(k)));
      const branches = rest.map((x) => zodObject(x, ctx, keyPath, true));
      base = shared ? `z.discriminatedUnion('${shared}', [${branches.join(', ')}])` : `z.union([${branches.join(', ')}])`;
      if (!shared) no('object-union-without-discriminant');
    } else base = `z.union([${rest.map((x) => zodOf(x, ctx, keyPath)).join(', ')}])`;
    return base + (nullable ? '.nullable()' : '') + (optional ? '.optional()' : '');
  }
  if (ts.isTypeLiteralNode(t)) return zodObject(t, ctx, keyPath, false);
  if (ts.isTypeOperatorNode(t) && t.operator === ts.SyntaxKind.ReadonlyKeyword && ts.isArrayTypeNode(t.type)) return `${zodOf(t.type, ctx, keyPath)}.readonly()`;
  if (ts.isTupleTypeNode(t)) return `z.tuple([${t.elements.map((e, i) => zodOf(e, ctx, [...keyPath, String(i)])).join(', ')}])`;
  return no(`kind:${ts.SyntaxKind[t.kind]}`);
};
const zodObject = (tl, ctx, keyPath, unionBranch) => {
  if (tl.members.some(isFnMember)) no('mixed-data-and-functions');
  const fields = tl.members.map((m) => {
    if (!ts.isPropertySignature(m) || !m.type || !(ts.isIdentifier(m.name) || ts.isStringLiteral(m.name))) return no(`member:${ts.SyntaxKind[m.kind]}`);
    const key = m.name.text;
    let z = zodOf(m.type, ctx, [...keyPath, key]);
    if (m.questionToken) z += '.optional()';
    if (m.modifiers?.some((x) => x.kind === ts.SyntaxKind.ReadonlyKeyword)) z += '';
    return `${/^[A-Za-z_$][\w$]*$/u.test(key) ? key : `'${key}'`}: ${z}`;
  });
  return `z.object({ ${fields.join(', ')} }).brand<'${ctx.owner}${unionBranch ? '' : keyPath.map(pascal).join('')}'>()`;
};

// ---- census ----
const TEST_FILE = /\.(test|integration\.test|e2e|spec)\.tsx?$/u;
const EXEMPT_DIR = /\/(widgets|contracts|node_modules|dist)\//u;
const shapes = [];
for (const w of ws) {
  if (w.isGateway) continue;
  const dirs = ['src', 'test', 'e2e'].map((d) => path.join(w.dir, d));
  for (const f of dirs.flatMap((d) => lib.walk(d))) {
    if (/\.(proxy|stub|harness)\.tsx?$/u.test(f) || EXEMPT_DIR.test('/' + rel(f))) continue;
    const isTest = TEST_FILE.test(f) || /\/(test|e2e)\//u.test('/' + rel(f));
    const text = fs.readFileSync(f, 'utf8');
    if (!text.includes('{')) continue;
    const sf = lib.parse(f, text);
    const fileImports = new Map();
    for (const st of sf.statements) if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) for (const e of st.importClause.namedBindings.elements) fileImports.set(e.name.text, st.moduleSpecifier.text);
    const add = (kind, node, typeNode, name, fnNode) => {
      const lits = literalsIn(typeNode);
      const data = lits.filter((l) => literalClass(l) !== 'method-set');
      if (!lits.length) return;
      shapes.push({ file: f, pkg: w.name, isTest, kind, name, typeNode, node, fnNode, sf, fileImports, klass: data.length ? (data.some((l) => literalClass(l) === 'mixed') ? 'mixed' : 'data') : 'method-set', text: typeNode.getText(sf) });
    };
    for (const st of sf.statements) {
      if (ts.isTypeAliasDeclaration(st)) add('alias', st, st.type, st.name.text);
      else if (ts.isFunctionDeclaration(st) && st.type) add('return', st, st.type, st.name?.text ?? 'default', st);
      else if (ts.isVariableStatement(st)) {
        for (const d of st.declarationList.declarations) {
          const nm = ts.isIdentifier(d.name) ? d.name.text : '?';
          if (d.type) add('variable', st, d.type, nm);
          const init = d.initializer;
          if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) && init.type) add('return', st, init.type, nm, init);
          if (init && (ts.isNewExpression(init) || ts.isCallExpression(init)) && init.typeArguments) init.typeArguments.forEach((a) => add('typearg', st, a, nm));
        }
      }
    }
  }
}

const folderTypeOf = (f) => (/\/src\/([^/]+)\//u.exec('/' + rel(f)) ?? [])[1] ?? (/\/(test|e2e)\//u.test(rel(f)) ? 'test-dir' : 'other');

const tryPrint = (s, baseOverride) => {
  const base = baseOverride ?? (s.kind === 'alias' ? pascal(s.name) : pascal(s.name.replace(/(Broker|Transformer|Responder|Guard|Binding|State|Flow|Adapter|Middleware|Startup)$/u, '')) + 'Result');
  const ctx = { sf: s.sf, owner: base, fileImports: s.fileImports, refs: new Map(), pkg: s.pkg };
  try {
    // strip Promise<...> / array wrappers around the literal(s)
    let t = s.typeNode;
    let wrap = (z) => z;
    for (;;) {
      if (ts.isTypeReferenceNode(t) && t.typeName.getText(s.sf) === 'Promise' && t.typeArguments?.length === 1) t = t.typeArguments[0];
      else if (ts.isParenthesizedTypeNode(t)) t = t.type;
      else break;
    }
    const code = zodOf(t, ctx, []);
    if (!/^z\.(object|discriminatedUnion|union|array)/u.test(code)) return { ok: false, reason: 'not-an-object-shape' };
    return { ok: true, code, base, refs: ctx.refs, inner: t };
  } catch (e) {
    if (e instanceof Unprintable) return { ok: false, reason: e.message.replace(/:.*/u, (m) => (m.length < 40 ? m : '')) };
    throw e;
  }
};

module.exports = { shapes, tryPrint, folderTypeOf, typeIndex, pascal, camel, kebab, contractNames, zodOf, Unprintable, literalsIn };

if (require.main === module) {
  const summary = { total: shapes.length, byKlass: {}, byKind: {}, byFolder: {}, impl: 0, test: 0, printable: 0, dataImpl: 0, reasons: {} };
  const rows = [];
  for (const s of shapes) {
    summary.byKlass[s.klass] = (summary.byKlass[s.klass] ?? 0) + 1;
    if (s.isTest) summary.test++;
    else summary.impl++;
    if (s.klass === 'method-set') continue;
    const ft = folderTypeOf(s.file);
    if (!s.isTest) {
      summary.dataImpl++;
      summary.byKind[s.kind] = (summary.byKind[s.kind] ?? 0) + 1;
      summary.byFolder[ft] = (summary.byFolder[ft] ?? 0) + 1;
    }
    const p = s.klass === 'data' ? tryPrint(s) : { ok: false, reason: 'mixed-data-and-functions' };
    if (!s.isTest && p.ok) summary.printable++;
    if (!s.isTest && !p.ok) summary.reasons[p.reason] = (summary.reasons[p.reason] ?? 0) + 1;
    rows.push({ file: rel(s.file), kind: s.kind, name: s.name, klass: s.klass, isTest: s.isTest, ok: p.ok, reason: p.reason, text: s.text.slice(0, 200) });
  }
  console.log(JSON.stringify(summary, null, 1));
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'out', 'census.json'), JSON.stringify(rows, null, 1));
}

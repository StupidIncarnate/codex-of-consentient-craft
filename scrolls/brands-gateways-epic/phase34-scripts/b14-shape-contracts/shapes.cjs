// B14 census + zod printer (SD6). Module-level object type literals (alias / return type / variable type / type
// argument) outside proxies, widgets and contracts, classified as method set, mixed or data, and printed to zod
// branded per B1/B3 when every part of the type can be printed.
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');

const { ts, rel } = lib;
const ws = lib.workspaces();
const resolver = lib.makeResolver();

const pascal = (s) => s.replace(/(^|[-_ .])(\w)/gu, (_, __, c) => c.toUpperCase()).replace(/[-_ .]/gu, '');
const camel = (s) => s[0].toLowerCase() + s.slice(1);
const kebab = (s) =>
  s
    .replace(/([a-z0-9])([A-Z])/gu, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/gu, '$1-$2')
    .toLowerCase();
const q = (s) => `'${s.replace(/\\/gu, '\\\\').replace(/'/gu, "\\'").replace(/\n/gu, '\\n')}'`;

// ---- index of contract types: `export type X = z.infer<typeof yContract>` ----
const typeIndex = new Map(); // name -> [{ contractConst, file, pkg }]
const contractNames = new Set(); // every `...Contract` const, repo-wide
const contractDirs = new Set(); // every `contracts/<dir>` folder name, repo-wide
for (const w of ws) {
  if (w.isGateway) continue;
  for (const f of lib.walk(path.join(w.dir, 'src'))) {
    if (!/-contract\.ts$/u.test(f)) continue;
    contractDirs.add(path.basename(path.dirname(f)));
    const sf = lib.parse(f);
    for (const st of sf.statements) {
      if (ts.isVariableStatement(st))
        for (const d of st.declarationList.declarations)
          if (ts.isIdentifier(d.name) && /Contract$/u.test(d.name.text)) contractNames.add(d.name.text);
      if (
        ts.isTypeAliasDeclaration(st) &&
        st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
        ts.isTypeReferenceNode(st.type) &&
        /z\.(infer|output)$/u.test(st.type.typeName.getText(sf))
      ) {
        const a = st.type.typeArguments?.[0];
        const exported = sf.statements.some((x) => ts.isVariableStatement(x) && x.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) && x.declarationList.declarations.some((d) => ts.isIdentifier(d.name) && a && ts.isTypeQueryNode(a) && d.name.text === a.exprName.getText(sf)));
        if (a && ts.isTypeQueryNode(a) && exported) {
          const list = typeIndex.get(st.name.text) ?? [];
          list.push({ contractConst: a.exprName.getText(sf), file: f, pkg: w.name });
          typeIndex.set(st.name.text, list);
        }
      }
    }
  }
}

// Outside-package types a contract field holds through the gateway's schema (C9). A schema the gateway does not
// have yet is `proposed`: the generator writes it into the sample beside the contracts that need it, and lists it.
const gatewayKind = (pkg) => lib.cfg.gatewayKindOf(pkg);
const GATEWAY_TYPES = {
  Error: { schema: 'errorSchema', sub: 'Error', file: 'error-schema', brand: '#GatewayError', ctor: 'Error', sample: "new Error('sample')" },
  Uint8Array: { schema: 'uint8ArraySchema', sub: 'Uint8Array', file: 'uint8-array-schema', brand: '#GatewayUint8Array', ctor: 'Uint8Array', sample: 'new Uint8Array()' },
  Buffer: { schema: 'bufferSchema', sub: 'buffer', exists: true, spec: `${lib.GW}node/buffer`, sample: "Buffer.from('sample')" },
  ChildProcess: { schema: 'childProcessSchema', sub: 'child_process', exists: true, spec: `${lib.GW}node/child_process`, sample: null },
  WalkedFile: { schema: 'walkedFileSchema', sub: 'fs', exists: true, spec: `${lib.GW}node/fs`, sample: "{ path: '/a', sizeBytes: 0, modifiedAtMs: 0 }" },
};
const gatewaySpec = (name, pkg) => GATEWAY_TYPES[name].spec ?? `${lib.GW}${gatewayKind(pkg)}/${GATEWAY_TYPES[name].sub}`;

class Unprintable extends Error {}
const no = (r) => {
  throw new Unprintable(r);
};

const isFnMember = (m) =>
  ts.isMethodSignature(m) ||
  (ts.isPropertySignature(m) && m.type && (ts.isFunctionTypeNode(m.type) || (ts.isParenthesizedTypeNode(m.type) && ts.isFunctionTypeNode(m.type.type))));
const literalClass = (tl) => {
  const fn = tl.members.filter(isFnMember).length;
  if (fn === tl.members.length) return 'method-set';
  return fn ? 'mixed' : 'data';
};

// object type literals reachable without crossing a function type
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

const isNullKw = (x) => x.kind === ts.SyntaxKind.NullKeyword || (ts.isLiteralTypeNode(x) && x.literal.kind === ts.SyntaxKind.NullKeyword);
const isUndefKw = (x) => x.kind === ts.SyntaxKind.UndefinedKeyword;

// ---- zod printer ----
// ctx: { sf, owner (Pascal), fileImports, refs: Map<contractConst,{type,file,pkg}>, gateway: Map<schema,spec>,
//        localAliases: Map<name, TypeAliasDeclaration>, localShapes: Map<name, {const,type}>, locals: Set, pkg, expanding }
const pickCandidate = (name, ctx) => {
  const cands = typeIndex.get(name);
  const spec = ctx.fileImports.get(name);
  const r = spec && resolver(spec, ctx.sf.fileName);
  if (r) {
    const d = lib.findDeclaringFile(r, name, resolver);
    const hit = d && cands.find((x) => path.resolve(x.file) === path.resolve(d.file));
    if (hit) return hit;
  }
  return cands.length === 1 ? cands[0] : (cands.find((x) => x.pkg === ctx.pkg) ?? null);
};
const useRef = (ctx, c, type) => {
  ctx.refs.set(c.contractConst, { type, file: c.file, pkg: c.pkg });
  return c.contractConst;
};

const zodMembers = (rest, ctx, keyPath) => {
  if (rest.length && rest.every((x) => ts.isLiteralTypeNode(x) && ts.isStringLiteral(x.literal)))
    return `z.enum([${rest.map((x) => q(x.literal.text)).join(', ')}])`;
  if (rest.length === 1) return zodOf(rest[0], ctx, keyPath);
  if (rest.every((x) => ts.isTypeLiteralNode(x))) {
    const keys = rest.map((x) => new Set(x.members.filter((m) => ts.isPropertySignature(m) && m.type && ts.isLiteralTypeNode(m.type)).map((m) => m.name.getText(ctx.sf))));
    const shared = [...keys[0]].find((k) => keys.every((s) => s.has(k)));
    if (!shared) no('object-union-without-discriminant');
    const branches = rest.map((x) => zodObject(x, ctx, keyPath, true));
    checkBranchKeys(rest, branches);
    return `z.discriminatedUnion(${q(shared)}, [${branches.join(', ')}])`;
  }
  return `z.union([${rest.map((x) => zodOf(x, ctx, keyPath)).join(', ')}])`;
};
// One brand text never means two checks: a key in several branches must print the same schema in each.
const checkBranchKeys = (rest, branches) => {
  const seen = new Map();
  for (const b of branches) {
    for (const m of b.matchAll(/(\w+|'[^']+'): (z\.(?:string|number)\(\)\.brand<'[^']+'>\(\)[^,}]*)/gu)) {
      const prev = seen.get(m[1]);
      if (prev && prev !== m[2]) no('union-branch-key-conflict');
      seen.set(m[1], m[2]);
    }
  }
};

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
    if (ts.isStringLiteral(l)) return `z.literal(${q(l.text)})`;
    if (ts.isNumericLiteral(l)) return `z.literal(${l.text})`;
    if (l.kind === ts.SyntaxKind.TrueKeyword) return 'z.literal(true)';
    if (l.kind === ts.SyntaxKind.FalseKeyword) return 'z.literal(false)';
    if (l.kind === ts.SyntaxKind.NullKeyword) return 'z.null()';
    return no('literal-kind');
  }
  if (ts.isArrayTypeNode(t)) return `z.array(${zodOf(t.elementType, ctx, keyPath)})`;
  if (ts.isTypeReferenceNode(t)) {
    const name = t.typeName.getText(ctx.sf);
    const args = t.typeArguments ?? [];
    if ((name === 'Array' || name === 'ReadonlyArray') && args.length === 1) return `z.array(${zodOf(args[0], ctx, keyPath)})${name === 'ReadonlyArray' ? '.readonly()' : ''}`;
    if (name === 'Record' && args.length === 2) return `z.record(${zodOf(args[0], ctx, [...keyPath, 'Key'])}, ${zodOf(args[1], ctx, keyPath)})`;
    if ((name === 'Map' || name === 'ReadonlyMap') && args.length === 2) return `z.map(${zodOf(args[0], ctx, [...keyPath, 'Key'])}, ${zodOf(args[1], ctx, keyPath)})`;
    if ((name === 'Set' || name === 'ReadonlySet') && args.length === 1) return `z.set(${zodOf(args[0], ctx, keyPath)})`;
    if (name === 'Readonly' && args.length === 1) return zodOf(args[0], ctx, keyPath);
    if (name === 'NonNullable' && args.length === 1) return `${zodOf(args[0], ctx, keyPath)}.unwrap()`;
    if (GATEWAY_TYPES[name] && (['Error', 'Uint8Array', 'Buffer'].includes(name) || ctx.fileImports.has(name))) {
      ctx.gateway.set(name, GATEWAY_TYPES[name].schema);
      return GATEWAY_TYPES[name].schema;
    }
    if (ctx.localShapes.has(name)) {
      ctx.locals.add(name);
      return ctx.localShapes.get(name).const;
    }
    if (ctx.localAliases.has(name) && !ctx.expanding.has(name)) {
      // a module-level alias with no contract of its own: its right-hand side stands in (B5 forbids a field-type alias)
      ctx.expanding.add(name);
      const code = zodOf(ctx.localAliases.get(name).type, ctx, keyPath);
      ctx.expanding.delete(name);
      ctx.expandedAliases.add(name);
      return code;
    }
    if (ctx.fileImports.has(name) && typeIndex.has(name)) {
      const c = pickCandidate(name, ctx);
      if (!c) return no(`ambiguous-contract-type:${name}`);
      return useRef(ctx, c, name);
    }
    return no(`type-ref:${name}`);
  }
  if (ts.isIndexedAccessTypeNode(t) && ts.isTypeReferenceNode(t.objectType) && ts.isLiteralTypeNode(t.indexType) && ts.isStringLiteral(t.indexType.literal)) {
    const owner = t.objectType.typeName.getText(ctx.sf);
    const key = t.indexType.literal.text;
    if (ctx.fileImports.has(owner) && typeIndex.has(owner)) {
      const c = pickCandidate(owner, ctx);
      if (c) return `${useRef(ctx, c, owner)}.shape.${key}`;
    }
    return no(`indexed-access:${owner}`);
  }
  if (ts.isUnionTypeNode(t)) {
    let nullable = false;
    let optional = false;
    const rest = t.types.filter((x) => {
      if (isNullKw(x)) return (nullable = true), false;
      if (isUndefKw(x)) return (optional = true), false;
      return true;
    });
    return zodMembers(rest, ctx, keyPath) + (nullable ? '.nullable()' : '') + (optional ? '.optional()' : '');
  }
  if (ts.isTypeLiteralNode(t)) return zodObject(t, ctx, keyPath, false);
  if (ts.isTypeOperatorNode(t) && t.operator === ts.SyntaxKind.ReadonlyKeyword && ts.isArrayTypeNode(t.type)) return `${zodOf(t.type, ctx, keyPath)}.readonly()`;
  if (ts.isTupleTypeNode(t)) return `z.tuple([${t.elements.map((e, i) => zodOf(e, ctx, [...keyPath, String(i)])).join(', ')}])`;
  return no(`kind:${ts.SyntaxKind[t.kind]}`);
};
// unionBranch: a top-level object branch takes the owner's name and no key (B3); a nested one takes owner + key.
const zodObject = (tl, ctx, keyPath, unionBranch) => {
  if (tl.members.some(isFnMember)) no('mixed-data-and-functions');
  const fields = tl.members.map((m) => {
    if (!ts.isPropertySignature(m) || !m.type || !(ts.isIdentifier(m.name) || ts.isStringLiteral(m.name))) return no(`member:${ts.SyntaxKind[m.kind]}`);
    const key = m.name.text;
    let z = zodOf(m.type, ctx, [...keyPath, key]);
    if (m.questionToken) z += '.optional()';
    return `${/^[A-Za-z_$][\w$]*$/u.test(key) ? key : q(key)}: ${z}`;
  });
  return `z.object({ ${fields.join(', ')} }).brand<'${ctx.owner}${unionBranch ? '' : keyPath.map(pascal).join('')}'>()`;
};

// The type text a function or variable declares, split into what becomes the contract and what stays around it.
const splitType = (typeNode, sf) => {
  let t = typeNode;
  let promise = false;
  for (;;) {
    if (ts.isTypeReferenceNode(t) && t.typeName.getText(sf) === 'Promise' && t.typeArguments?.length === 1) {
      t = t.typeArguments[0];
      promise = true;
    } else if (ts.isParenthesizedTypeNode(t)) t = t.type;
    else break;
  }
  const inner = t;
  let rest = [t];
  let nullable = false;
  let optional = false;
  if (ts.isUnionTypeNode(t)) {
    const parts = t.types.filter((x) => {
      if (isNullKw(x)) return (nullable = true), false;
      if (isUndefKw(x)) return (optional = true), false;
      return true;
    });
    if (parts.length) rest = parts;
    else (nullable = false), (optional = false);
  }
  return { inner, rest, promise, nullable, optional };
};

const printShape = (s, base, env = {}) => {
  const ctx = {
    sf: s.sf,
    owner: base,
    fileImports: s.fileImports,
    refs: new Map(),
    gateway: new Map(),
    localAliases: s.localAliases,
    localShapes: env.localShapes ?? new Map(),
    locals: new Set(),
    expandedAliases: new Set(),
    expanding: new Set(),
    pkg: s.pkg,
  };
  try {
    const sp = splitType(s.typeNode, s.sf);
    if (s.kind === 'alias' && !sp.rest.length) return { ok: false, reason: 'empty' };
    const code = zodMembers(sp.rest, ctx, []);
    if (!/^z\.(object|discriminatedUnion|union|array|record|map|set|tuple)/u.test(code)) return { ok: false, reason: 'not-an-object-shape' };
    return { ok: true, code, base, ctx, refs: ctx.refs, gateway: ctx.gateway, locals: ctx.locals, expanded: ctx.expandedAliases, split: sp };
  } catch (e) {
    if (e instanceof Unprintable) return { ok: false, reason: e.message };
    throw e;
  }
};

// ---- census ----
const TEST_FILE = /\.(test|integration\.test|e2e|spec)\.tsx?$/u;
const EXEMPT_DIR = /\/(widgets|contracts|node_modules|dist)\//u;
const folderTypeOf = (f) => (/\/src\/([^/]+)\//u.exec('/' + rel(f)) ?? [])[1] ?? (/\/(test|e2e)\//u.test(rel(f)) ? 'test-dir' : 'other');

const census = (pkgFilter = []) => {
  const shapes = [];
  for (const w of ws) {
    if (w.isGateway || (pkgFilter.length && !pkgFilter.includes(w.short))) continue;
    const dirs = ['src', 'test', 'e2e'].map((d) => path.join(w.dir, d));
    for (const f of dirs.flatMap((d) => lib.walk(d))) {
      if (/\.(proxy|stub|harness)\.tsx?$/u.test(f) || EXEMPT_DIR.test('/' + rel(f))) continue;
      const isTest = TEST_FILE.test(f) || /\/(test|e2e)\//u.test('/' + rel(f));
      const text = fs.readFileSync(f, 'utf8');
      if (!text.includes('{')) continue;
      const sf = lib.parse(f, text);
      const fileImports = new Map();
      const localAliases = new Map();
      for (const st of sf.statements) {
        if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings))
          for (const e of st.importClause.namedBindings.elements) fileImports.set(e.name.text, st.moduleSpecifier.text);
        if (ts.isTypeAliasDeclaration(st)) localAliases.set(st.name.text, st);
      }
      const add = (kind, node, typeNode, name, fnNode, decl) => {
        const lits = literalsIn(typeNode);
        if (!lits.length) return;
        const data = lits.filter((l) => literalClass(l) !== 'method-set');
        shapes.push({
          file: f, pkg: w.name, isTest, kind, name, typeNode, node, fnNode, decl, sf, fileImports, localAliases,
          klass: data.length ? (data.some((l) => literalClass(l) === 'mixed') ? 'mixed' : 'data') : 'method-set',
          text: typeNode.getText(sf), ft: folderTypeOf(f), fileBase: path.basename(f).replace(/\.tsx?$/u, ''),
        });
      };
      for (const st of sf.statements) {
        if (ts.isTypeAliasDeclaration(st)) add('alias', st, st.type, st.name.text);
        else if (ts.isFunctionDeclaration(st) && st.type) add('return', st, st.type, st.name?.text ?? 'default', st);
        else if (ts.isVariableStatement(st)) {
          for (const d of st.declarationList.declarations) {
            const nm = ts.isIdentifier(d.name) ? d.name.text : '?';
            if (d.type) add('variable', st, d.type, nm, undefined, d);
            const init = d.initializer;
            if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) && init.type) add('return', st, init.type, nm, init, d);
            if (init && (ts.isNewExpression(init) || ts.isCallExpression(init)) && init.typeArguments) init.typeArguments.forEach((a) => add('typearg', st, a, nm, undefined, d));
          }
        }
      }
    }
  }
  return shapes;
};

module.exports = { census, printShape, splitType, folderTypeOf, typeIndex, contractNames, contractDirs, pascal, camel, kebab, q, isFnMember, literalsIn, literalClass, Unprintable, GATEWAY_TYPES, gatewaySpec, gatewayKind, isNullKw, isUndefKw, ws };

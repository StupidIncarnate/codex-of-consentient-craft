// B04 (d) prototype: turn a hand-built `TsestreeStub({ type, ... })` tree into a code string for the
// gateway's `<Node>Stub({ code })`, then PROVE the print by parsing it with the real parser and
// checking every field the hand-built tree set against the parsed node.
const fs = require('fs');
const path = require('path');
const lib = require('../../lib/repo.cjs');
const { ts, ROOT, rel } = lib;
const { parse, simpleTraverse } = lib.rootRequire('@typescript-eslint/typescript-estree');

class Unsupported extends Error {}
const bad = (r) => {
  throw new Unsupported(r);
};

const findConst = (id) => {
  for (let n = id.parent; n; n = n.parent) {
    const stmts = n.statements ?? (ts.isBlock(n) ? n.statements : null);
    if (!stmts) continue;
    for (const st of stmts) {
      if (!ts.isVariableStatement(st) || !(st.declarationList.flags & ts.NodeFlags.Const)) continue;
      for (const d of st.declarationList.declarations) {
        if (ts.isIdentifier(d.name) && d.name.text === id.text && d.initializer && d.end <= id.getStart()) return d;
      }
    }
  }
  return null;
};
// ---- evaluate the ts AST of a stub call into a plain tree -------------------------------------
const evalExpr = (e, sf) => {
  if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return e.text;
  if (ts.isNumericLiteral(e)) return Number(e.text);
  if (e.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (e.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (e.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isIdentifier(e) && e.text === 'undefined') return undefined;
  if (ts.isParenthesizedExpression(e)) return evalExpr(e.expression, sf);
  if (ts.isIdentifier(e)) {
    // a same-file `const x = <stub tree | literal>` in an enclosing block or the file
    const decl = findConst(e);
    if (decl) return evalExpr(decl.initializer, sf);
    return bad('expr:Identifier');
  }
  if (ts.isAsExpression(e)) return evalExpr(e.expression, sf);
  if (ts.isPrefixUnaryExpression(e) && e.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(e.operand)) return -Number(e.operand.text);
  if (ts.isArrayLiteralExpression(e)) return e.elements.map((x) => (ts.isSpreadElement(x) ? bad('array-spread') : evalExpr(x, sf)));
  if (ts.isObjectLiteralExpression(e)) return evalObject(e, sf, false);
  if (ts.isCallExpression(e) && ts.isIdentifier(e.expression) && /^[A-Z]\w*Stub$/u.test(e.expression.text) && e.expression.text !== 'TsestreeStub' && e.arguments.length === 1 && ts.isObjectLiteralExpression(e.arguments[0]) && e.arguments[0].properties.length === 1 && ts.isPropertyAssignment(e.arguments[0].properties[0]) && e.arguments[0].properties[0].name.getText(sf) === 'value') {
    return evalExpr(e.arguments[0].properties[0].initializer, sf);
  }
  if (ts.isCallExpression(e) && ts.isIdentifier(e.expression) && e.expression.text === 'TsestreeStub') {
    const a = e.arguments[0];
    if (!a) return { __node: true, type: 'Identifier', props: {} };
    if (!ts.isObjectLiteralExpression(a)) bad('stub-arg-not-literal');
    return evalObject(a, sf, true);
  }
  return bad(`expr:${ts.SyntaxKind[e.kind]}:${e.getText(sf).slice(0, 40).replace(/\s+/gu, ' ')}`);
};
const evalObject = (o, sf, isNode) => {
  const props = {};
  let type = null;
  for (const p of o.properties) {
    if (!ts.isPropertyAssignment(p) && !ts.isShorthandPropertyAssignment(p)) bad(`prop:${ts.SyntaxKind[p.kind]}`);
    const k = p.name.text ?? bad('computed-key');
    if (ts.isShorthandPropertyAssignment(p)) {
      const d = findConst(p.name);
      if (!d) bad('shorthand-var');
      props[k] = evalExpr(d.initializer, sf);
      continue;
    }
    if (isNode && k === 'type') {
      const v = p.initializer;
      if (ts.isStringLiteral(v)) type = v.text;
      else if (ts.isPropertyAccessExpression(v) && v.expression.getText(sf) === 'TsestreeNodeType') type = v.name.text;
      else bad('type-not-literal');
      continue;
    }
    props[k] = evalExpr(p.initializer, sf);
  }
  if (isNode) return { __node: true, type: type ?? 'Identifier', props };
  return props;
};

// ---- printer ---------------------------------------------------------------------------------
const isNode = (v) => v && typeof v === 'object' && v.__node;
const TYPE_KEYWORDS = { TSStringKeyword: 'string', TSNumberKeyword: 'number', TSBooleanKeyword: 'boolean', TSVoidKeyword: 'void', TSUndefinedKeyword: 'undefined', TSNullKeyword: 'null', TSAnyKeyword: 'any', TSUnknownKeyword: 'unknown', TSNeverKeyword: 'never', TSObjectKeyword: 'object' };
const list = (v) => (Array.isArray(v) ? v : v === undefined ? [] : bad('expected-array'));
const paren = (n, s) => (isNode(n) && ['ArrowFunctionExpression', 'BinaryExpression', 'LogicalExpression', 'ConditionalExpression', 'AssignmentExpression', 'AwaitExpression', 'UnaryExpression', 'FunctionExpression'].includes(n.type) ? `(${s})` : s);

const pr = (n) => {
  if (!isNode(n)) bad('not-a-node');
  const p = n.props;
  const P = (k, dflt) => (p[k] === undefined ? dflt : pr(p[k]));
  const t = n.type;
  const extraOk = new Set();
  const keys = Object.keys(p);
  const ann = () => (p.typeAnnotation ? `: ${prType(p.typeAnnotation)}` : '');
  switch (t) {
    case 'Identifier':
      return `${p.name ?? 'x'}${p.optional ? '?' : ''}${ann()}`;
    case 'Literal': {
      if (p.regex) return `/${p.regex.pattern}/${p.regex.flags ?? ''}`;
      if (p.raw !== undefined) return String(p.raw);
      const v = p.value;
      if (v === undefined) return '0';
      return typeof v === 'string' ? JSON.stringify(v) : String(v);
    }
    case 'MemberExpression': {
      const o = paren(p.object, P('object', 'a'));
      const prop = P('property', 'b');
      if (p.computed) return `${o}${p.optional ? '?.' : ''}[${prop}]`;
      return `${o}${p.optional ? '?.' : '.'}${prop}`;
    }
    case 'CallExpression': {
      const c = paren(p.callee, P('callee', 'f'));
      const targs = p.typeArguments ? `<${list(p.typeArguments.props?.params ?? []).map(prType).join(', ')}>` : '';
      return `${c}${p.optional ? '?.' : ''}${targs}(${list(p.arguments).map(pr).join(', ')})`;
    }
    case 'NewExpression':
      return `new ${P('callee', 'F')}(${list(p.arguments).map(pr).join(', ')})`;
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
    case 'FunctionDeclaration': {
      const params = list(p.params).map(pr).join(', ');
      const ret = p.returnType ? `: ${prType(p.returnType)}` : '';
      let body = p.body === undefined ? '{}' : pr(p.body);
      if (t === 'ArrowFunctionExpression') {
        if (isNode(p.body) && p.body.type === 'ObjectExpression') body = `(${body})`;
        return `${p.async ? 'async ' : ''}(${params})${ret} => ${body}`;
      }
      const id = p.id ? pr(p.id) : t === 'FunctionDeclaration' ? 'f' : '';
      return `${p.async ? 'async ' : ''}function ${id}(${params})${ret} ${body}`;
    }
    case 'BlockStatement':
      return `{ ${list(p.body).map(pr).join(' ')} }`;
    case 'Program':
      return list(p.body).map(pr).join('\n');
    case 'ReturnStatement':
      return `return${p.argument ? ' ' + pr(p.argument) : ''};`;
    case 'ExpressionStatement':
      return `${paren2(p.expression, P('expression', 'x'))};`;
    case 'IfStatement':
      return `if (${P('test', 'x')}) ${P('consequent', '{}')}${p.alternate ? ' else ' + pr(p.alternate) : ''}`;
    case 'VariableDeclaration':
      return `${p.kind ?? 'const'} ${list(p.declarations).map(pr).join(', ') || 'x'};`.replace(/;;$/u, ';');
    case 'VariableDeclarator':
      return `${P('id', 'x')}${p.init === undefined ? '' : ' = ' + pr(p.init)}`;
    case 'ObjectExpression':
      return `{ ${list(p.properties).map(pr).join(', ')} }`;
    case 'ObjectPattern':
      return `{ ${list(p.properties).map(pr).join(', ')} }${ann()}`;
    case 'ArrayExpression':
      return `[${list(p.elements).map(pr).join(', ')}]`;
    case 'Property': {
      const k = P('key', 'a');
      if (p.shorthand) return p.value && isNode(p.value) && p.value.type === 'AssignmentPattern' ? pr(p.value) : k;
      return p.computed ? `[${k}]: ${P('value', 'v')}` : `${k}: ${P('value', 'v')}`;
    }
    case 'SpreadElement':
      return `...${P('argument', 'x')}`;
    case 'RestElement':
      return `...${P('argument', 'x')}`;
    case 'AssignmentPattern':
      return `${P('left', 'x')} = ${P('right', '0')}`;
    case 'AssignmentExpression':
      return `${P('left', 'x')} ${p.operator ?? '='} ${P('right', '0')}`;
    case 'BinaryExpression':
    case 'LogicalExpression':
      return `${P('left', 'a')} ${p.operator ?? (t === 'LogicalExpression' ? '&&' : '+')} ${P('right', 'b')}`;
    case 'UnaryExpression': {
      const op = p.operator ?? '!';
      return `${op}${/[a-z]/u.test(op) ? ' ' : ''}${paren(p.argument, P('argument', 'x'))}`;
    }
    case 'ThrowStatement':
      return `throw ${P('argument', 'x')};`;
    case 'UpdateExpression':
      return p.prefix ? `${p.operator ?? '++'}${P('argument', 'x')}` : `${P('argument', 'x')}${p.operator ?? '++'}`;
    case 'ArrayPattern':
      return `[${list(p.elements).map(pr).join(', ')}]${ann()}`;
    case 'ImportDefaultSpecifier':
      return P('local', 'x');
    case 'ImportNamespaceSpecifier':
      return `* as ${P('local', 'x')}`;
    case 'ExportDefaultDeclaration':
      return `export default ${P('declaration', 'x')};`;
    case 'ExportAllDeclaration':
      return `export * from ${P('source', "'x'")};`;
    case 'AwaitExpression':
      return `await ${P('argument', 'x')}`;
    case 'ConditionalExpression':
      return `${P('test', 'a')} ? ${P('consequent', 'b')} : ${P('alternate', 'c')}`;
    case 'TSAsExpression':
      return `${P('expression', 'x')} as ${p.typeAnnotation ? prType(p.typeAnnotation) : 'unknown'}`;
    case 'ChainExpression':
      return P('expression', 'a?.b');
    case 'ImportDeclaration': {
      const specs = list(p.specifiers);
      const src = P('source', "'x'");
      const defaults = specs.filter((x) => isNode(x) && (x.type === 'ImportDefaultSpecifier' || x.type === 'ImportNamespaceSpecifier'));
      const named = specs.filter((x) => !defaults.includes(x));
      const parts = [...defaults.map(pr), ...(named.length ? [`{ ${named.map(pr).join(', ')} }`] : [])];
      return `import${p.importKind === 'type' ? ' type' : ''} ${parts.length ? `${parts.join(', ')} from ` : ''}${src};`;
    }
    case 'ImportSpecifier': {
      const imp = P('imported', 'x');
      const loc = p.local ? pr(p.local) : imp;
      return imp === loc ? imp : `${imp} as ${loc}`;
    }
    case 'ExportNamedDeclaration':
      return p.declaration ? `export ${p.exportKind === 'type' ? 'type ' : ''}${pr(p.declaration)}` : `export { x };`;
    case 'TemplateLiteral':
      bad('TemplateLiteral');
    // fallthrough
    default:
      if (TYPE_KEYWORDS[t] || t.startsWith('TS')) return prTypeRoot(n);
      return bad(`no-printer:${t}`);
  }
};
const paren2 = (n, s) => (isNode(n) && (n.type === 'ObjectExpression' || n.type === 'FunctionExpression') ? `(${s})` : s);

const prType = (n) => {
  if (!isNode(n)) bad('type-not-node');
  const p = n.props;
  const t = n.type;
  if (TYPE_KEYWORDS[t]) return TYPE_KEYWORDS[t];
  switch (t) {
    case 'TSTypeAnnotation':
      return p.typeAnnotation ? prType(p.typeAnnotation) : 'unknown';
    case 'TSTypeReference': {
      const tn = p.typeName ? pr(p.typeName) : 'T';
      const args = p.typeArguments ? `<${list(p.typeArguments.props?.params ?? []).map(prType).join(', ')}>` : '';
      return `${tn}${args}`;
    }
    case 'TSTypeLiteral':
      return `{ ${list(p.members).map(prMember).join('; ')} }`;
    case 'TSArrayType':
      return `${prType(p.elementType)}[]`;
    case 'TSUnionType':
      return list(p.types).map(prType).join(' | ');
    case 'TSLiteralType':
      return pr(p.literal);
    default:
      return bad(`no-type-printer:${t}`);
  }
};
const prMember = (m) => {
  if (!isNode(m) || m.type !== 'TSPropertySignature') return bad(`member:${m?.type}`);
  const p = m.props;
  return `${p.key ? pr(p.key) : 'a'}${p.optional ? '?' : ''}${p.typeAnnotation ? ': ' + prType(p.typeAnnotation) : ''}`;
};
const prTypeRoot = (n) => {
  // a node that only exists inside a wrapper: print the smallest valid wrapper
  const t = n.type;
  if (t === 'TSTypeAnnotation') return `let x: ${prType(n)};`;
  if (t === 'TSPropertySignature') return `type T = { ${prMember(n)} };`;
  if (t === 'TSTypeLiteral') return `type T = ${prType(n)};`;
  if (t === 'TSTypeReference' || TYPE_KEYWORDS[t] || t === 'TSArrayType' || t === 'TSUnionType') return `let x: ${prType(n)};`;
  return bad(`no-root-wrapper:${t}`);
};

// A node that is the ROOT of a call: some kinds only exist inside a wrapper.
const printRoot = (n) => {
  const t = n.type;
  const WRAP = {
    ObjectPattern: (s) => `const ${s} = y;`,
    ImportSpecifier: (s) => `import { ${s} } from 'x';`,
    Property: (s) => `const o = { ${s} };`,
    VariableDeclarator: (s) => `const ${s};`,
    SpreadElement: (s) => `f(${s});`,
    AssignmentPattern: (s) => `const { ${s} } = y;`,
    ArrowFunctionExpression: (s) => `const f = ${s};`,
    FunctionExpression: (s) => `const f = ${s};`,
    ObjectExpression: (s) => `const o = ${s};`,
    ArrayExpression: (s) => `const a = ${s};`,
    CallExpression: (s) => `${s};`,
    MemberExpression: (s) => `${s};`,
    Identifier: (s) => `${s};`,
    Literal: (s) => `const l = ${s};`,
    ImportDeclaration: (s) => s,
  };
  const s = pr(n);
  if (t === 'Identifier' && n.props.typeAnnotation) return `const ${s};`.replace(/;;$/u, ';');
  if (WRAP[t]) {
    if (t === 'CallExpression' || t === 'MemberExpression' || t === 'Identifier') return paren2(n, s).replace(/^/u, '') + ';';
    return WRAP[t](s);
  }
  return s;
};

// ---- round-trip proof --------------------------------------------------------------------------
const findFirst = (ast, type) => {
  let hit = null;
  simpleTraverse(ast, { enter: (node) => { if (!hit && node.type === type) hit = node; } }, true);
  return hit;
};
const IGNORE = new Set(['parent', 'range', 'loc', 'raw']);
const subset = (spec, real, pathStr, out) => {
  if (isNode(spec)) {
    if (!real || typeof real !== 'object') return out.push(`${pathStr}: expected node ${spec.type}, got ${real}`);
    if (real.type !== spec.type) return out.push(`${pathStr}: type ${spec.type} vs parsed ${real.type}`);
    for (const [k, v] of Object.entries(spec.props)) {
      if (IGNORE.has(k)) continue;
      subset(v, real[k], `${pathStr}.${k}`, out);
    }
    return;
  }
  if (Array.isArray(spec)) {
    if (!Array.isArray(real)) return out.push(`${pathStr}: expected array`);
    if (real.length !== spec.length) return out.push(`${pathStr}: length ${spec.length} vs ${real.length}`);
    spec.forEach((s, i) => subset(s, real[i], `${pathStr}[${i}]`, out));
    return;
  }
  if (spec && typeof spec === 'object') {
    for (const [k, v] of Object.entries(spec)) subset(v, real?.[k], `${pathStr}.${k}`, out);
    return;
  }
  if (spec !== real && !(spec === undefined && (real === undefined || real === null))) out.push(`${pathStr}: ${JSON.stringify(spec)} vs ${real && typeof real === 'object' ? '<' + (real.type ?? 'obj') + '>' : JSON.stringify(real)}`);
};

const needsJsx = (n) => false;

// Converts one root call; returns { ok, code, rootType } or { ok:false, reason }
const convertRoot = (call, sf) => {
  let tree;
  try {
    tree = evalExpr(call, sf);
    if (tree.props.parent !== undefined && tree.props.parent !== null) bad('explicit-parent');
    const extra = Object.keys(tree.props).filter((k) => ['range', 'loc'].includes(k));
    if (extra.length) bad('explicit-range');
    const code = printRoot(tree);
    let ast;
    try {
      ast = parse(code, { range: true, loc: true });
    } catch (e) {
      return { ok: false, reason: 'printed-code-does-not-parse', code };
    }
    const real = findFirst(ast, tree.type);
    if (!real) return { ok: false, reason: `printed-code-has-no-${tree.type}`, code };
    const diffs = [];
    subset(tree, real, tree.type, diffs);
    if (diffs.length) return { ok: false, reason: 'roundtrip-mismatch', code, diffs };
    return { ok: true, code, rootType: tree.type };
  } catch (e) {
    if (e instanceof Unsupported) return { ok: false, reason: e.message };
    throw e;
  }
};

module.exports = { convertRoot, evalExpr };

if (require.main === module) {
  const pkgs = ['eslint-plugin', 'local-eslint'];
  const files = pkgs.flatMap((p) => lib.walk(path.join(ROOT, 'packages', p)));
  const res = { callsAll: 0, callsOk: 0, total: 0, ok: 0, reasons: {}, rootTypes: {}, mismatchSamples: [], perFile: {} };
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    if (!text.includes('TsestreeStub(')) continue;
    if (/tsestree\.stub\.ts$|tsestree-contract/u.test(f)) continue;
    const sf = lib.parse(f, text);
    res.callsAll += (text.match(/TsestreeStub\(/gu) || []).length;
    const roots = [];
    const visit = (n, inStub) => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'TsestreeStub') {
        if (!inStub) roots.push(n);
        n.arguments.forEach((a) => visit(a, true));
        return;
      }
      ts.forEachChild(n, (c) => visit(c, inStub));
    };
    visit(sf, false);
    for (const r of roots) {
      res.total++;
      const c = convertRoot(r, sf);
      const fr = (res.perFile[rel(f)] ??= { total: 0, ok: 0 });
      fr.total++;
      if (c.ok) {
        res.ok++;
        fr.ok++;
        res.callsOk += (r.getText(sf).match(/TsestreeStub\(/gu) || []).length;
        res.rootTypes[c.rootType] = (res.rootTypes[c.rootType] ?? 0) + 1;
      } else {
        const key = c.reason.replace(/:.*/u, (m) => m);
        res.reasons[key] = (res.reasons[key] ?? 0) + 1;
        if (c.diffs) { const allUndef = c.diffs.every((d) => /: undefined vs |expected node \w+, got null|expected array/u.test(d)); const kk = allUndef ? 'mismatch:explicit-undefined-or-null (malformed-node test)' : 'mismatch:other'; res.reasons[kk] = (res.reasons[kk] ?? 0) + 1; }
        if (c.diffs && res.mismatchSamples.length < 400) res.mismatchSamples.push({ file: rel(f), line: sf.getLineAndCharacterOfPosition(r.getStart(sf)).line + 1, code: c.code, diffs: c.diffs.slice(0, 3) });
      }
    }
  }
  fs.mkdirSync(lib.outDir(__dirname), { recursive: true });
  fs.writeFileSync(path.join(lib.outDir(__dirname), 'stubprint.json'), JSON.stringify(res, null, 1));
  const top = (o, n = 40) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map((e) => e.join(':')).join('  ');
  console.log(`roots total=${res.total} converted+verified=${res.ok} (${((100 * res.ok) / res.total).toFixed(1)}%)`);
  console.log(`TsestreeStub( calls: ${res.callsAll} total, ${res.callsOk} inside verified roots (${((100 * res.callsOk) / res.callsAll).toFixed(1)}%)`);
  console.log('files fully convertible:', Object.values(res.perFile).filter((x) => x.ok === x.total).length, 'of', Object.keys(res.perFile).length);
  console.log('REASONS', top(res.reasons));
  console.log('ROOTTYPES(ok)', top(res.rootTypes));
}

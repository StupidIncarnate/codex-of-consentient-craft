// B04 (d) prototype: turn a hand-built `TsestreeStub({ type, ... })` tree into a code string for the
// gateway's `<Node>Stub({ code })`, then PROVE the print by parsing it with the real parser and
// checking every field the hand-built tree set against the parsed node.
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');
const { ts, ROOT, rel } = lib;
const { parse, simpleTraverse } = lib.rootRequire('@typescript-eslint/typescript-estree');

class Unsupported extends Error {}
const bad = (r) => {
  throw new Unsupported(r);
};

// A same-file binding visible from `id`: a `const` initializer, or a function declaration / arrow bound to a const.
const findBinding = (id) => {
  const name = id.text;
  for (let n = id.parent; n; n = n.parent) {
    const stmts = n.statements ?? (ts.isBlock(n) ? n.statements : null);
    if (!stmts) continue;
    for (const st of stmts) {
      if (ts.isFunctionDeclaration(st) && st.name?.text === name) return { fn: st };
      if (!ts.isVariableStatement(st) || !(st.declarationList.flags & ts.NodeFlags.Const)) continue;
      for (const d of st.declarationList.declarations) {
        if (ts.isIdentifier(d.name) && d.name.text === name && d.initializer) {
          if (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer)) return { fn: d.initializer };
          if (d.end <= id.getStart()) return { init: d.initializer };
        }
      }
    }
  }
  return null;
};
const findConst = (id) => {
  const b = findBinding(id);
  return b?.init ? { initializer: b.init } : null;
};
const NODE_KEYS = lib.rootRequire('@typescript-eslint/types').AST_NODE_TYPES;

// ---- evaluate the ts AST of a stub call into a plain tree -------------------------------------
// env: Map of names bound by an inlined local helper (parameters and its own consts).
const isStubName = (n) => /^[A-Z]\w*Stub$/u.test(n);
const evalExpr = (e, sf, env = new Map(), depth = 0) => {
  if (depth > 40) bad('depth');
  const ev = (x) => evalExpr(x, sf, env, depth + 1);
  if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return e.text;
  if (ts.isNumericLiteral(e)) return Number(e.text);
  if (e.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (e.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (e.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isIdentifier(e) && e.text === 'undefined') return undefined;
  if (ts.isParenthesizedExpression(e)) return ev(e.expression);
  if (ts.isTemplateExpression(e)) {
    let s = e.head.text;
    for (const sp of e.templateSpans) {
      const v = ev(sp.expression);
      if (typeof v !== 'string' && typeof v !== 'number') bad('template-substitution');
      s += v + sp.literal.text;
    }
    return s;
  }
  if (ts.isIdentifier(e)) {
    if (env.has(e.text)) return env.get(e.text);
    const decl = findConst(e);
    if (decl) return ev(decl.initializer);
    return bad('expr:Identifier');
  }
  if (ts.isAsExpression(e) || ts.isNonNullExpression(e) || ts.isSatisfiesExpression?.(e)) return ev(e.expression);
  if (ts.isPrefixUnaryExpression(e) && e.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(e.operand)) return -Number(e.operand.text);
  if (ts.isPrefixUnaryExpression(e) && e.operator === ts.SyntaxKind.ExclamationToken) return !ev(e.operand);
  if (ts.isConditionalExpression(e)) return ev(e.condition) ? ev(e.whenTrue) : ev(e.whenFalse);
  if (ts.isBinaryExpression(e) && [ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.BarBarToken].includes(e.operatorToken.kind)) {
    const l = ev(e.left);
    return l === undefined || l === null ? ev(e.right) : l;
  }
  if (ts.isArrayLiteralExpression(e)) {
    const out = [];
    for (const x of e.elements) {
      if (ts.isSpreadElement(x)) {
        const v = ev(x.expression);
        if (!Array.isArray(v)) bad('array-spread');
        out.push(...v);
      } else out.push(ev(x));
    }
    return out;
  }
  if (ts.isObjectLiteralExpression(e)) return evalObject(e, sf, false, env, depth + 1);
  if (ts.isPropertyAccessExpression(e)) {
    if (ts.isIdentifier(e.expression) && e.expression.text === 'TsestreeNodeType') return e.name.text;
    const o = ev(e.expression);
    if (o && typeof o === 'object' && !isNode(o) && e.name.text in o) return o[e.name.text];
    if (Array.isArray(o) && e.name.text === 'length') return o.length;
    return bad(`expr:PropertyAccess:${e.getText(sf).slice(0, 40)}`);
  }
  if (ts.isCallExpression(e)) {
    const callee = e.expression;
    if (ts.isIdentifier(callee) && isStubName(callee.text) && callee.text !== 'TsestreeStub' && e.arguments.length === 1 && ts.isObjectLiteralExpression(e.arguments[0]) && e.arguments[0].properties.length === 1 && ts.isPropertyAssignment(e.arguments[0].properties[0]) && e.arguments[0].properties[0].name.getText(sf) === 'value') return ev(e.arguments[0].properties[0].initializer);
    if (ts.isIdentifier(callee) && callee.text === 'TsestreeStub') {
      const a = e.arguments[0];
      if (!a) return { __node: true, type: 'Identifier', props: {} };
      if (!ts.isObjectLiteralExpression(a)) bad('stub-arg-not-literal');
      return evalObject(a, sf, true, env, depth + 1);
    }
    // `list.map((x) => ...)`
    if (ts.isPropertyAccessExpression(callee) && callee.name.text === 'map' && e.arguments.length === 1 && (ts.isArrowFunction(e.arguments[0]) || ts.isFunctionExpression(e.arguments[0]))) {
      const list = ev(callee.expression);
      if (!Array.isArray(list)) bad('map-receiver');
      return list.map((item, i) => callFn(e.arguments[0], [item, i], sf, env, depth + 1));
    }
    // a same-file helper: `buildX({ a: 'b' })`
    if (ts.isIdentifier(callee) && !env.has(callee.text)) {
      const b = findBinding(callee);
      if (b?.fn) return callFn(b.fn, e.arguments.map(ev), sf, env, depth + 1, true);
    }
    return bad(`expr:CallExpression:${e.getText(sf).slice(0, 40).replace(/\s+/gu, ' ')}`);
  }
  return bad(`expr:${ts.SyntaxKind[e.kind]}:${e.getText(sf).slice(0, 40).replace(/\s+/gu, ' ')}`);
};

// Run a local function on evaluated arguments; only `const` statements and one `return` are followed.
const callFn = (fn, args, sf, outer, depth, fresh = false) => {
  const env = new Map(fresh ? [] : outer);
  const bindParam = (p, v) => {
    if (ts.isIdentifier(p.name)) env.set(p.name.text, v === undefined && p.initializer ? evalExpr(p.initializer, sf, env, depth + 1) : v);
    else if (ts.isObjectBindingPattern(p.name)) {
      const src = v === undefined && p.initializer ? evalExpr(p.initializer, sf, env, depth + 1) : v;
      if (!src || typeof src !== 'object' || isNode(src)) bad('param-destructure-source');
      for (const be of p.name.elements) {
        if (!ts.isIdentifier(be.name) || be.dotDotDotToken) bad('param-pattern');
        const key = (be.propertyName ?? be.name).text;
        env.set(be.name.text, src[key] === undefined && be.initializer ? evalExpr(be.initializer, sf, env, depth + 1) : src[key]);
      }
    } else bad('param-pattern');
  };
  fn.parameters.forEach((p, i) => bindParam(p, args[i]));
  const body = fn.body;
  if (!ts.isBlock(body)) return evalExpr(body, sf, env, depth + 1);
  for (const st of body.statements) {
    if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (!ts.isIdentifier(d.name) || !d.initializer) bad('helper-statement');
        env.set(d.name.text, evalExpr(d.initializer, sf, env, depth + 1));
      }
    } else if (ts.isReturnStatement(st) && st.expression) return evalExpr(st.expression, sf, env, depth + 1);
    else bad(`helper-statement:${ts.SyntaxKind[st.kind]}`);
  }
  return bad('helper-no-return');
};

const evalObject = (o, sf, isNodeObj, env = new Map(), depth = 0) => {
  const props = {};
  let type = null;
  let typeSeen = false;
  for (const p of o.properties) {
    if (ts.isSpreadAssignment(p)) {
      const v = evalExpr(p.expression, sf, env, depth + 1);
      if (!v || typeof v !== 'object' || isNode(v) || Array.isArray(v)) bad('object-spread');
      Object.assign(props, v);
      continue;
    }
    if (!ts.isPropertyAssignment(p) && !ts.isShorthandPropertyAssignment(p)) bad(`prop:${ts.SyntaxKind[p.kind]}`);
    const k = p.name.text ?? bad('computed-key');
    if (ts.isShorthandPropertyAssignment(p)) {
      if (env.has(k)) props[k] = env.get(k);
      else {
        const d = findConst(p.name);
        if (!d) bad('shorthand-var');
        props[k] = evalExpr(d.initializer, sf, env, depth + 1);
      }
      continue;
    }
    if (k === 'type') {
      const v = p.initializer;
      let tv = null;
      if (ts.isStringLiteral(v)) tv = v.text;
      else if (ts.isPropertyAccessExpression(v) && v.expression.getText(sf) === 'TsestreeNodeType') tv = v.name.text;
      if (tv !== null && (isNodeObj || NODE_KEYS[tv])) {
        type = tv;
        typeSeen = true;
        continue;
      }
      if (isNodeObj) bad('type-not-literal');
    }
    props[k] = evalExpr(p.initializer, sf, env, depth + 1);
  }
  if (isNodeObj || typeSeen) return { __node: true, type: type ?? 'Identifier', props };
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
      if (p.declaration) return `export ${p.exportKind === 'type' ? 'type ' : ''}${pr(p.declaration)}`;
      return `export ${p.exportKind === 'type' ? 'type ' : ''}{ ${list(p.specifiers).map(pr).join(', ')} }${p.source ? ' from ' + pr(p.source) : ''};`;
    case 'TemplateLiteral': {
      const qs = list(p.quasis);
      const xs = list(p.expressions);
      if (qs.length !== xs.length + 1 && qs.length) bad('template-shape');
      const raw = (q) => (isNode(q) && q.props.value && typeof q.props.value === 'object' ? q.props.value.raw ?? q.props.value.cooked ?? '' : '');
      if (!qs.length) return '`${' + (xs.map(pr).join('}${') || 'x') + '}`';
      return '`' + qs.map((q, i) => raw(q) + (i < xs.length ? '${' + pr(xs[i]) + '}' : '')).join('') + '`';
    }
    case 'TemplateElement':
      return '`' + (p.value?.raw ?? '') + '`';
    case 'JSXIdentifier':
      return p.name ?? 'div';
    case 'JSXText':
      return p.value ?? p.raw ?? 'text';
    case 'JSXEmptyExpression':
      return '';
    case 'JSXExpressionContainer':
      return `{${p.expression === undefined ? '' : pr(p.expression)}}`;
    case 'JSXAttribute': {
      const v = p.value === undefined ? '' : `=${isNode(p.value) && p.value.type === 'Literal' ? JSON.stringify(String(p.value.props.value ?? '')) : pr(p.value)}`;
      return `${p.name ? pr(p.name) : 'a'}${v}`;
    }
    case 'JSXOpeningElement':
      return `<${p.name ? pr(p.name) : 'div'}${list(p.attributes).map((a) => ' ' + pr(a)).join('')}>`;
    case 'JSXElement': {
      const op = isNode(p.openingElement) ? p.openingElement : null;
      const name = op?.props.name ? pr(op.props.name) : 'div';
      const attrs = op ? list(op.props.attributes).map((a) => ' ' + pr(a)).join('') : '';
      const kids = list(p.children).map(pr).join('');
      return kids ? `<${name}${attrs}>${kids}</${name}>` : `<${name}${attrs} />`;
    }
    case 'JSXFragment':
      return `<>${list(p.children).map(pr).join('')}</>`;
    case 'ClassBody':
      return `{ ${list(p.body).map(pr).join(' ')} }`;
    case 'ClassDeclaration':
    case 'ClassExpression':
      return `class ${p.id ? pr(p.id) : 'A'}${p.superClass ? ' extends ' + pr(p.superClass) : ''} ${p.body ? pr(p.body) : '{}'}`;
    case 'MethodDefinition': {
      const fn = isNode(p.value) ? p.value : null;
      const params = fn ? list(fn.props.params).map(pr).join(', ') : '';
      const body = fn?.props.body ? pr(fn.props.body) : '{}';
      const k = p.key === undefined ? 'm' : pr(p.key);
      return `${p.static ? 'static ' : ''}${p.kind === 'get' ? 'get ' : p.kind === 'set' ? 'set ' : ''}${p.computed ? `[${k}]` : k}(${params}) ${body}`;
    }
    case 'ImportExpression':
      return `import(${p.source === undefined ? "'x'" : pr(p.source)})`;
    case 'ExportSpecifier': {
      const loc = P('local', 'x');
      const ex = p.exported ? pr(p.exported) : loc;
      return loc === ex ? loc : `${loc} as ${ex}`;
    }
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
    case 'TSTypePredicate':
      return `${p.asserts ? 'asserts ' : ''}${p.parameterName ? pr(p.parameterName) : 'x'}${p.typeAnnotation ? ' is ' + prType(p.typeAnnotation) : ''}`;
    default:
      return bad(`no-type-printer:${t}`);
  }
};
const prMember = (m) => {
  if (isNode(m) && m.type === 'TSIndexSignature') {
    const prm = list(m.props.parameters).map(pr).join(', ');
    return `[${prm || 'k: string'}]${m.props.typeAnnotation ? ': ' + prType(m.props.typeAnnotation) : ''}`;
  }
  if (!isNode(m) || m.type !== 'TSPropertySignature') return bad(`member:${m?.type}`);
  const p = m.props;
  return `${p.key ? pr(p.key) : 'a'}${p.optional ? '?' : ''}${p.typeAnnotation ? ': ' + prType(p.typeAnnotation) : ''}`;
};
const prTypeRoot = (n) => {
  // a node that only exists inside a wrapper: print the smallest valid wrapper
  const t = n.type;
  if (t === 'TSTypeAnnotation') return `let x: ${prType(n)};`;
  if (t === 'TSPropertySignature') return `type T = { ${prMember(n)} };`;
  if (t === 'TSInterfaceBody') return `interface I { ${list(n.props.body).map(prMember).join('; ')} }`;
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
    ArrayPattern: (s) => `const ${s} = y;`,
    TemplateLiteral: (s) => `const t = ${s};`,
    TemplateElement: (s) => `const t = ${s};`,
    ClassBody: (s) => `class A ${s}`,
    ClassDeclaration: (s) => s,
    MethodDefinition: (s) => `class A { ${s} }`,
    ImportExpression: (s) => `${s};`,
    ExportSpecifier: (s) => `export { ${s} };`,
    JSXText: (s) => `const j = <a>${s}</a>;`,
    JSXExpressionContainer: (s) => `const j = <a>${s}</a>;`,
    JSXElement: (s) => `const j = ${s};`,
    JSXFragment: (s) => `const j = ${s};`,
    JSXIdentifier: (s) => `const j = <${s} />;`,
    JSXAttribute: (s) => `const j = <a ${s} />;`,
    JSXOpeningElement: (s) => `const j = ${s.replace(/>$/u, ' />')};`,
  };
  const s = pr(n);
  if (t === 'Identifier' && n.props.typeAnnotation) return `const ${s};`.replace(/;;$/u, ';');
  if (WRAP[t]) {
    if (t === 'CallExpression' || t === 'MemberExpression' || t === 'Identifier') return paren2(n, s).replace(/^/u, '') + ';';
    if (t === 'ClassDeclaration') return s;
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

// ---- parent chains ------------------------------------------------------------------------------
// A hand-built node whose `parent` is another hand-built node never lists itself in that parent. The parent
// becomes real code, the child is injected into a slot of it, and the stub's first-of-its-type lookup selects the
// child. The slot is searched (the hand-built tree does not name one); the parse must give back the same chain of
// parent types, or the root stays with the hand queue.
const SLOTS = {
  Program: ['body*'], BlockStatement: ['body*'], ExpressionStatement: ['expression'], ReturnStatement: ['argument'],
  VariableDeclaration: ['declarations*'], VariableDeclarator: ['id', 'init'],
  ArrowFunctionExpression: ['body', 'params*'], FunctionExpression: ['body', 'params*', 'id'], FunctionDeclaration: ['body', 'params*', 'id'],
  CallExpression: ['callee', 'arguments*'], NewExpression: ['callee', 'arguments*'], MemberExpression: ['object', 'property'],
  ObjectExpression: ['properties*'], ArrayExpression: ['elements*'], Property: ['value', 'key'],
  AssignmentPattern: ['left', 'right'], ObjectPattern: ['properties*'], ArrayPattern: ['elements*'],
  ExportNamedDeclaration: ['declaration'], ExportDefaultDeclaration: ['declaration'], TSAsExpression: ['expression'], TSNonNullExpression: ['expression'],
  TSTypeAnnotation: ['typeAnnotation'], TSTypeReference: ['typeName'], TSPropertySignature: ['typeAnnotation', 'key'], Identifier: ['typeAnnotation'],
  BinaryExpression: ['left', 'right'], LogicalExpression: ['left', 'right'], SwitchCase: ['test', 'consequent*'], ConditionalExpression: ['test', 'consequent', 'alternate'],
  ChainExpression: ['expression'], AwaitExpression: ['argument'], UnaryExpression: ['argument'], IfStatement: ['consequent', 'test'], ThrowStatement: ['argument'],
};
const clone = (v) => {
  if (isNode(v)) return { __node: true, type: v.type, props: Object.fromEntries(Object.entries(v.props).map(([k, x]) => [k, clone(x)])) };
  if (Array.isArray(v)) return v.map(clone);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)]));
  return v;
};
const combos = (lists) => lists.reduce((acc, l) => acc.flatMap((a) => l.map((x) => [...a, x])), [[]]);
const attach = (parent, slot, child) => {
  const arr = slot.endsWith('*');
  const key = arr ? slot.slice(0, -1) : slot;
  if (arr) parent.props[key] = [...list(parent.props[key]), child];
  else parent.props[key] = child;
};
const typeChainOk = (real, chain) => {
  let cur = real;
  for (const want of chain) {
    if (!cur || cur.type !== want) return false;
    cur = cur.parent;
  }
  return true;
};

const parseCode = (code, tree) => parse(code, { range: true, loc: true, jsx: /JSX|<\/|\/>|<>/u.test(code) });

// Converts one root call; returns { ok, code, rootType } or { ok:false, reason }
const convertRoot = (call, sf) => {
  let tree;
  try {
    tree = evalExpr(call, sf);
    if (!isNode(tree)) bad('not-a-node');
    const extra = Object.keys(tree.props).filter((k) => ['range', 'loc'].includes(k));
    if (extra.length) bad('explicit-range');
    let variants = [{ tree, top: tree, chainTypes: [tree.type] }];
    if (tree.props.parent !== undefined && tree.props.parent !== null) {
      const chain = [tree];
      while (chain[chain.length - 1].props.parent !== undefined && chain[chain.length - 1].props.parent !== null) {
        const p = chain[chain.length - 1].props.parent;
        if (!isNode(p) || chain.length > 8) bad('parent-not-node');
        chain.push(p);
      }
      if (chain.some((n, i) => chain.findIndex((m) => m.type === n.type) !== i)) bad('parent-same-type-in-chain');
      const slotLists = [];
      for (let i = 0; i < chain.length - 1; i++) slotLists.push(SLOTS[chain[i + 1].type] ?? bad(`parent-no-slot:${chain[i + 1].type}`));
      variants = combos(slotLists).map((slots) => {
        const cs = chain.map(clone);
        for (const c of cs) delete c.props.parent;
        for (let i = 0; i < cs.length - 1; i++) attach(cs[i + 1], slots[i], cs[i]);
        return { tree: cs[0], top: cs[cs.length - 1], chainTypes: chain.map((n) => n.type) };
      });
    } else if (tree.props.parent === null && tree.type !== 'Program') bad('parent-null');
    let last = null;
    for (const v of variants) {
      let code;
      try {
        code = printRoot(v.top);
      } catch (e) {
        if (e instanceof Unsupported) {
          last = { ok: false, reason: e.message };
          continue;
        }
        throw e;
      }
      let ast;
      try {
        ast = parseCode(code, v.top);
      } catch (e) {
        last = { ok: false, reason: 'printed-code-does-not-parse', code };
        continue;
      }
      const real = findFirst(ast, v.tree.type);
      if (!real) {
        last = { ok: false, reason: `printed-code-has-no-${v.tree.type}`, code };
        continue;
      }
      if (!typeChainOk(real, v.chainTypes)) {
        last = { ok: false, reason: 'parent-chain-differs', code };
        continue;
      }
      const diffs = [];
      subset(v.tree, real, v.tree.type, diffs);
      if (diffs.length) {
        last = { ok: false, reason: 'roundtrip-mismatch', code, diffs };
        continue;
      }
      return { ok: true, code, rootType: v.tree.type, viaParent: variants.length > 1 || v.chainTypes.length > 1 };
    }
    return last ?? { ok: false, reason: 'no-variant' };
  } catch (e) {
    if (e instanceof Unsupported) return { ok: false, reason: e.message };
    throw e;
  }
};

// Malformed: the hand-built tree holds what the real types forbid, so the parse cannot give it back.
const classify = (c) => {
  if (c.ok) return 'ok';
  if (c.reason === 'parent-null') return 'malformed:parent-null';
  if (c.reason === 'not-a-node') return 'malformed:array-or-scalar-where-node';
  if (c.reason === 'roundtrip-mismatch') {
    const kinds = new Set((c.diffs ?? []).map((d) => (/: (undefined|null) vs |expected node \w+, got null|expected array/u.test(d) ? 'missing-field' : /: type \w+ vs parsed/u.test(d) ? 'wrong-node-in-slot' : /length \d+ vs \d+/u.test(d) ? 'wrong-length' : 'other')));
    if (!kinds.has('other')) return `malformed:${[...kinds].sort().join('+')}`;
  }
  return `unprintable:${c.reason.split(':')[0]}`;
};

module.exports = { convertRoot, evalExpr, classify };

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

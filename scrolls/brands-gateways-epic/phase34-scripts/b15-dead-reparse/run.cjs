// B15 clean-up (SD8): remove `xContract.parse(v)` where the checker says `v` already has the parse's own
// result type AND `v` provably came from a parse. A removed parse drops a runtime check, so a value that
// came from a cast (`as X`, `as never`), an unknown-provenance call, a `let` that is not written only from
// parses, or a parameter with a caller that cannot be proven, keeps its parse and is listed in the kept file.
//
// Provenance (`prov`) walks the checker: const/let variables, destructuring, for-of, array-method callbacks,
// property/element access, object and array literals, functions whose every return comes from a parse, and
// parameters (every in-repo caller, across every workspace package; a function that escapes as a value, has
// no caller, or omits an argument is unproven). A branded scalar accepts a parse of ANY contract as origin
// (the brand names one contract); every other target accepts only a parse of the SAME contract. A contract
// whose input and output types differ (transform/default) is never touched.
//
// Edits: nested dead parses compose (the outer replacement is built from the argument text with its own
// inner edits applied), and an argument is parenthesized unless its parent context takes any expression.
// Each file is then gated through lib.gateEdits (the LanguageService): a statement whose edits add a
// diagnostic gets them restored. Tests/stubs/proxies are counted and never edited.
//
// Usage: node tmp/phase34/b15-dead-reparse/run.cjs [--pkgs=a,b] [--sample-out=dir] [--kept-out=file]
//        [--no-gate] [--distrust-stubs] [--no-literal-unions] [--verify-package]
//        (a literal that the checker proves is a member of an enum-like contract's literal union counts as
//         proven; `--no-literal-unions` keeps those parses. Run with node --max-old-space-size=32000.)
const fs = require('fs');
const nodePath = require('path');
const lib = require('../lib/repo.cjs');

const { ts, ROOT, rel } = lib;
const args = process.argv.slice(2);
const opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? null;
const only = opt('pkgs')?.split(',') ?? null;
const sampleOut = opt('sample-out');
const keptOut = opt('kept-out');
const noGate = args.includes('--no-gate');
const distrustStubs = args.includes('--distrust-stubs');
const verifyPackage = args.includes('--verify-package');
const t0 = Date.now();
const log = (...a) => console.error(`[${Math.round((Date.now() - t0) / 1000)}s]`, ...a);

const CB_METHODS = new Set(['map', 'filter', 'forEach', 'flatMap', 'find', 'findLast', 'some', 'every', 'findIndex']);
const KEEP_ARRAY = new Set(['filter', 'slice', 'sort', 'reverse', 'toSorted', 'toReversed']);
const ELEM_ARRAY = new Set(['at', 'find', 'findLast', 'pop', 'shift']);

// ---------- programs ----------
const wsAll = lib.workspaces().filter((w) => !w.isGateway);
const progs = [];
for (const w of wsAll) {
  const svc = lib.makeLanguageService(w.dir, new Map());
  const program = svc.service.getProgram();
  const own = svc.fileNames.filter((f) => f.startsWith(w.dir + nodePath.sep) && !f.includes('/dist/') && !f.includes('/node_modules/'));
  progs.push({ w, svc, program, checker: program.getTypeChecker(), own });
  log('program', w.short, own.length);
}

const keyOfNode = (n) => `${nodePath.resolve(n.getSourceFile().fileName)}:${n.pos}`;
const isStubFile = (f) => /\.stub\.tsx?$/u.test(f);
const isProxyFile = (f) => /\.proxy\.tsx?$/u.test(f);

// ---------- caller index ----------
const fnOfDecl = (d) => {
  if (!d) return null;
  if (ts.isFunctionDeclaration(d) && d.body) return d;
  if (ts.isVariableDeclaration(d) && d.initializer) {
    let i = d.initializer;
    while (ts.isParenthesizedExpression(i)) i = i.expression;
    if (ts.isArrowFunction(i) || ts.isFunctionExpression(i)) return i;
  }
  return null;
};
const fnNames = new Set();
for (const p of progs) {
  for (const f of p.own) {
    const sf = p.program.getSourceFile(f);
    if (!sf) continue;
    const v = (n) => {
      if (ts.isFunctionDeclaration(n) && n.name) fnNames.add(n.name.text);
      else if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && fnOfDecl(n)) fnNames.add(n.name.text);
      ts.forEachChild(n, v);
    };
    v(sf);
  }
}
log('function names', fnNames.size);
const callers = new Map(); // fn key -> [{call, checker}]
const escapes = new Map(); // fn key -> [file]
const seenCall = new Set();
const insideMockWrap = (n) => {
  for (let p = n.parent; p; p = p.parent) {
    if (ts.isCallExpression(p)) {
      const t = p.expression.getText();
      if (t === 'registerMock' || t === 'jest.mocked') return true;
    }
  }
  return false;
};
for (const p of progs) {
  for (const f of p.own) {
    const sf = p.program.getSourceFile(f);
    if (!sf) continue;
    const v = (n) => {
      if (ts.isIdentifier(n) && fnNames.has(n.text)) {
        const par = n.parent;
        const skip =
          ts.isImportSpecifier(par) || ts.isExportSpecifier(par) || ts.isImportClause(par) || ts.isTypeQueryNode(par) ||
          (ts.isFunctionDeclaration(par) && par.name === n) || (ts.isVariableDeclaration(par) && par.name === n);
        if (!skip) {
          let sym;
          try {
            sym = ts.isShorthandPropertyAssignment(par) && par.name === n ? p.checker.getShorthandAssignmentValueSymbol(par) : p.checker.getSymbolAtLocation(n);
            if (sym && sym.flags & ts.SymbolFlags.Alias) sym = p.checker.getAliasedSymbol(sym);
          } catch {
            sym = null;
          }
          const fn = sym ? fnOfDecl(sym.valueDeclaration ?? sym.declarations?.[0]) : null;
          if (fn) {
            const key = keyOfNode(fn);
            let call = null;
            if (ts.isCallExpression(par) && par.expression === n) call = par;
            else if (ts.isPropertyAccessExpression(par) && par.name === n && ts.isCallExpression(par.parent) && par.parent.expression === par) call = par.parent;
            if (call) {
              const ck = keyOfNode(call);
              if (!seenCall.has(ck)) {
                seenCall.add(ck);
                if (!callers.has(key)) callers.set(key, []);
                callers.get(key).push({ call, checker: p.checker });
              }
            } else if (!(isProxyFile(f) && insideMockWrap(n)) && !insideMockWrap(n)) {
              if (!escapes.has(key)) escapes.set(key, []);
              escapes.get(key).push(`${rel(f)}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`);
            }
          }
        }
      }
      ts.forEachChild(n, v);
    };
    v(sf);
  }
  log('indexed', p.w.short);
}

// ---------- provenance ----------
const OK = (origins = []) => ({ ok: true, origins });
const NO = (why) => ({ ok: false, why });
const all = (list) => {
  const origins = [];
  for (const r of list) {
    if (!r.ok) return r;
    origins.push(...r.origins);
  }
  return OK(origins);
};
const memo = new Map();
const inflight = new Set();
const strip = (e) => {
  while (ts.isParenthesizedExpression(e) || ts.isNonNullExpression(e) || ts.isSatisfiesExpression(e)) e = e.expression;
  return e;
};
const isLiteralKind = (e) =>
  ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e) || ts.isNumericLiteral(e) ||
  e.kind === ts.SyntaxKind.TrueKeyword || e.kind === ts.SyntaxKind.FalseKeyword || e.kind === ts.SyntaxKind.NullKeyword ||
  (ts.isIdentifier(e) && e.text === 'undefined') ||
  (ts.isPrefixUnaryExpression(e) && ts.isNumericLiteral(e.operand));
const contractKey = (c, e) => {
  let id = e;
  if (ts.isPropertyAccessExpression(e)) id = e.name;
  if (!ts.isIdentifier(id)) return null;
  try {
    let s = c.getSymbolAtLocation(id);
    if (s && s.flags & ts.SymbolFlags.Alias) s = c.getAliasedSymbol(s);
    const d = s?.valueDeclaration ?? s?.declarations?.[0];
    return d ? keyOfNode(d) : `name:${id.text}`;
  } catch {
    return `name:${id.text}`;
  }
};
const propName = (nm) => (ts.isIdentifier(nm) || ts.isStringLiteral(nm) || ts.isNumericLiteral(nm) ? nm.text : null);

const prov = (c, node, path, lit, depth) => {
  const e = strip(node);
  const mk = `${keyOfNode(e)}:${e.end}|${path.join('.')}|${lit ? 1 : 0}`;
  if (memo.has(mk)) return memo.get(mk);
  if (inflight.has(mk)) return NO('cycle');
  if (depth > 14) return NO('too-deep');
  inflight.add(mk);
  let r;
  try {
    r = provInner(c, e, path, lit, depth + 1);
  } catch (err) {
    r = NO(`error:${String(err.message).slice(0, 60)}`);
  }
  inflight.delete(mk);
  if (r.ok || r.why !== 'cycle') memo.set(mk, r);
  return r;
};

const declOf = (c, id) => {
  let s = ts.isShorthandPropertyAssignment(id.parent) && id.parent.name === id ? c.getShorthandAssignmentValueSymbol(id.parent) : c.getSymbolAtLocation(id);
  if (s && s.flags & ts.SymbolFlags.Alias) s = c.getAliasedSymbol(s);
  return { s, d: s?.valueDeclaration ?? s?.declarations?.[0] };
};

const provParam = (c, param, path, lit, depth) => {
  const fn = param.parent;
  if (!ts.isFunctionLike(fn)) return NO('param-of-non-function');
  if (param.dotDotDotToken) return NO('rest-param');
  const idx = fn.parameters.indexOf(param);
  // inline callback of an array method
  if ((ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) && ts.isCallExpression(fn.parent) && fn.parent.arguments[0] === fn && idx === 0) {
    const callee = strip(fn.parent.expression);
    if (ts.isPropertyAccessExpression(callee) && CB_METHODS.has(callee.name.text)) return prov(c, callee.expression, ['*', ...path], true, depth);
  }
  let target = fn;
  if (!(ts.isFunctionDeclaration(fn) || ((ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) && ts.isVariableDeclaration(fn.parent)))) return NO('param-of-anonymous-or-method');
  const key = keyOfNode(target);
  if (escapes.has(key)) return NO(`fn-escapes:${escapes.get(key)[0]}`);
  const cs = callers.get(key);
  if (!cs || !cs.length) return NO('no-callers');
  const parts = [];
  for (const { call, checker } of cs) {
    const a = call.arguments[idx];
    if (!a) {
      if (param.initializer) {
        parts.push(prov(checker, param.initializer, path, lit, depth));
        continue;
      }
      return NO('caller-omits-arg');
    }
    if (ts.isSpreadElement(a)) return NO('caller-spread');
    const r = prov(checker, a, path, lit, depth);
    if (!r.ok) return NO(`caller ${rel(call.getSourceFile().fileName)}:${call.getSourceFile().getLineAndCharacterOfPosition(call.getStart()).line + 1} -> ${r.why}`);
    parts.push(r);
  }
  return all(parts);
};

const provInner = (c, e, path, lit, depth) => {
  if (ts.isAsExpression(e) || ts.isTypeAssertionExpression(e)) {
    const t = e.type;
    if (ts.isTypeReferenceNode(t) && t.typeName.getText() === 'const') return prov(c, e.expression, path, lit, depth);
    return NO('cast');
  }
  if (ts.isAwaitExpression(e)) return prov(c, e.expression, path, lit, depth);
  if (isLiteralKind(e)) return lit && path.length === 0 ? OK() : lit ? OK() : NO('literal');
  if (ts.isCallExpression(e)) {
    const callee = strip(e.expression);
    if (ts.isPropertyAccessExpression(callee) && callee.name.text === 'parse') {
      const owner = strip(callee.expression);
      const nm = ts.isIdentifier(owner) ? owner.text : ts.isPropertyAccessExpression(owner) ? owner.name.text : '';
      if (/Contract$/u.test(nm)) return OK([contractKey(c, owner)]);
    }
    if (ts.isPropertyAccessExpression(callee)) {
      const m = callee.name.text;
      if (KEEP_ARRAY.has(m)) return prov(c, callee.expression, path, lit, depth);
      if (ELEM_ARRAY.has(m)) return prov(c, callee.expression, ['*', ...path], lit, depth);
    }
    let id = callee;
    if (ts.isPropertyAccessExpression(callee)) id = callee.name;
    if (!ts.isIdentifier(id)) return NO('call-of-expression');
    const { d } = declOf(c, id);
    const fn = fnOfDecl(d);
    if (!fn) return NO(`call-unresolved:${id.text}`);
    const rf = path.length ? null : null;
    void rf;
    const dfile = nodePath.resolve(fn.getSourceFile().fileName);
    if (distrustStubs && isStubFile(dfile)) return NO('stub');
    const rets = [];
    if (fn.body && !ts.isBlock(fn.body)) rets.push(fn.body);
    else {
      const v = (n) => {
        if (n !== fn && ts.isFunctionLike(n)) return;
        if (ts.isReturnStatement(n)) rets.push(n.expression ?? null);
        ts.forEachChild(n, v);
      };
      v(fn.body);
    }
    if (!rets.length) return NO('call-no-return');
    const parts = [];
    for (const rx of rets) {
      if (!rx) return NO('call-bare-return');
      const r = prov(c, rx, path, lit, depth);
      if (!r.ok) return NO(`call ${id.text} -> ${r.why}`);
      parts.push(r);
    }
    return all(parts);
  }
  if (ts.isIdentifier(e)) {
    const { s, d } = declOf(c, e);
    if (!d) return NO(`unresolved:${e.text}`);
    return provDecl(c, d, s, path, lit, depth);
  }
  if (ts.isPropertyAccessExpression(e)) {
    if (e.questionDotToken && false) return NO('x');
    return prov(c, e.expression, [e.name.text, ...path], lit, depth);
  }
  if (ts.isElementAccessExpression(e)) {
    const a = e.argumentExpression;
    if (a && (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a))) return prov(c, e.expression, [a.text, ...path], lit, depth);
    return prov(c, e.expression, ['*', ...path], lit, depth);
  }
  if (ts.isConditionalExpression(e)) return all([prov(c, e.whenTrue, path, lit, depth), prov(c, e.whenFalse, path, lit, depth)]);
  if (ts.isBinaryExpression(e)) {
    const k = e.operatorToken.kind;
    if (k === ts.SyntaxKind.QuestionQuestionToken || k === ts.SyntaxKind.BarBarToken || k === ts.SyntaxKind.AmpersandAmpersandToken) return all([prov(c, e.left, path, lit, depth), prov(c, e.right, path, lit, depth)]);
    if (k === ts.SyntaxKind.CommaToken || k === ts.SyntaxKind.EqualsToken) return prov(c, e.right, path, lit, depth);
    return NO('binary');
  }
  if (ts.isObjectLiteralExpression(e)) {
    if (path.length === 0) {
      const parts = [];
      for (const p of e.properties) {
        if (ts.isPropertyAssignment(p)) parts.push(prov(c, p.initializer, [], true, depth));
        else if (ts.isShorthandPropertyAssignment(p)) parts.push(prov(c, p.name, [], true, depth));
        else if (ts.isSpreadAssignment(p)) parts.push(prov(c, p.expression, [], true, depth));
        else return NO('object-method');
      }
      const rr = all(parts);
      return rr.ok ? OK(['*composed']) : rr;
    }
    if (path[0] === '*') return NO('index-of-object');
    for (let i = e.properties.length - 1; i >= 0; i--) {
      const p = e.properties[i];
      if (ts.isSpreadAssignment(p)) return prov(c, p.expression, path, true, depth);
      const nm = p.name ? propName(p.name) : null;
      if (p.name && nm === null) return NO('computed-key');
      if (nm !== path[0]) continue;
      if (ts.isPropertyAssignment(p)) return prov(c, p.initializer, path.slice(1), true, depth);
      if (ts.isShorthandPropertyAssignment(p)) return prov(c, p.name, path.slice(1), true, depth);
      return NO('object-method');
    }
    return NO(`missing-field:${path[0]}`);
  }
  if (ts.isArrayLiteralExpression(e)) {
    const sub = path.length === 0 ? [] : path[0] === '*' ? path.slice(1) : null;
    if (!sub && path.length) return NO('array-member');
    const parts = [];
    for (const el of e.elements) {
      if (ts.isSpreadElement(el)) parts.push(prov(c, el.expression, ['*', ...sub], true, depth));
      else parts.push(prov(c, el, sub, true, depth));
    }
    return all(parts);
  }
  return NO(`kind:${ts.SyntaxKind[e.kind]}`);
};

const bindingPathUp = (el) => {
  // returns { root: VariableDeclaration|Parameter, prefix: [...] } for a BindingElement
  const prefix = [];
  let cur = el;
  while (cur && ts.isBindingElement(cur)) {
    const pat = cur.parent;
    if (ts.isObjectBindingPattern(pat)) {
      if (cur.dotDotDotToken) {
        /* object rest keeps the remaining fields; path unchanged */
      } else {
        const nm = cur.propertyName ?? cur.name;
        const t = ts.isIdentifier(nm) || ts.isStringLiteral(nm) ? nm.text : null;
        if (t === null) return null;
        prefix.unshift(t);
      }
    } else {
      prefix.unshift('*');
    }
    cur = pat.parent;
  }
  return { root: cur, prefix };
};

const provDecl = (c, d, s, path, lit, depth) => {
  if (ts.isBindingElement(d)) {
    const up = bindingPathUp(d);
    if (!up) return NO('binding-computed');
    const full = [...up.prefix, ...path];
    const parts = [];
    if (d.initializer) parts.push(prov(c, d.initializer, path, true, depth));
    if (ts.isParameter(up.root)) parts.push(provParam(c, up.root, full, lit, depth));
    else if (ts.isVariableDeclaration(up.root)) parts.push(provVarDecl(c, up.root, full, lit, depth, null));
    else return NO('binding-root');
    return all(parts);
  }
  if (ts.isParameter(d)) return provParam(c, d, path, lit, depth);
  if (ts.isVariableDeclaration(d)) return provVarDecl(c, d, path, lit, depth, s);
  return NO(`decl:${ts.SyntaxKind[d.kind]}`);
};

const provVarDecl = (c, d, path, lit, depth, sym) => {
  const list = d.parent;
  if (list && ts.isVariableDeclarationList(list) && list.parent && ts.isForOfStatement(list.parent)) return prov(c, list.parent.expression, ['*', ...path], true, depth);
  if (list && ts.isVariableDeclarationList(list) && list.parent && ts.isForInStatement(list.parent)) return NO('for-in');
  if (ts.isCatchClause(d.parent)) return NO('catch');
  const isConst = list && ts.isVariableDeclarationList(list) && (list.flags & ts.NodeFlags.Const) !== 0;
  if (isConst) return d.initializer ? prov(c, d.initializer, path, lit, depth) : NO('const-no-init');
  // let / var: every write must be a proven RHS
  if (!ts.isIdentifier(d.name) || !sym) return NO('let-pattern');
  const parts = [];
  if (d.initializer) parts.push(prov(c, d.initializer, path, lit, depth));
  let scope = d;
  while (scope && !ts.isFunctionLike(scope) && !ts.isSourceFile(scope)) scope = scope.parent;
  let bad = null;
  const v = (n) => {
    if (bad) return;
    if (ts.isIdentifier(n) && n.text === d.name.text && n !== d.name) {
      let same = false;
      try {
        let s2 = c.getSymbolAtLocation(n);
        same = s2 === sym;
      } catch {}
      if (same) {
        const p = n.parent;
        if (ts.isBinaryExpression(p) && p.left === n && p.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && p.operatorToken.kind <= ts.SyntaxKind.LastAssignment) {
          if (p.operatorToken.kind === ts.SyntaxKind.EqualsToken) parts.push(prov(c, p.right, path, lit, depth));
          else bad = 'let-compound-assign';
        } else if ((ts.isPrefixUnaryExpression(p) || ts.isPostfixUnaryExpression(p)) && (p.operator === ts.SyntaxKind.PlusPlusToken || p.operator === ts.SyntaxKind.MinusMinusToken)) bad = 'let-increment';
        else if (ts.isArrayLiteralExpression(p) || ts.isObjectLiteralExpression(p) || ts.isShorthandPropertyAssignment(p)) {
          /* read */
        }
      }
    }
    ts.forEachChild(n, v);
  };
  v(scope);
  if (bad) return NO(bad);
  if (!parts.length) return NO('let-never-assigned');
  return all(parts);
};

// ---------- type helpers ----------
const isBrandProp = (p) => /brand/iu.test(p.name);
const isBrandedScalar = (c, t) => {
  const members = t.isUnion() ? t.types.filter((m) => !(m.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null))) : [t];
  return members.length > 0 && members.every((m) => (m.flags & ts.TypeFlags.Intersection) !== 0 && c.getPropertiesOfType(m).some(isBrandProp));
};
const TRANSFORM_CALLS = new Set(['transform', 'default', 'prefault', 'preprocess', 'catch', 'pipe', 'coerce', 'overwrite', 'codec']);
const xformMemo = new Map();
const hasTransform = (c, ownerId, depth = 0) => {
  const { d } = declOf(c, ownerId);
  if (!d || !ts.isVariableDeclaration(d) || !d.initializer) return false;
  const k = keyOfNode(d);
  if (xformMemo.has(k)) return xformMemo.get(k);
  xformMemo.set(k, false);
  let hit = false;
  const refs = [];
  const v = (n) => {
    if (hit) return;
    if (ts.isPropertyAccessExpression(n) && TRANSFORM_CALLS.has(n.name.text)) hit = true;
    if (ts.isIdentifier(n) && /Contract$/u.test(n.text) && n !== d.name) refs.push(n);
    ts.forEachChild(n, v);
  };
  v(d.initializer);
  if (!hit && depth < 8) for (const r of refs) if (hasTransform(c, r, depth + 1)) { hit = true; break; }
  xformMemo.set(k, hit);
  return hit;
};

const isLiteralUnion = (t) => {
  if (args.includes('--no-literal-unions')) return false;
  const ms = t.isUnion() ? t.types : [t];
  return ms.length > 0 && ms.every((m) => (m.flags & (ts.TypeFlags.StringLiteral | ts.TypeFlags.NumberLiteral | ts.TypeFlags.BooleanLiteral | ts.TypeFlags.Undefined | ts.TypeFlags.Null)) !== 0);
};

// ---------- census ----------
const perPkg = {};
const kept = [];
const editsByFile = new Map(); // file -> [{node, argNode, ...}]
const bump = (pk, k) => {
  pk[k] = (pk[k] || 0) + 1;
};
const reasonClass = (why) => {
  if (why === 'cast') return 'cast';
  if (/-> cast$|^call .*-> cast$/u.test(why)) return 'cast';
  if (/cast$/u.test(why)) return 'cast';
  return 'unknown-provenance';
};
for (const p of progs) {
  if (only && !only.includes(p.w.short)) continue;
  const pk = (perPkg[p.w.short] = { sites: 0, typeDead: 0, testDead: 0, removable: 0, keptCast: 0, keptUnknown: 0, keptTransform: 0, keptCrossOrigin: 0, keptLiteral: 0 });
  for (const f of p.own) {
    const sf = p.program.getSourceFile(f);
    if (!sf) continue;
    const isTest = lib.isTestSupport(f);
    const visit = (n) => {
      if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'parse' && ts.isIdentifier(n.expression.expression) && /Contract$/u.test(n.expression.expression.text) && n.arguments.length === 1) {
        const c = p.checker;
        const a = n.arguments[0];
        pk.allSites = (pk.allSites || 0) + 1;
        if (!isTest) pk.sites++;
        const at = c.getTypeAtLocation(a);
        const rt = c.getTypeAtLocation(n);
        const dead = !(at.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Never)) && !(rt.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) && c.isTypeAssignableTo(at, rt);
        if (dead) {
          if (isTest) pk.testDead++;
          else {
            pk.typeDead++;
            const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
            const cname = n.expression.expression.text;
            const rec = { file: rel(f), line, contract: cname, arg: a.getText(sf).replace(/\s+/gu, ' ').slice(0, 90) };
            if (hasTransform(c, n.expression.expression)) {
              bump(pk, 'keptTransform');
              kept.push({ ...rec, reason: 'transform-contract', detail: '' });
            } else {
              const r = prov(c, a, [], isLiteralUnion(rt), 0);
              if (!r.ok) {
                const cls = reasonClass(r.why);
                bump(pk, cls === 'cast' ? 'keptCast' : r.why === 'literal' ? 'keptLiteral' : 'keptUnknown');
                kept.push({ ...rec, reason: cls === 'cast' ? 'cast' : r.why === 'literal' ? 'literal' : 'unknown-provenance', detail: r.why.slice(0, 160) });
              } else {
                const target = contractKey(c, n.expression.expression);
                const scalar = isBrandedScalar(c, rt);
                const badOrigin = r.origins.find((o) => o !== target && !scalar);
                if (badOrigin === '*composed') {
                  bump(pk, 'keptComposed');
                  kept.push({ ...rec, reason: 'composed-object-literal', detail: 'object literal whose fields are proven; the object itself was never parsed' });
                } else if (badOrigin) {
                  bump(pk, 'keptCrossOrigin');
                  kept.push({ ...rec, reason: 'cross-origin', detail: `origin ${badOrigin.split('/').slice(-1)[0]}` });
                } else {
                  bump(pk, 'removable');
                  if (!r.origins.length) bump(pk, 'removableLiteralOnly');
                  if (!editsByFile.has(f)) editsByFile.set(f, []);
                  editsByFile.get(f).push({ call: n, arg: a, rec });
                }
              }
            }
          }
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
  log('census', p.w.short, JSON.stringify(pk));
}

// ---------- edits ----------
const SAFE_PARENT = (n) => {
  const p = n.parent;
  if (!p) return true;
  if (ts.isCallExpression(p) || ts.isNewExpression(p)) return p.arguments?.includes(n) ?? false;
  if (ts.isVariableDeclaration(p) || ts.isPropertyAssignment(p) || ts.isBindingElement(p) || ts.isParameter(p) || ts.isPropertyDeclaration(p)) return p.initializer === n;
  if (ts.isReturnStatement(p) || ts.isParenthesizedExpression(p) || ts.isArrayLiteralExpression(p) || ts.isTemplateSpan(p) || ts.isSpreadElement(p) || ts.isSpreadAssignment(p) || ts.isJsxExpression(p) || ts.isCaseClause(p) || ts.isThrowStatement(p)) return true;
  if (ts.isExpressionStatement(p)) return true;
  if (ts.isConditionalExpression(p)) return p.condition !== n;
  if (ts.isBinaryExpression(p)) return p.operatorToken.kind === ts.SyntaxKind.EqualsToken && p.right === n;
  if (ts.isArrowFunction(p)) return p.body === n;
  return false;
};
const tightArg = (a) => {
  const e = a;
  return (
    ts.isIdentifier(e) || ts.isPropertyAccessExpression(e) || ts.isElementAccessExpression(e) || ts.isCallExpression(e) || ts.isParenthesizedExpression(e) ||
    ts.isStringLiteral(e) || ts.isNumericLiteral(e) || ts.isArrayLiteralExpression(e) || ts.isTemplateExpression(e) || ts.isNoSubstitutionTemplateLiteral(e) ||
    ts.isNonNullExpression(e) || e.kind === ts.SyntaxKind.ThisKeyword || ts.isNewExpression(e) || ts.isObjectLiteralExpression(e)
  );
};
const compose = (text, start, end, inner) => {
  // text of [start,end) with the (already composed) inner replacements applied
  const sorted = [...inner].sort((x, y) => y.start - x.start);
  let out = text.slice(start, end);
  for (const e of sorted) out = out.slice(0, e.start - start) + e.text + out.slice(e.end - start);
  return out;
};
const buildEdits = (f, sf, text, sites) => {
  const list = sites.map((s) => ({ start: s.call.getStart(sf), end: s.call.end, arg: s.arg, call: s.call, rec: s.rec }));
  list.sort((a, b) => a.start - b.start || b.end - a.end);
  // outermost-first tree
  const compute = (e) => {
    const inner = list.filter((o) => o !== e && o.start >= e.arg.getStart(sf) && o.end <= e.arg.end);
    const directInner = inner.filter((o) => !inner.some((q) => q !== o && q.start <= o.start && q.end >= o.end && (q.start !== o.start || q.end !== o.end)));
    const comp = directInner.map((o) => ({ start: o.start, end: o.end, text: compute(o) }));
    const argStart = e.arg.getStart(sf);
    let t = compose(text, argStart, e.arg.end, comp);
    const needP = !SAFE_PARENT(e.call) && !tightArg(e.arg);
    const objAtStmt = ts.isObjectLiteralExpression(e.arg) && (ts.isExpressionStatement(e.call.parent) || ts.isArrowFunction(e.call.parent));
    const lowArg = !tightArg(e.arg) && !SAFE_PARENT(e.call) ? true : false;
    if (needP || objAtStmt || (lowArg && false)) t = `(${t})`;
    return t;
  };
  const top = list.filter((e) => !list.some((o) => o !== e && o.arg.getStart(sf) <= e.start && o.arg.end >= e.end));
  return { top, all: list, compute };
};
const dropUnusedContractImports = (f, text) => {
  const sf2 = lib.parse(f, text);
  const drop = [];
  for (const st of sf2.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings) || st.importClause.name) continue;
    const els = st.importClause.namedBindings.elements;
    const used = (nm) => {
      let hit = false;
      const v = (x) => {
        if (hit || ts.isImportDeclaration(x)) return;
        if (ts.isIdentifier(x) && x.text === nm) hit = true;
        ts.forEachChild(x, v);
      };
      sf2.statements.forEach(v);
      return hit;
    };
    const keep = els.filter((e) => used(e.name.text) || !/Contract$/u.test(e.name.text));
    if (keep.length === els.length) continue;
    if (!keep.length) {
      const le = text.indexOf('\n', st.end);
      drop.push({ start: st.getStart(sf2), end: le === -1 ? st.end : le + 1, text: '' });
    } else drop.push({ start: st.getStart(sf2), end: st.end, text: `import${st.importClause.isTypeOnly ? ' type' : ''} { ${keep.map((e) => e.getText(sf2)).join(', ')} } from ${st.moduleSpecifier.getText(sf2)};` });
  }
  return lib.applyEdits(text, drop);
};

// lib.gateEdits, minus the "declared but never used" codes: a removed parse leaves its contract import
// unused until the import is dropped (after gating), and that must not count as a new diagnostic.
const UNUSED = new Set([6133, 6192, 6196, 6198, 6199, 6205]);
const gateEdits = ({ service, live, file, text, cands, render }) => {
  const setText = (t) => live.set(file, { v: (live.get(file)?.v ?? 0) + 1, text: t });
  const diag = () =>
    [...service.getSyntacticDiagnostics(file), ...service.getSemanticDiagnostics(file)]
      .filter((d) => !UNUSED.has(d.code))
      .map((d) => ({ key: `${d.code}:${d.file ? d.file.getLineAndCharacterOfPosition(d.start).line : -1}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`, start: d.start ?? 0, end: (d.start ?? 0) + (d.length ?? 0) }));
  const base = new Set(diag().map((d) => d.key));
  let accepted = [...cands];
  for (let guard = 0; guard < 60 && accepted.length; guard++) {
    setText(render(accepted));
    const added = diag().filter((d) => !base.has(d.key));
    if (!added.length) break;
    const sorted = [...accepted].sort((a, b) => a.start - b.start);
    const back = (pos) => {
      let delta = 0;
      for (const c of sorted) {
        if (c.start + delta >= pos) break;
        delta += c.text.length - (c.end - c.start);
      }
      return pos - delta;
    };
    const restore = new Set();
    for (const d of added) {
      const s = back(d.start);
      const e = back(d.end);
      const hits = accepted.filter((c) => c.stmtStart <= s && e <= c.stmtEnd);
      (hits.length ? hits : accepted).forEach((c) => restore.add(c));
    }
    accepted = accepted.filter((c) => !restore.has(c));
  }
  if (accepted.length) {
    setText(render(accepted));
    if (diag().some((d) => !base.has(d.key))) accepted = [];
  }
  setText(text);
  return accepted;
};

const overlay = new Map();
const gateDropped = [];
let removedSites = 0;
for (const p of progs) {
  if (only && !only.includes(p.w.short)) continue;
  const live = new Map();
  const svc = lib.makeLanguageService(p.w.dir, live);
  for (const f of p.own) {
    const sites = editsByFile.get(f);
    if (!sites) continue;
    const sf = lib.parse(f);
    const text = fs.readFileSync(f, 'utf8');
    const { top, all: allE, compute } = buildEdits(f, sf, text, sites);
    // each candidate is an outermost edit; a nested edit rides inside its container
    const cands = top.map((e) => {
      const st = lib.enclosingStatement(e.call, sf);
      const members = allE.filter((o) => o.start >= e.start && o.end <= e.end);
      return { start: e.start, end: e.end, text: compute(e), stmtStart: st.stmtStart, stmtEnd: st.stmtEnd, members };
    });
    const render = (acc) => lib.applyEdits(text, acc.map(({ start, end, text: t }) => ({ start, end, text: t })));
    let accepted = cands;
    if (!noGate) accepted = gateEdits({ service: svc.service, live, file: f, text, cands, render });
    const acceptedMembers = new Set(accepted.flatMap((a) => a.members));
    for (const o of allE) if (!acceptedMembers.has(o)) gateDropped.push({ ...o.rec, reason: 'gate-diagnostic', detail: 'file typecheck gained a diagnostic' });
    if (!accepted.length) continue;
    removedSites += acceptedMembers.size;
    perPkg[p.w.short].gateRestored = (perPkg[p.w.short].gateRestored || 0) + (allE.length - acceptedMembers.size);
    overlay.set(f, dropUnusedContractImports(f, render(accepted)));
  }
  log('edited', p.w.short, 'files', [...overlay.keys()].filter((f) => f.startsWith(p.w.dir + nodePath.sep)).length);
}
for (const g of gateDropped) kept.push(g);

// ---------- verify ----------
let syntaxBroken = 0;
for (const [f, t] of overlay) {
  const sf = lib.parse(f, t);
  if (sf.parseDiagnostics?.length) {
    syntaxBroken++;
    console.log('SYNTAX', rel(f), sf.parseDiagnostics[0].messageText);
  }
}
let newD = 0;
let clean = 0;
const bad = [];
if (verifyPackage) {
  const keyOf = (d) => `${d.code}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
  const by = {};
  for (const f of overlay.keys()) (by[lib.workspaceOf(f, wsAll).name] ??= []).push(f);
  for (const [pn, fl] of Object.entries(by)) {
    const w = wsAll.find((x) => x.name === pn);
    const options = lib.packageCompilerOptions(w.dir);
    const pf = lib.walk(w.dir).filter((f) => !f.includes('/dist/'));
    const base = lib.diagnosticsWithOverlay(pf, new Map(), options).diagnostics;
    const aft = lib.diagnosticsWithOverlay(pf, overlay, options).diagnostics;
    for (const f of pf) {
      const bk = new Set((base.get(f) ?? []).map(keyOf));
      const add = (aft.get(f) ?? []).filter((d) => !bk.has(keyOf(d)));
      if (overlay.has(f) && !add.length) clean++;
      if (add.length) {
        newD += add.length;
        bad.push([rel(f), ...add.slice(0, 2).map((d) => lib.formatDiagnostic(d).slice(0, 220))]);
      }
    }
    log('verified', pn);
  }
}

// ---------- output ----------
const totals = {};
for (const pk of Object.values(perPkg)) for (const [k, v] of Object.entries(pk)) totals[k] = (totals[k] || 0) + v;
console.log(JSON.stringify({ perPackage: perPkg, totals, escapedFunctions: escapes.size, filesRewritten: overlay.size, sitesRemoved: removedSites, syntaxBroken, verify: verifyPackage ? { zeroNewDiagnosticsFiles: clean, newDiagnostics: newD } : 'skipped (--verify-package)' }, null, 1));
bad.slice(0, 10).forEach((b) => console.log(b.join('\n   ')));
if (sampleOut) for (const [f, t] of overlay) {
  const d = nodePath.join(ROOT, sampleOut, rel(f));
  fs.mkdirSync(nodePath.dirname(d), { recursive: true });
  fs.writeFileSync(d, t);
}
if (args.includes('apply')) {
  for (const [f, t] of overlay) fs.writeFileSync(f, t);
  console.log(`applied ${overlay.size} files`);
}
if (keptOut) {
  const rows = kept.map((k) => [k.file + ':' + k.line, k.contract, k.reason, k.detail, k.arg].join('\t'));
  fs.mkdirSync(nodePath.dirname(nodePath.resolve(ROOT, keptOut)), { recursive: true });
  fs.writeFileSync(nodePath.resolve(ROOT, keptOut), ['site\tcontract\treason\tdetail\targ', ...rows].join('\n') + '\n');
}

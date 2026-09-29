// SD1 (a): after the retype, a field read that fails on a union (TS2339) gets the check the loose copy let
// code skip. The check is `X.type === AST_NODE_TYPES.A` (or `'prop' in X` for wide or non-node unions), placed
// where it keeps the loose copy's meaning: an undefined read was falsy, so the check joins an `&&` chain or a
// condition; anywhere else the read becomes `(check ? X.prop : undefined)`. A read of a field NO member of the
// union has is a dead read; `a ?? X.dead` loses its right side, anything else goes to the hand queue.
// Every batch is gated: it stays only when the file's error count drops.
const lib = require('../lib/repo.cjs');
const { NODE_NAMES } = require('./retype.cjs');
const { ts } = lib;

const K = ts.SyntaxKind;
const isPure = (e) =>
  e.kind === K.Identifier ||
  e.kind === K.ThisKeyword ||
  (ts.isPropertyAccessExpression(e) && isPure(e.expression)) ||
  (ts.isNonNullExpression(e) && isPure(e.expression)) ||
  (ts.isElementAccessExpression(e) && isPure(e.expression) && (ts.isStringLiteral(e.argumentExpression) || ts.isNumericLiteral(e.argumentExpression)));

const literalLike = (e, sf) =>
  ts.isStringLiteral(e) ||
  ts.isNoSubstitutionTemplateLiteral(e) ||
  ts.isNumericLiteral(e) ||
  e.kind === K.TrueKeyword ||
  e.kind === K.FalseKeyword ||
  (ts.isPropertyAccessExpression(e) && e.expression.getText(sf) === 'AST_NODE_TYPES');

const nodeName = (checker, m) => {
  const tp = m.getProperty('type');
  if (!tp) return null;
  const n = checker.getTypeOfSymbol(tp).symbol?.name;
  return n && NODE_NAMES.has(n) ? n : null;
};

const covering = (sf, start, length) => {
  let hit = null;
  const visit = (n) => {
    if (n.getStart(sf) <= start && n.end >= start + length) {
      hit = n;
      ts.forEachChild(n, visit);
    }
  };
  visit(sf);
  return hit;
};

// The check that narrows receiver X to the union members holding `prop`.
// -> { g, usesAst, none } | { hand }
const buildGuard = (X, prop, sf, checker) => {
  if (!isPure(X)) return { hand: 'receiver-not-pure' };
  const full = checker.getTypeAtLocation(X);
  const nn = checker.getNonNullableType(full);
  const parts = nn.isUnion() ? nn.types : [nn];
  if (parts.some((p) => p.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.TypeParameter | ts.TypeFlags.Never))) return { hand: 'receiver-untyped' };
  const NU = ts.TypeFlags.Null | ts.TypeFlags.Undefined;
  const nullable = full.isUnion() ? full.types.some((p) => p.flags & NU) : !!(full.flags & NU);
  const has = parts.filter((p) => p.getProperty(prop));
  if (!has.length) return { none: true };
  const xt = X.getText(sf);
  const names = [...new Set(has.map((m) => nodeName(checker, m)))];
  const xType = nullable ? `${xt}?.type` : `${xt}.type`;
  if (names.every(Boolean) && names.length <= 3 && parts.every((p) => nodeName(checker, p))) {
    const guard = names.map((n) => `${xType} === AST_NODE_TYPES.${n}`).join(' || ');
    return { g: names.length > 1 ? `(${guard})` : guard, usesAst: true };
  }
  return { g: nullable ? `${xt} && '${prop}' in ${xt}` : `'${prop}' in ${xt}`, usesAst: false };
};

// -> { edit } | { hand: reason }
const plan = (pa, sf, checker) => {
  const prop = pa.name.text;
  const X = pa.expression;
  const bg = buildGuard(X, prop, sf, checker);
  const chainTop = (() => {
    let c = pa;
    while (c.parent && ((ts.isPropertyAccessExpression(c.parent) && c.parent.expression === c) || (ts.isElementAccessExpression(c.parent) && c.parent.expression === c) || (ts.isCallExpression(c.parent) && c.parent.expression === c) || ts.isNonNullExpression(c.parent))) c = c.parent;
    return c;
  })();
  if (bg.hand) return bg;
  if (bg.none) {
    const p = pa.parent;
    if (ts.isBinaryExpression(p) && p.operatorToken.kind === K.QuestionQuestionToken && p.right === pa) return { edit: { start: p.left.end, end: pa.end, text: '' }, kind: 'dead-read' };
    return { hand: 'dead-read-not-fallback' };
  }
  const { g, usesAst } = bg;
  const E = chainTop;
  const P = E.parent;
  const condCtx = (n) => {
    const q = n.parent;
    return (ts.isIfStatement(q) && q.expression === n) || (ts.isConditionalExpression(q) && q.condition === n) || (ts.isWhileStatement(q) && q.expression === n);
  };
  const atom = (n, text) => {
    const q = n.parent;
    if ((ts.isBinaryExpression(q) && q.operatorToken.kind === K.AmpersandAmpersandToken) || condCtx(n)) return { edit: { start: n.getStart(sf), end: n.end, text: `${g} && ${text}` }, usesAst, kind: 'and-guard' };
    return { edit: { start: n.getStart(sf), end: n.end, text: `(${g} && ${text})` }, usesAst, kind: 'paren-guard' };
  };
  // E === literal
  if (ts.isBinaryExpression(P) && [K.EqualsEqualsEqualsToken, K.EqualsEqualsToken].includes(P.operatorToken.kind)) {
    const other = P.left === E ? P.right : P.left;
    if (literalLike(other, sf)) return atom(P, P.getText(sf));
  }
  // E in a truthiness position
  if ((ts.isBinaryExpression(P) && P.operatorToken.kind === K.AmpersandAmpersandToken) || condCtx(E)) return atom(E, E.getText(sf));
  if (ts.isPrefixUnaryExpression(P) && P.operator === K.ExclamationToken) return { edit: { start: E.getStart(sf), end: E.end, text: `(${g} && ${E.getText(sf)})` }, usesAst, kind: 'paren-guard' };
  const et = checker.getNonNullableType(checker.getTypeAtLocation(E));
  const isIter = (ts.isForOfStatement(P) && P.expression === E) || ts.isSpreadElement(P) || (ts.isVariableDeclaration(P) && P.initializer === E && ts.isArrayBindingPattern(P.name));
  const dflt = isIter ? '[]' : et.flags & ts.TypeFlags.BooleanLike ? 'false' : 'undefined';
  return { edit: { start: E.getStart(sf), end: E.end, text: `(${g} ? ${E.getText(sf)} : ${dflt})` }, usesAst, kind: 'ternary' };
};

// `const { a, b } = X;` where X lacks `a` on some union members: `a` moves to its own guarded const.
const planDestructure = (id, sf, checker) => {
  const be = id.parent;
  if (!ts.isBindingElement(be) || !ts.isObjectBindingPattern(be.parent) || be.dotDotDotToken || !ts.isIdentifier(be.name)) return { hand: 'destructure-shape' };
  const key = be.propertyName ?? be.name;
  if (!ts.isIdentifier(key)) return { hand: 'destructure-shape' };
  const decl = be.parent.parent;
  if (!ts.isVariableDeclaration(decl) || !decl.initializer || decl.type || !ts.isVariableDeclarationList(decl.parent) || decl.parent.declarations.length !== 1 || !ts.isVariableStatement(decl.parent.parent)) return { hand: 'destructure-shape' };
  const stmt = decl.parent.parent;
  if (stmt.modifiers?.length) return { hand: 'destructure-exported' };
  const bg = buildGuard(decl.initializer, key.text, sf, checker);
  if (bg.hand) return bg;
  if (bg.none) return { hand: 'dead-destructure' };
  const kw = decl.parent.flags & ts.NodeFlags.Const ? 'const' : 'let';
  const xt = decl.initializer.getText(sf);
  const read = `(${bg.g} ? ${xt}.${key.text} : undefined)`;
  const value = be.initializer ? `${read} ?? ${be.initializer.getText(sf)}` : read;
  const others = be.parent.elements.filter((e) => e !== be);
  const lineStart = sf.text.lastIndexOf('\n', stmt.getStart(sf)) + 1;
  const indent = sf.text.slice(lineStart, stmt.getStart(sf));
  const own = `${kw} ${be.name.text} = ${value};`;
  const text = others.length ? `${kw} { ${others.map((e) => e.getText(sf)).join(', ')} } = ${xt};\n${indent}${own}` : own;
  return { edit: { start: stmt.getStart(sf), end: stmt.end, text }, usesAst: bg.usesAst, kind: 'destructure' };
};

const errCount = (service, f) => service.getSemanticDiagnostics(f).length + service.getSyntacticDiagnostics(f).length;

const addAstImport = (abs, text) => {
  if (!/\bAST_NODE_TYPES\b/u.test(text)) return text;
  if (/import\s*\{[^}]*\bAST_NODE_TYPES\b[^}]*\}\s*from/u.test(text)) return text;
  const sf = lib.parse(abs, text);
  const first = sf.statements.find((s) => ts.isImportDeclaration(s));
  const at = first ? first.getStart(sf) : 0;
  return lib.mergeDuplicateImports(abs, `${text.slice(0, at)}import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';\n${text.slice(at)}`);
};

// Returns { applied: {kind:count}, hand: [{line, reason, code}] } after editing live[file].
const guardFile = (svc, live, file) => {
  const { service } = svc;
  const setText = (t) => live.set(file, { v: live.get(file).v + 1, text: t });
  const applied = {};
  const handSeen = new Map();
  for (let pass = 0; pass < 10; pass++) {
    const program = service.getProgram();
    const sf = program.getSourceFile(file);
    const checker = program.getTypeChecker();
    const diags = service.getSemanticDiagnostics(file).filter((d) => d.code === 2339);
    if (!diags.length) break;
    const cands = [];
    for (const d of diags) {
      const n = covering(sf, d.start, d.length);
      if (n && ts.isIdentifier(n) && ts.isBindingElement(n.parent)) {
        const pl = planDestructure(n, sf, checker);
        if (pl.hand) handSeen.set(d.start, { line: sf.getLineAndCharacterOfPosition(d.start).line + 1, reason: pl.hand });
        else cands.push(pl);
        continue;
      }
      if (!n || !ts.isIdentifier(n) || !ts.isPropertyAccessExpression(n.parent) || n.parent.name !== n) {
        handSeen.set(d.start, { line: sf.getLineAndCharacterOfPosition(d.start).line + 1, reason: 'not-a-property-read' });
        continue;
      }
      const pl = plan(n.parent, sf, checker);
      if (pl.hand) handSeen.set(d.start, { line: sf.getLineAndCharacterOfPosition(d.start).line + 1, reason: pl.hand, code: n.parent.parent.getText(sf).slice(0, 80) });
      else cands.push(pl);
    }
    if (!cands.length) break;
    // outermost edit wins when two overlap
    const keep = cands.filter((c) => !cands.some((o) => o !== c && o.edit.start <= c.edit.start && o.edit.end >= c.edit.end && (o.edit.end - o.edit.start > c.edit.end - c.edit.start || (o.edit.start < c.edit.start))));
    const uniq = keep.filter((c, i) => keep.findIndex((o) => o.edit.start === c.edit.start && o.edit.end === c.edit.end) === i);
    const before = errCount(service, file);
    const text0 = live.get(file).text;
    const tryApply = (set) => {
      let t = lib.applyEdits(text0, set.map((c) => c.edit));
      t = addAstImport(file, t);
      setText(t);
      return errCount(service, file);
    };
    let acc = uniq;
    let after = tryApply(acc);
    if (after >= before) {
      const good = [];
      for (const c of uniq) {
        if (tryApply([c]) < before) good.push(c);
      }
      acc = good;
      if (!acc.length) {
        setText(text0);
        break;
      }
      after = tryApply(acc);
      if (after >= before) {
        setText(text0);
        break;
      }
    }
    for (const c of acc) applied[c.kind] = (applied[c.kind] ?? 0) + 1;
  }
  return { applied, hand: [...handSeen.values()] };
};

// The `Identifier` name brand never held a parsed value: a local `Set<Identifier>`, `Map<Identifier, _>` or
// `as Identifier` that now receives `TSESTree.Identifier['name']` (a plain string) becomes `string`.
// Kept only when the file's errors drop; the import goes when nothing else uses it.
const widenBrandFile = (svc, live, file) => {
  const { service } = svc;
  const brandDiags = service.getSemanticDiagnostics(file).filter((d) => [2345, 2322].includes(d.code) && /string & \$brand<"Identifier">/u.test(ts.flattenDiagnosticMessageText(d.messageText, ' ')));
  if (!brandDiags.length) return 0;
  const text0 = live.get(file).text;
  const sf = lib.parse(file, text0);
  const imp = sf.statements.find((s) => ts.isImportDeclaration(s) && !/#gateway/u.test(s.moduleSpecifier.getText(sf)) && s.importClause?.namedBindings && ts.isNamedImports(s.importClause.namedBindings) && s.importClause.namedBindings.elements.some((e) => e.name.text === 'Identifier'));
  if (!imp) return 0;
  const edits = [];
  const visit = (n) => {
    if (n !== imp && ts.isTypeReferenceNode(n) && ts.isIdentifier(n.typeName) && n.typeName.text === 'Identifier') edits.push({ start: n.getStart(sf), end: n.end, text: 'string' });
    ts.forEachChild(n, visit);
  };
  visit(sf);
  if (!edits.length) return 0;
  let t = lib.applyEdits(text0, edits);
  const els = imp.importClause.namedBindings.elements.filter((e) => e.name.text !== 'Identifier');
  const q = imp.moduleSpecifier.getText(sf);
  const isType = imp.importClause.isTypeOnly;
  const repl = els.length ? `import${isType ? ' type' : ''} { ${els.map((e) => e.getText(sf)).join(', ')} } from ${q};` : '';
  const before = errCount(service, file);
  const impText = text0.slice(imp.getStart(sf), imp.end);
  const tImp = t.replace(impText, repl);
  live.set(file, { v: live.get(file).v + 1, text: tImp });
  if (errCount(service, file) < before) return edits.length;
  live.set(file, { v: live.get(file).v + 1, text: text0 });
  return 0;
};

module.exports = { guardFile, widenBrandFile };

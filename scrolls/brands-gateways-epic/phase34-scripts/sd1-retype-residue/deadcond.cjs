// SD1 (c): a condition the real union types decide is dead code. Census plus removal of the safe shapes:
//   a && b        a pure and always truthy          -> b
//   a || b        a pure and always truthy          -> a
//   a ? x : y     a pure and always truthy          -> x
//   x && a && b   a pure, always truthy, in a chain -> x && b   (only where the chain's value is not used as a value)
//   if (!a) <return|continue|break|throw>;   a pure, always truthy, no else -> the statement goes
//   if (Array.isArray(a)) <return|continue|break>;   a's type holds no array and no any/unknown -> goes
// `pure` is an identifier or a property/element chain of them: no call, so nothing an evaluation could do is lost.
// Every pass is gated: the file's error count must not rise.
const lib = require('../lib/repo.cjs');
const { ts } = lib;
const K = ts.SyntaxKind;

const FALSY_LIKE = ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void | ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Never | ts.TypeFlags.TypeParameter | ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral | ts.TypeFlags.Number | ts.TypeFlags.String | ts.TypeFlags.BigInt | ts.TypeFlags.NumberLiteral | ts.TypeFlags.StringLiteral | ts.TypeFlags.BigIntLiteral | ts.TypeFlags.Enum | ts.TypeFlags.EnumLiteral | ts.TypeFlags.Instantiable | ts.TypeFlags.ESSymbolLike;

const alwaysTruthy = (t) => {
  const parts = t.isUnion() ? t.types : [t];
  return parts.length > 0 && parts.every((p) => !(p.flags & FALSY_LIKE) && p.flags & (ts.TypeFlags.Object | ts.TypeFlags.NonPrimitive));
};

const isPure = (e) =>
  e.kind === K.Identifier ||
  e.kind === K.ThisKeyword ||
  ((ts.isPropertyAccessExpression(e) || ts.isNonNullExpression(e)) && isPure(e.expression)) ||
  (ts.isElementAccessExpression(e) && isPure(e.expression) && (ts.isStringLiteral(e.argumentExpression) || ts.isNumericLiteral(e.argumentExpression)));

const exits = (st) => {
  const one = ts.isBlock(st) && st.statements.length === 1 ? st.statements[0] : st;
  return ts.isReturnStatement(one) || ts.isContinueStatement(one) || ts.isBreakStatement(one) || ts.isThrowStatement(one);
};

const valueUnused = (n) => {
  const p = n.parent;
  if (ts.isParenthesizedExpression(p)) return valueUnused(p);
  if (ts.isIfStatement(p) || ts.isWhileStatement(p) || ts.isDoStatement(p)) return p.expression === n;
  if (ts.isConditionalExpression(p)) return p.condition === n;
  if (ts.isPrefixUnaryExpression(p) && p.operator === K.ExclamationToken) return true;
  if (ts.isBinaryExpression(p) && (p.operatorToken.kind === K.AmpersandAmpersandToken || p.operatorToken.kind === K.BarBarToken)) return p.left === n ? true : valueUnused(p);
  return false;
};

const scan = (sf, checker) => {
  const found = [];
  const visit = (n) => {
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === K.AmpersandAmpersandToken) {
      if (isPure(n.left) && alwaysTruthy(checker.getTypeAtLocation(n.left))) found.push({ kind: 'and-left', edit: { start: n.getStart(sf), end: n.right.getStart(sf), text: '' }, node: n });
      else if (isPure(n.right) && alwaysTruthy(checker.getTypeAtLocation(n.right)) && valueUnused(n)) found.push({ kind: 'and-right', edit: { start: n.left.end, end: n.end, text: '' }, node: n });
    }
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === K.BarBarToken && isPure(n.left) && alwaysTruthy(checker.getTypeAtLocation(n.left))) found.push({ kind: 'or-left', edit: { start: n.left.end, end: n.end, text: '' }, node: n });
    if (ts.isConditionalExpression(n) && isPure(n.condition) && alwaysTruthy(checker.getTypeAtLocation(n.condition))) found.push({ kind: 'ternary', edit: { start: n.getStart(sf), end: n.end, text: n.whenTrue.getText(sf) }, node: n });
    if (ts.isIfStatement(n) && !n.elseStatement && exits(n.thenStatement)) {
      const c = n.expression;
      if (ts.isPrefixUnaryExpression(c) && c.operator === K.ExclamationToken && isPure(c.operand) && alwaysTruthy(checker.getTypeAtLocation(c.operand))) found.push({ kind: 'if-not-truthy-exit', edit: stmtRange(n, sf), node: n });
      if (ts.isCallExpression(c) && c.expression.getText(sf) === 'Array.isArray' && c.arguments.length === 1 && isPure(c.arguments[0])) {
        const t = checker.getTypeAtLocation(c.arguments[0]);
        const parts = t.isUnion() ? t.types : [t];
        if (parts.every((p) => !(p.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.TypeParameter | ts.TypeFlags.Instantiable)) && !checker.isArrayLikeType(p))) found.push({ kind: 'if-isarray-exit', edit: stmtRange(n, sf), node: n });
      }
    }
    if (ts.isPrefixUnaryExpression(n) && n.operator === K.ExclamationToken && isPure(n.operand) && alwaysTruthy(checker.getTypeAtLocation(n.operand))) found.push({ kind: 'not-truthy', edit: { start: n.getStart(sf), end: n.end, text: 'false' }, node: n });
    if (ts.isBinaryExpression(n) && [K.EqualsEqualsEqualsToken, K.ExclamationEqualsEqualsToken, K.EqualsEqualsToken, K.ExclamationEqualsToken].includes(n.operatorToken.kind)) {
      const isNil = (x) => x.kind === K.NullKeyword || (ts.isIdentifier(x) && x.text === 'undefined');
      const nl = [n.left, n.right].find(isNil);
      const other = nl === n.left ? n.right : n.left;
      if (nl && !isNil(other) && isPure(other) && !nullableType(checker.getTypeAtLocation(other))) {
        const eq = [K.EqualsEqualsEqualsToken, K.EqualsEqualsToken].includes(n.operatorToken.kind);
        found.push({ kind: 'nullish-compare', edit: { start: n.getStart(sf), end: n.end, text: eq ? 'false' : 'true' }, node: n });
      }
    }
    if ((ts.isPropertyAccessExpression(n) || ts.isElementAccessExpression(n) || ts.isCallExpression(n)) && n.questionDotToken && !nullableType(checker.getTypeAtLocation(n.expression))) {
      found.push({ kind: 'optional-chain', edit: { start: n.questionDotToken.getStart(sf), end: n.questionDotToken.end, text: ts.isPropertyAccessExpression(n) ? '.' : '' }, node: n });
    }
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === K.QuestionQuestionToken && !nullableType(checker.getTypeAtLocation(n.left))) found.push({ kind: 'nullish-coalesce', edit: { start: n.left.end, end: n.end, text: '' }, node: n });
    // constant folding of what the edits above leave behind
    const isBool = (x, v) => (v ? x.kind === K.TrueKeyword : x.kind === K.FalseKeyword) || (ts.isParenthesizedExpression(x) && isBool(x.expression, v));
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === K.AmpersandAmpersandToken) {
      if (isBool(n.left, true)) found.push({ kind: 'fold', edit: { start: n.getStart(sf), end: n.right.getStart(sf), text: '' }, node: n });
      else if (isBool(n.left, false)) found.push({ kind: 'fold', edit: { start: n.getStart(sf), end: n.end, text: 'false' }, node: n });
      else if (isBool(n.right, true) && (valueUnused(n) || boolish(checker.getTypeAtLocation(n.left)))) found.push({ kind: 'fold', edit: { start: n.left.end, end: n.end, text: '' }, node: n });
    }
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === K.BarBarToken) {
      if (isBool(n.left, false)) found.push({ kind: 'fold', edit: { start: n.getStart(sf), end: n.right.getStart(sf), text: '' }, node: n });
      else if (isBool(n.left, true)) found.push({ kind: 'fold', edit: { start: n.getStart(sf), end: n.end, text: 'true' }, node: n });
      else if (isBool(n.right, false) && (valueUnused(n) || boolish(checker.getTypeAtLocation(n.left)))) found.push({ kind: 'fold', edit: { start: n.left.end, end: n.end, text: '' }, node: n });
    }
    if (ts.isPrefixUnaryExpression(n) && n.operator === K.ExclamationToken && (isBool(n.operand, true) || isBool(n.operand, false))) found.push({ kind: 'fold', edit: { start: n.getStart(sf), end: n.end, text: isBool(n.operand, true) ? 'false' : 'true' }, node: n });
    if (ts.isParenthesizedExpression(n) && (n.expression.kind === K.TrueKeyword || n.expression.kind === K.FalseKeyword)) found.push({ kind: 'fold', edit: { start: n.getStart(sf), end: n.end, text: n.expression.getText(sf) }, node: n });
    if (ts.isIfStatement(n) && (isBool(n.expression, true) || isBool(n.expression, false))) {
      const yes = isBool(n.expression, true);
      const keep = yes ? n.thenStatement : n.elseStatement;
      if (!keep) found.push({ kind: 'fold', edit: stmtRange(n, sf), node: n });
      else found.push({ kind: 'fold', edit: { start: n.getStart(sf), end: n.end, text: unblock(keep, sf) }, node: n });
    }
    if (ts.isConditionalExpression(n) && (isBool(n.condition, true) || isBool(n.condition, false))) found.push({ kind: 'fold', edit: { start: n.getStart(sf), end: n.end, text: (isBool(n.condition, true) ? n.whenTrue : n.whenFalse).getText(sf) }, node: n });
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return found;
};

const NU = ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void | ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.TypeParameter | ts.TypeFlags.Never;
const nullableType = (t) => (t.isUnion() ? t.types : [t]).some((p) => p.flags & NU);
const boolish = (t) => (t.isUnion() ? t.types : [t]).every((p) => p.flags & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral));
// `{ a; b; }` -> its statements, re-indented to the block's own level
const unblock = (st, sf) => {
  if (!ts.isBlock(st)) return st.getText(sf);
  if (!st.statements.length) return ';';
  const inner = sf.text.slice(st.statements[0].getFullStart(), st.statements[st.statements.length - 1].end).replace(/^\s*\n/u, '');
  const lines = inner.split('\n');
  const indent = (/^\s*/u.exec(lines[0]) ?? [''])[0];
  const parentLineStart = sf.text.lastIndexOf('\n', st.parent.getStart(sf)) + 1;
  const pInd = (/^\s*/u.exec(sf.text.slice(parentLineStart)) ?? [''])[0];
  return lines.map((l, i) => (i === 0 ? l.trimStart() : l.startsWith(indent) ? pInd + l.slice(indent.length) : l)).join('\n');
};

const stmtRange = (st, sf) => {
  const lineStart = sf.text.lastIndexOf('\n', st.getStart(sf)) + 1;
  const onlyWs = /^\s*$/u.test(sf.text.slice(lineStart, st.getStart(sf)));
  const lineEnd = sf.text.indexOf('\n', st.end);
  return onlyWs ? { start: lineStart, end: lineEnd === -1 ? st.end : lineEnd + 1, text: '' } : { start: st.getStart(sf), end: st.end, text: '' };
};

const errCount = (service, f) => service.getSemanticDiagnostics(f).length + service.getSyntacticDiagnostics(f).length;

const census = (svc, files) => {
  const program = svc.service.getProgram();
  const checker = program.getTypeChecker();
  const c = {};
  for (const f of files) for (const x of scan(program.getSourceFile(f), checker)) c[x.kind] = (c[x.kind] ?? 0) + 1;
  return c;
};

// One accepted edit at a time per pass keeps positions valid; a rejected edit is not retried.
const eliminateFile = (svc, live, file) => {
  const { service } = svc;
  const applied = {};
  const rejected = new Set();
  for (let guard = 0; guard < 80; guard++) {
    const program = service.getProgram();
    const sf = program.getSourceFile(file);
    const cands = scan(sf, program.getTypeChecker()).filter((x) => !rejected.has(`${x.edit.start}:${x.kind}`));
    if (!cands.length) break;
    // innermost-last: apply the edit that starts last so earlier positions stay valid within one pass
    const pick = cands.sort((a, b) => b.edit.start - a.edit.start)[0];
    const text0 = live.get(file).text;
    const before = errCount(service, file);
    live.set(file, { v: live.get(file).v + 1, text: lib.applyEdits(text0, [pick.edit]) });
    if (errCount(service, file) <= before) applied[pick.kind] = (applied[pick.kind] ?? 0) + 1;
    else {
      live.set(file, { v: live.get(file).v + 1, text: text0 });
      rejected.add(`${pick.edit.start}:${pick.kind}`);
    }
  }
  return applied;
};

module.exports = { census, eliminateFile };

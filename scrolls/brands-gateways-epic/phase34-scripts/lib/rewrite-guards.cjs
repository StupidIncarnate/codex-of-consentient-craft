// Questions a "build through the parse" rewriter asks before it wraps a value in `contract.parse(...)`. Each one is a
// defect the first big-bang run repaired by hand (F125): a wrap target that is not a value (`parse(return)`), a field
// schema handed a whole object, a wrap that cannot fix its own diagnostic and is wrapped again each round, a parse
// written into the contract it parses, a parse that drops the functions an object holds, a parse of an un-awaited Promise.
// Every function answers with data; the caller decides whether to skip, and records the reason in its leftovers.
const { ts, isPromiseType } = require('./repo.cjs');

const CONTRACT_FILE = /-contract\.ts$/u;
const isContractFile = (abs) => CONTRACT_FILE.test(abs);

// A value that needs its owner's parse to gain a brand: string, number, boolean, null, undefined, or an array or union of
// those. A branded value is an intersection (already parsed); an object, a Promise, `any` and `unknown` are not plain.
const isPlainValueType = (checker, type) => {
  if (type.isUnion()) return type.types.every((t) => isPlainValueType(checker, t));
  if (type.flags & (ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.BooleanLike | ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Void)) return true;
  if (checker.isArrayType(type)) return isPlainValueType(checker, checker.getTypeArguments(type)[0]);
  return false;
};

const PARSE_NAMES = new Set(['parse', 'safeParse']);
const isParseCall = (n) => ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && PARSE_NAMES.has(n.expression.name.text);
// The node is a parse call, or an argument of one: wrapping it again stacks a second parse on the first.
const alreadyParsed = (n) => {
  let x = n;
  while (x.parent && ts.isParenthesizedExpression(x.parent)) x = x.parent;
  if (isParseCall(n)) return true;
  return !!x.parent && isParseCall(x.parent) && x.parent.arguments.includes(x);
};

// The expression a diagnostic's "bare value handed to a typed slot" wraps. `valueNode` is the innermost node at the
// diagnostic's start. The diagnostic can sit on a keyword (`return`), a declaration's name or a callee, none of which is a
// value: the value is the statement's expression, the declaration's initializer, the call's argument, the arrow's body.
const bareValueTarget = ({ sf, d, valueNode, prop }) => {
  if (prop && ts.isBinaryExpression(prop) && prop.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    return prop.left === valueNode || prop.left.getStart(sf) === d.start ? prop.right : null;
  }
  const p = valueNode.parent;
  if (!p) return null;
  if (ts.isCallExpression(p)) return p.arguments.includes(valueNode) ? valueNode : null;
  if (ts.isReturnStatement(p)) return p.expression ?? null;
  if (ts.isVariableDeclaration(p)) return p.initializer ?? null;
  if (ts.isArrowFunction(p)) return p.body === valueNode && !ts.isBlock(valueNode) ? valueNode : null;
  return null;
};

// Names of the properties of an object literal whose value is a function, at any depth of nested literals and arrays.
// A zod parse keeps only the keys its schema lists, so a literal that holds a function loses it at runtime.
const functionHolders = (checker, lit) => {
  const hasCall = (t) => (t.isUnion() ? t.types.some(hasCall) : checker.getSignaturesOfType(t, ts.SignatureKind.Call).length > 0);
  const found = [];
  const walk = (e, pathName) => {
    if (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isSatisfiesExpression(e)) return walk(e.expression, pathName);
    if (ts.isObjectLiteralExpression(e)) {
      for (const p of e.properties) {
        if (ts.isSpreadAssignment(p)) continue;
        const name = `${pathName}${p.name ? p.name.getText().replace(/['"]/gu, '') : '?'}`;
        if (ts.isMethodDeclaration(p) || ts.isGetAccessorDeclaration(p) || ts.isSetAccessorDeclaration(p)) found.push({ name, direct: !pathName });
        else if (ts.isShorthandPropertyAssignment(p)) { if (hasCall(checker.getTypeAtLocation(p.name))) found.push({ name, direct: !pathName }); }
        else if (ts.isPropertyAssignment(p)) walk(p.initializer, `${name}.`) ?? (hasCall(checker.getTypeAtLocation(p.initializer)) && found.push({ name, direct: !pathName }));
      }
      return true;
    }
    if (ts.isArrayLiteralExpression(e)) {
      let any = false;
      for (const el of e.elements) any = walk(el, `${pathName}[]`) || any;
      return any;
    }
    return undefined;
  };
  walk(lit, '');
  return found;
};

module.exports = { isContractFile, isPromiseType, isPlainValueType, alreadyParsed, bareValueTarget, functionHolders, isParseCall };

// Site collector for the B17 C4 rewrite: every JSON.parse(..) / <expr>.json() in production code outside the
// gateway, classified by where the raw value goes next. Also the index of contract types.
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');
const { ts } = lib;

const isParseCall = (n) =>
  ts.isCallExpression(n) &&
  ts.isPropertyAccessExpression(n.expression) &&
  /^(parse|safeParse)$/u.test(n.expression.name.text) &&
  /[cC]ontract/u.test(n.expression.expression.getText());

// name -> [{ contractConst, file, pkg }] for `export type X = z.infer<typeof yContract>`
const buildTypeIndex = (ws) => {
  const typeIndex = new Map();
  for (const w of ws) {
    if (w.isGateway) continue;
    for (const f of lib.walk(path.join(w.dir, 'src'))) {
      if (!/-contract\.ts$/u.test(f)) continue;
      const sf = lib.parse(f);
      for (const st of sf.statements) {
        if (
          ts.isTypeAliasDeclaration(st) &&
          st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
          ts.isTypeReferenceNode(st.type) &&
          /z\.(infer|output)$/u.test(st.type.typeName.getText(sf))
        ) {
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
  return typeIndex;
};

const collect = (ws) => {
  const sites = [];
  for (const w of ws) {
    if (w.isGateway) continue;
    for (const f of lib.walk(path.join(w.dir, 'src'))) {
      if (lib.isTestSupport(f)) continue;
      const text = fs.readFileSync(f, 'utf8');
      if (!/JSON\.parse|\.json\(/u.test(text)) continue;
      const sf = lib.parse(f, text);
      const fileImports = new Map();
      for (const st of sf.statements) {
        if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) {
          for (const e of st.importClause.namedBindings.elements) fileImports.set(e.name.text, { spec: st.moduleSpecifier.text, typeOnly: st.importClause.isTypeOnly || e.isTypeOnly });
        }
      }
      const visit = (n) => {
        const isJsonParse = ts.isCallExpression(n) && n.expression.getText(sf) === 'JSON.parse';
        const isDotJson = ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'json' && n.arguments.length === 0;
        if (isJsonParse || isDotJson) sites.push(classify(n, { f, w, sf, text, fileImports, isJsonParse }));
        ts.forEachChild(n, visit);
      };
      visit(sf);
    }
  }
  return sites;
};

const usesOf = (d) => {
  const scope = (function up(x) {
    while (x && !ts.isBlock(x) && !ts.isSourceFile(x)) x = x.parent;
    return x;
  })(d);
  const uses = [];
  const v = (x) => {
    if (
      ts.isIdentifier(x) &&
      x.text === d.name.text &&
      x !== d.name &&
      !(ts.isPropertyAccessExpression(x.parent) && x.parent.name === x) &&
      !(ts.isPropertyAssignment(x.parent) && x.parent.name === x)
    )
      uses.push(x);
    ts.forEachChild(x, v);
  };
  ts.forEachChild(scope, v);
  return uses;
};

const classify = (n, ctx) => {
  const { sf } = ctx;
  let cur = n;
  let wrapAwait = false;
  while (cur.parent && (ts.isAwaitExpression(cur.parent) || ts.isParenthesizedExpression(cur.parent))) {
    cur = cur.parent;
  }
  const info = { ...ctx, node: n, cur };
  let p = cur.parent;
  // `x as unknown` / `x as T` layers: peel `as unknown` first, then look at the parent
  while (p && ts.isAsExpression(p) && p.expression === cur && p.type.kind === ts.SyntaxKind.UnknownKeyword) {
    info.sawAsUnknown = true;
    cur = p;
    p = cur.parent;
  }
  info.top = cur; // outermost node of the raw value expression (may include `as unknown`)
  let klass = 'other';
  if (p && ts.isCallExpression(p) && p.arguments[0] === cur && isParseCall(p)) klass = 'direct-parse';
  else if (p && ts.isAsExpression(p) && p.expression === cur) {
    info.castType = p.type.getText(sf);
    info.castNode = p;
    klass = 'cast-type';
  } else if (p && ts.isVariableDeclaration(p) && p.initializer === cur) {
    info.decl = p;
    klass = ts.isIdentifier(p.name) ? 'var' : 'var-destructured';
  } else if (p && ts.isReturnStatement(p)) klass = 'return';
  else if (p && ts.isArrowFunction(p) && p.body === cur) klass = 'return';
  else if (p && ts.isPropertyAccessExpression(p) && p.expression === cur) klass = 'read-first';
  else if (p && ts.isCallExpression(p) && p.arguments.includes(cur)) klass = 'passed-to-call';
  else if (p && ts.isBinaryExpression(p) && p.right === cur) klass = 'assigned';
  if (klass === 'var') {
    const uses = usesOf(info.decl);
    info.uses = uses;
    const parseUse = (u) => u.parent && ts.isCallExpression(u.parent) && u.parent.arguments[0] === u && isParseCall(u.parent);
    if (uses.length === 1 && parseUse(uses[0])) klass = 'var-single-use-parse';
    else if (uses.length === 0) klass = 'var-unused';
    else if (uses.some(parseUse)) klass = 'var-parse-plus-other-uses';
    else klass = 'var-other';
  }
  info.klass = klass;
  return info;
};

module.exports = { collect, buildTypeIndex, isParseCall, usesOf };

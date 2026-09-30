// B04 prototype: retype visitor handlers and helper params from the flat `Tsestree` copy to real
// TSESTree types, `EslintContext` to TSESLint.RuleContext, string `.type` compares to AST_NODE_TYPES.
// Pure text transform; nothing here writes under packages/.
const path = require('path');
const lib = require('../lib/repo.cjs');
const { ts, ROOT } = lib;
const { AST_NODE_TYPES } = lib.rootRequire('@typescript-eslint/types');
const NODE_NAMES = new Set(Object.keys(AST_NODE_TYPES));
const GATEWAY = `${lib.GW}npm/typescript-eslint__utils`;

const CTX_MAP = {
  EslintContext: 'TSESLint.RuleContext<string, unknown[]>',
  EslintSourceCode: 'TSESLint.SourceCode',
  EslintRuleFixer: 'TSESLint.RuleFixer',
  EslintScope: 'TSESLint.Scope.Scope',
  EslintComment: 'TSESTree.Comment',
};
const NO_CTX = process.env.B04_NO_CTX === '1';
const REMOVE_NAMES = new Set(['Tsestree', ...(NO_CTX ? [] : Object.keys(CTX_MAP))]);

// 'CallExpression:exit', 'A, B', 'Program > X[foo=1]', '*' -> TSESTree type text
const selectorType = (key) => {
  const parts = key.split(',').map((s) => s.trim()).filter(Boolean);
  const names = [];
  for (const p of parts) {
    const last = p.split(/\s*[>+~]\s*|\s+(?![^[]*\])/u).filter(Boolean).pop() ?? '';
    const m = /^([A-Za-z]+)/u.exec(last);
    if (!m || !NODE_NAMES.has(m[1])) return 'TSESTree.Node';
    names.push(`TSESTree.${m[1]}`);
  }
  return names.length ? [...new Set(names)].join(' | ') : 'TSESTree.Node';
};

const propKey = (name) =>
  ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name) ? name.text : null;

const retype = (abs, text) => {
  const sf = lib.parse(abs, text);
  const edits = [];
  const stats = { handlers: 0, helpers: 0, ctx: 0, cmp: 0, statics: 0 };
  let needsNodeTypes = false;
  let needsTree = false;
  let needsLint = false;
  const removedImports = [];

  const handlerParam = (tr) => {
    // tr: TypeReference `Tsestree` that is the type of a param
    const p = tr.parent;
    if (!ts.isParameter(p) || p.type !== tr) return null;
    const fn = p.parent;
    if (!(ts.isArrowFunction(fn) || ts.isFunctionExpression(fn) || ts.isMethodDeclaration(fn))) return null;
    if (fn.parameters[0] !== p) return null;
    let holder = fn;
    let key = null;
    if (ts.isMethodDeclaration(fn)) key = propKey(fn.name);
    else if (ts.isPropertyAssignment(fn.parent) && fn.parent.initializer === fn) key = propKey(fn.parent.name);
    if (key === null) return null;
    if (!ts.isObjectLiteralExpression(holder.parent) && !(ts.isPropertyAssignment(holder.parent) && ts.isObjectLiteralExpression(holder.parent.parent))) return null;
    return key;
  };

  const visit = (n) => {
    if (ts.isImportDeclaration(n)) {
      const nb = n.importClause?.namedBindings;
      if (nb && ts.isNamedImports(nb) && nb.elements.some((e) => REMOVE_NAMES.has((e.propertyName ?? e.name).text))) {
        removedImports.push(n);
      }
      return;
    }
    if (ts.isTypeReferenceNode(n) && ts.isIdentifier(n.typeName)) {
      const nm = n.typeName.text;
      if (nm === 'Tsestree') {
        const key = handlerParam(n);
        needsTree = true;
        if (key !== null) {
          stats.handlers++;
          edits.push({ start: n.getStart(sf), end: n.end, text: selectorType(key) });
        } else {
          stats.helpers++;
          edits.push({ start: n.getStart(sf), end: n.end, text: 'TSESTree.Node' });
        }
      } else if (CTX_MAP[nm] && !NO_CTX) {
        stats.ctx++;
        if (CTX_MAP[nm].startsWith('TSESLint')) needsLint = true;
        else needsTree = true;
        edits.push({ start: n.typeName.getStart(sf), end: n.typeName.end, text: CTX_MAP[nm] });
      }
    }
    // tsestreeNodeTypeStatics.nodeTypes.X -> AST_NODE_TYPES.X
    if (
      ts.isPropertyAccessExpression(n) &&
      ts.isPropertyAccessExpression(n.expression) &&
      ts.isIdentifier(n.expression.expression) &&
      n.expression.expression.text === 'tsestreeNodeTypeStatics' &&
      n.expression.name.text === 'nodeTypes'
    ) {
      stats.statics++;
      needsNodeTypes = true;
      edits.push({ start: n.getStart(sf), end: n.end, text: `AST_NODE_TYPES.${n.name.text}` });
      return;
    }
    // x.type === 'Lit'
    if (ts.isBinaryExpression(n) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken].includes(n.operatorToken.kind)) {
      const isType = (e) => (ts.isPropertyAccessExpression(e) && e.name.text === 'type');
      const conv = (lit) => {
        if ((ts.isStringLiteral(lit) || ts.isNoSubstitutionTemplateLiteral(lit)) && NODE_NAMES.has(lit.text)) {
          stats.cmp++;
          needsNodeTypes = true;
          edits.push({ start: lit.getStart(sf), end: lit.end, text: `AST_NODE_TYPES.${lit.text}` });
        }
      };
      if (isType(n.left)) conv(n.right);
      else if (isType(n.right)) conv(n.left);
    }
    if (ts.isCaseClause(n) && ts.isPropertyAccessExpression(n.parent.parent.expression) && n.parent.parent.expression.name.text === 'type') {
      const lit = n.expression;
      if (ts.isStringLiteral(lit) && NODE_NAMES.has(lit.text)) {
        stats.cmp++;
        needsNodeTypes = true;
        edits.push({ start: lit.getStart(sf), end: lit.end, text: `AST_NODE_TYPES.${lit.text}` });
      }
    }
    // ['A','B'].includes(x.type)
    if (
      ts.isCallExpression(n) &&
      ts.isPropertyAccessExpression(n.expression) &&
      n.expression.name.text === 'includes' &&
      ts.isArrayLiteralExpression(n.expression.expression) &&
      n.arguments.length === 1 &&
      ts.isPropertyAccessExpression(n.arguments[0]) &&
      n.arguments[0].name.text === 'type' &&
      n.expression.expression.elements.every((e) => ts.isStringLiteral(e) && NODE_NAMES.has(e.text))
    ) {
      for (const e of n.expression.expression.elements) {
        stats.cmp++;
        needsNodeTypes = true;
        edits.push({ start: e.getStart(sf), end: e.end, text: `AST_NODE_TYPES.${e.text}` });
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  if (!edits.length && !removedImports.length) return { text, stats, changed: false };

  // Imports
  if (stats.statics) {
    for (const st of sf.statements) {
      if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings) && st.importClause.namedBindings.elements.some((e) => e.name.text === 'tsestreeNodeTypeStatics')) {
        const rest = text.slice(0, st.getStart(sf)) + text.slice(st.end);
        if (!/tsestreeNodeTypeStatics/u.test(rest.replace(/tsestreeNodeTypeStatics\.nodeTypes\.\w+/gu, ''))) {
          const lineEnd = text.indexOf('\n', st.end);
          edits.push({ start: st.getStart(sf), end: lineEnd === -1 ? st.end : lineEnd + 1, text: '' });
        }
      }
    }
  }
  const gatewayNames = [];
  if (needsNodeTypes) gatewayNames.push('AST_NODE_TYPES');
  const typeNames = [];
  if (needsLint) typeNames.push('TSESLint');
  if (needsTree) typeNames.push('TSESTree');
  // drop removed specifiers (keep other names of the same import)
  for (const imp of removedImports) {
    const els = imp.importClause.namedBindings.elements;
    const keep = els.filter((e) => !REMOVE_NAMES.has((e.propertyName ?? e.name).text));
    const lineEnd = text.indexOf('\n', imp.end);
    if (keep.length) {
      const q = imp.moduleSpecifier.getText(sf)[0];
      edits.push({ start: imp.getStart(sf), end: imp.end, text: `import${imp.importClause.isTypeOnly ? ' type' : ''} { ${keep.map((e) => e.getText(sf)).join(', ')} } from ${q}${imp.moduleSpecifier.text}${q};` });
    } else edits.push({ start: imp.getStart(sf), end: lineEnd === -1 ? imp.end : lineEnd + 1, text: '' });
  }
  let anchor = removedImports[0] ? removedImports[0].getStart(sf) : (sf.statements.find((s) => ts.isImportDeclaration(s))?.getStart(sf) ?? 0);
  const lines = [];
  if (gatewayNames.length) lines.push(`import { ${gatewayNames.join(', ')} } from '${GATEWAY}';`);
  if (typeNames.length) lines.push(`import type { ${typeNames.join(', ')} } from '${GATEWAY}';`);
  // if the anchor import is itself being replaced/removed with an edit at the same start, order matters:
  // insert as a zero-width edit placed before
  edits.push({ start: anchor, end: anchor, text: lines.join('\n') + (lines.length ? '\n' : '') });
  // zero-width insert must apply before a same-start replacement: applyEdits sorts by start desc, stable
  edits.sort((a, b) => a.start - b.start || (a.end - a.start) - (b.end - b.start));
  const out = applyEditsOrdered(text, edits);
  return { text: lib.mergeDuplicateImports(abs, out), stats, changed: true };
};

// Edits sorted ascending; zero-width inserts precede same-start replacements.
const applyEditsOrdered = (text, edits) => {
  let out = '';
  let pos = 0;
  for (const e of edits) {
    out += text.slice(pos, e.start) + e.text;
    pos = Math.max(pos, e.end);
  }
  return out + text.slice(pos);
};

module.exports = { retype, selectorType, NODE_NAMES, GATEWAY };

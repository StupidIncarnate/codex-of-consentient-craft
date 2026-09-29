// B04 (d): rewrite a test/proxy file's `TsestreeStub(...)` roots to gateway `<Node>Stub({ code })`
// (only roots the printer PROVED against the real parser), `EslintContextStub` to `RuleContextStub`,
// `TsestreeNodeType.X` to `AST_NODE_TYPES.X`, and fix imports. Nothing written under packages/.
const path = require('path');
const lib = require('../../phase34/lib/repo.cjs');
const { convertRoot } = require('./stubprint.cjs');
const { ts } = lib;
const GW = '#gateway/npm/typescript-eslint__utils';

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/gu, '$1-$2').replace(/([A-Z]+)([A-Z][a-z])/gu, '$1-$2').toLowerCase();
const stubPath = (type) => `${GW}/${kebab(type)}/${kebab(type)}.stub`;
const q = (s) => `'${s.replace(/\\/gu, '\\\\').replace(/'/gu, "\\'").replace(/\n/gu, '\\n')}'`;

// A `const x = <Stub>(...)` whose only reference is its own declaration was inlined into a printed code string.
const dropUnusedStubConsts = (abs, text) => {
  for (let round = 0; round < 8; round++) {
    const sf = lib.parse(abs, text);
    const edits = [];
    const visit = (n) => {
      if (ts.isVariableStatement(n) && n.declarationList.declarations.length === 1) {
        const d = n.declarationList.declarations[0];
        if (!(ts.getCombinedModifierFlags(n.declarationList.declarations[0]) & ts.ModifierFlags.Export) && !n.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) && ts.isIdentifier(d.name) && d.initializer && ts.isCallExpression(d.initializer) && /Stub$/u.test(d.initializer.expression.getText(sf))) {
          const uses = (text.match(new RegExp(`\\b${d.name.text}\\b`, 'gu')) || []).length;
          if (uses === 1) {
            const lineStart = text.lastIndexOf('\n', n.getStart(sf)) + 1;
            const lineEnd = text.indexOf('\n', n.end);
            edits.push({ start: lineStart, end: lineEnd === -1 ? n.end : lineEnd + 1, text: '' });
          }
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
    if (!edits.length) return text;
    text = lib.applyEdits(text, edits);
  }
  return text;
};

const convertTest = (abs, text) => {
  const sf = lib.parse(abs, text);
  const edits = [];
  const stubs = new Set(); // node types needing an import
  let ctxConverted = 0;
  let rootsOk = 0;
  let rootsSkipped = 0;
  let usesAst = false;
  const skippedRanges = [];
  const visit = (n, inStub) => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
      const nm = n.expression.text;
      if (nm === 'TsestreeStub' && !inStub) {
        const c = convertRoot(n, sf);
        if (c.ok) {
          rootsOk++;
          stubs.add(c.rootType);
          edits.push({ start: n.getStart(sf), end: n.end, text: `${c.rootType}Stub({ code: ${q(c.code)} })` });
        } else {
          rootsSkipped++;
          skippedRanges.push([n.getStart(sf), n.end]);
        }
        return;
      }
      if (nm === 'EslintContextStub') {
        const a = n.arguments[0];
        let ok = !a;
        if (a && ts.isObjectLiteralExpression(a)) {
          ok = a.properties.every((p) => ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) && a.properties.every((p) => ['report', 'filename'].includes(p.name.getText(sf)));
          if (!ok && a.properties.every((p) => ['report', 'filename', 'getFilename'].includes(p.name.getText(sf)))) {
            // getFilename: () => 'lit'  ->  filename: 'lit'
            const parts = [];
            ok = a.properties.every((p) => {
              const k = p.name.getText(sf);
              if (k !== 'getFilename') return parts.push(p.getText(sf)) > 0;
              const v = ts.isPropertyAssignment(p) ? p.initializer : null;
              if (v && ts.isArrowFunction(v) && ts.isStringLiteral(v.body)) return parts.push(`filename: ${v.body.getText(sf)}`) > 0;
              return false;
            });
            if (ok) {
              ctxConverted++;
              edits.push({ start: n.getStart(sf), end: n.end, text: `RuleContextStub({ ${parts.join(', ')} })` });
              stubs.add('__ctx');
              return;
            }
          }
        }
        if (ok) {
          ctxConverted++;
          stubs.add('__ctx');
          edits.push({ start: n.expression.getStart(sf), end: n.expression.end, text: 'RuleContextStub' });
          n.arguments.forEach((x) => visit(x, inStub));
          return;
        }
      }
    }
    const holder = n.parent && ts.isParenthesizedExpression(n.parent) ? n.parent : n;
    if (ts.isObjectLiteralExpression(n) && holder.parent && ts.isArrowFunction(holder.parent) && holder.parent.body === holder && holder.parent.type && holder.parent.type.getText(sf) === 'EslintContext') {
      const ks = n.properties.map((p) => (p.name ? p.name.getText(sf) : '')).sort().join(',');
      const rep = n.properties.find((p) => p.name && p.name.getText(sf) === 'report');
      if (/^(filename,)?report$/u.test(ks) && rep && ts.isPropertyAssignment(rep) && /^jest\.fn\(\)$/u.test(rep.initializer.getText(sf))) {
        ctxConverted++;
        stubs.add('__ctx');
        edits.push({ start: holder.getStart(sf), end: holder.end, text: 'RuleContextStub()' });
        return;
      }
    }
    if (ts.isPropertyAccessExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'TsestreeNodeType' && !inStub) {
      usesAst = true;
      edits.push({ start: n.getStart(sf), end: n.end, text: `AST_NODE_TYPES.${n.name.text}` });
      return;
    }
    ts.forEachChild(n, (c) => visit(c, inStub));
  };
  visit(sf, false);
  if (!edits.length) return { text, changed: false, rootsOk, rootsSkipped, ctxConverted };

  // Imports: TsestreeStub/TsestreeNodeType stay when a root was skipped; EslintContextStub leaves when converted.
  const importEdits = [];
  const newImports = [];
  const remaining = (name) => new RegExp(`\\b${name}\\b`, 'u').test(lib.applyEdits(text, edits).replace(/^import[^;]*;$/gmu, ''));
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings)) continue;
    const els = st.importClause.namedBindings.elements;
    const keep = els.filter((e) => {
      const nm = e.name.text;
      if (nm === 'TsestreeStub' || nm === 'TsestreeNodeType' || nm === 'EslintContextStub') return remaining(nm);
      return true;
    });
    if (keep.length === els.length) continue;
    const lineEnd = text.indexOf('\n', st.end);
    if (keep.length) importEdits.push({ start: st.getStart(sf), end: st.end, text: `import { ${keep.map((e) => e.getText(sf)).join(', ')} } from ${st.moduleSpecifier.getText(sf)};` });
    else importEdits.push({ start: st.getStart(sf), end: lineEnd === -1 ? st.end : lineEnd + 1, text: '' });
  }
  for (const t of stubs) {
    if (t === '__ctx') newImports.push(`import { RuleContextStub } from '${GW}/rule-context/rule-context.stub';`);
    else newImports.push(`import { ${t}Stub } from '${stubPath(t)}';`);
  }
  if (usesAst) newImports.push(`import { AST_NODE_TYPES } from '${GW}';`);
  const firstImport = sf.statements.find((s) => ts.isImportDeclaration(s));
  const anchor = firstImport ? firstImport.getStart(sf) : 0;
  const all = [...edits, ...importEdits, { start: anchor, end: anchor, text: newImports.join('\n') + '\n' }];
  all.sort((a, b) => a.start - b.start || a.end - a.start - (b.end - b.start));
  let out = '';
  let pos = 0;
  for (const e of all) {
    out += text.slice(pos, e.start) + e.text;
    pos = Math.max(pos, e.end);
  }
  out += text.slice(pos);
  out = dropUnusedStubConsts(abs, out);
  return { text: out, changed: true, rootsOk, rootsSkipped, ctxConverted, stubTypes: [...stubs].filter((s) => s !== '__ctx') };
};

module.exports = { convertTest, stubPath, kebab };

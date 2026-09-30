// B14 end-to-end prototype: for a printable shape, write contract + stub + test, move the alias / replace the
// return type, rewrite returns to contract.parse(...). Writes only under --out.
// Usage: node .../gen.cjs <repo-relative file> <name> --out=<dir>
const fs = require('fs');
const path = require('path');
const lib = require('../../lib/repo.cjs');
const { shapes, tryPrint, typeIndex, pascal, camel, kebab, contractNames, folderTypeOf } = require('./census.cjs');
const { ts, ROOT, rel } = lib;
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const out = arg('out');

// first literal `XStub({ value: <lit> })` seen anywhere: a value the stub is known to accept
let stubLits = null;
const stubLiteral = (name) => {
  if (!stubLits) {
    stubLits = new Map();
    for (const w of lib.workspaces()) {
      if (w.isGateway) continue;
      for (const f of lib.walk(path.join(w.dir, 'src'))) {
        if (!/\.(test|stub|proxy)\.tsx?$/u.test(f)) continue;
        const t = fs.readFileSync(f, 'utf8');
        for (const m of t.matchAll(/\b([A-Z]\w*)Stub\(\{ value: ('[^'\n]*'|-?\d+) \}\)/gu)) if (!stubLits.has(m[1])) stubLits.set(m[1], m[2]);
      }
    }
  }
  return stubLits.get(name);
};
const stubNeedsValue = (r) => {
  const stubFile = r.file.replace(/-contract\.ts$/u, '.stub.ts');
  if (!fs.existsSync(stubFile)) return false;
  const t = fs.readFileSync(stubFile, 'utf8');
  return !/=\s*\{\}\s*\)|= \{\}\):|\?:/u.test(t.split('=>')[0]);
};
const genOne = (fileRel, name) => {
  const s = shapes.find((x) => rel(x.file) === fileRel && x.name === name && !x.isTest && x.klass === 'data');
  if (!s) throw new Error(`no data shape ${name} in ${fileRel}`);
  const ft = folderTypeOf(s.file);
  let base0 = tryPrint(s).base ?? '';
  if (s.kind === 'return' && (ft === 'transformers' || ft === 'guards')) base0 = base0.replace(/Result$/u, '');
  const p = tryPrint(s, base0);
  if (!p.ok) return { ok: false, reason: p.reason };
  const w = lib.workspaces().find((x) => x.name === s.pkg);
  const base = p.base;
  if (typeIndex.has(base)) return { ok: false, reason: `contract name ${base} already exists` };
  const cname = camel(base) + 'Contract';
  const dir = path.join(w.dir, 'src/contracts', kebab(base));
  const cfile = path.join(dir, `${kebab(base)}-contract.ts`);
  const ctx = p.refs;
  // import specifiers for referenced contracts
  const specFor = (r, fromFile) => {
    if (r.pkg === s.pkg) {
      let x = path.relative(path.dirname(fromFile), r.file.replace(/\.ts$/u, ''));
      if (!x.startsWith('.')) x = './' + x;
      return x.split(path.sep).join('/');
    }
    return `${r.pkg}/contracts`;
  };
  const stubSpecFor = (r, fromFile) => (r.pkg === s.pkg ? specFor(r, fromFile).replace(/-contract$/u, '.stub') : `${r.pkg}/contracts`);
  const importsOf = (spec2) => {
    const bySpec = new Map();
    for (const [cn, r] of ctx) {
      const sp = spec2(r, cfile);
      (bySpec.get(sp) ?? bySpec.set(sp, []).get(sp)).push(cn);
    }
    return [...bySpec].map(([sp, names]) => `import { ${[...new Set(names)].join(', ')} } from '${sp}';`).join('\n');
  };
  const zodCode = p.code;
  const contractText = `/**\n * PURPOSE: Defines the data ${s.kind === 'alias' ? 'shape named ' + s.name : 'returned by ' + s.name}\n *\n * USAGE:\n * const value = ${cname}.parse(input);\n * // Returns validated ${base}\n */\nimport { z } from '${lib.ZOD_SPEC}';\n${importsOf(specFor)}\n\nexport const ${cname} = ${zodCode.replace(/\{ /gu, '{\n  ').replace(/, (?=\w+: z\.|\w+: \w+Contract)/gu, ',\n  ').replace(/ \}\)/gu, '\n})')};\n\nexport type ${base} = z.infer<typeof ${cname}>;\n`;
  // sample values for the stub
  const sample = (t) => {
    if (ts.isParenthesizedTypeNode(t)) return sample(t.type);
    switch (t.kind) {
      case ts.SyntaxKind.StringKeyword: return "'sample'";
      case ts.SyntaxKind.NumberKeyword: return '0';
      case ts.SyntaxKind.BooleanKeyword: return 'false';
      default:
    }
    if (ts.isLiteralTypeNode(t)) return t.literal.kind === ts.SyntaxKind.NullKeyword ? 'null' : t.literal.getText();
    if (ts.isArrayTypeNode(t) || (ts.isTypeOperatorNode(t))) return '[]';
    if (ts.isTypeReferenceNode(t)) { const n = t.typeName.getText(); if (n === 'Array') return '[]'; if (n === 'Record') return '{}'; const r = [...ctx.values()].find((x) => x.type === n); if (r && stubNeedsValue(r)) { const lit = stubLiteral(n); if (!lit) throw new Error(`no known literal for ${n}Stub`); return `${n}Stub({ value: ${lit} })`; } return `${n}Stub()`; }
    if (ts.isUnionTypeNode(t)) { const rest = t.types.filter((x) => x.kind !== ts.SyntaxKind.NullKeyword && x.kind !== ts.SyntaxKind.UndefinedKeyword); return sample(rest[0]); }
    if (ts.isTypeLiteralNode(t)) return `{ ${t.members.filter((m) => !m.questionToken).map((m) => `${m.name.getText()}: ${sample(m.type)}`).join(', ')} }`;
    return 'undefined';
  };
  const inner = p.inner;
  let stubBody;
  if (ts.isTypeLiteralNode(inner)) stubBody = sample(inner);
  else if (ts.isUnionTypeNode(inner) && inner.types.every((x) => ts.isTypeLiteralNode(x))) stubBody = sample(inner.types[0]);
  else if (ts.isArrayTypeNode(inner) || ts.isTypeOperatorNode(inner)) stubBody = '[]';
  else stubBody = '{}';
  const stubImports = [...ctx.values()].filter((r) => sampleUses(stubBody, r.type)).map((r) => ({ name: `${r.type}Stub`, spec: stubSpecFor(r, cfile) }));
  const bySpec = new Map();
  for (const i of stubImports) (bySpec.get(i.spec) ?? bySpec.set(i.spec, []).get(i.spec)).push(i.name);
  const isObj = ts.isTypeLiteralNode(inner) || (ts.isUnionTypeNode(inner) && inner.types.every((x) => ts.isTypeLiteralNode(x)));
  const withProps = (b) => (/^\{\s*\}$/u.test(b) ? '{ ...props }' : b.replace(/\s*\}$/u, ', ...props }'));
  const stubText = `import { ${cname} } from './${kebab(base)}-contract';\nimport type { ${base} } from './${kebab(base)}-contract';\nimport type { StubArgument } from '@dungeonmaster/shared/@types';\n${[...bySpec].map(([sp, names]) => `import { ${names.join(', ')} } from '${sp}';`).join('\n')}\n\nexport const ${base}Stub = (${isObj ? `{ ...props }: StubArgument<${base}> = {}` : ''}): ${base} =>\n  ${cname}.parse(${isObj ? withProps(stubBody) : stubBody});\n`;
  const firstField = ts.isTypeLiteralNode(inner) ? inner.members[0] : ts.isUnionTypeNode(inner) && ts.isTypeLiteralNode(inner.types[0]) ? inner.types[0].members[0] : null;
  const bad = firstField && firstField.type ? (firstField.type.kind === ts.SyntaxKind.BooleanKeyword ? "'nope'" : firstField.type.kind === ts.SyntaxKind.NumberKeyword ? "'nope'" : '123') : '123';
  const testText = `import { ${base}Stub } from './${kebab(base)}.stub';\nimport { ${cname} } from './${kebab(base)}-contract';\n\ndescribe('${cname}', () => {\n  describe('valid inputs', () => {\n    it('VALID: {stub} => parses successfully', () => {\n      const stub = ${base}Stub();\n\n      expect(${cname}.parse(stub)).toStrictEqual(stub);\n    });\n  });\n\n  describe('invalid inputs', () => {\n    it('INVALID: {${firstField ? firstField.name.getText() : 'value'}: wrong type} => throws', () => {\n      expect(() =>\n        ${cname}.parse({ ...${base}Stub(), ${firstField ? firstField.name.getText() : 'value'}: ${bad} } as never),\n      ).toThrow(/expected|invalid/iu);\n    });\n  });\n});\n`;

  // ---- rewrite the source file ----
  const text = fs.readFileSync(s.file, 'utf8');
  const sf = s.sf;
  const edits = [];
  const rewriteReturns = (fn, typeNodeText) => {
    const isAsync = !!fn.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword);
    const wrapsPromise = /^Promise</u.test(typeNodeText);
    if (wrapsPromise && !isAsync) return 'non-async function returning Promise (needs a read)';
    const parseWrap = (e) => `${cname}.parse(${e.getText(sf)})`;
    if (!ts.isBlock(fn.body)) {
      let b = fn.body;
      while (ts.isParenthesizedExpression(b)) b = b.expression;
      edits.push({ start: fn.body.getStart(sf), end: fn.body.end, text: parseWrap(b) });
    } else {
      const visit = (n) => {
        if (n !== fn && ts.isFunctionLike(n)) return;
        if (ts.isReturnStatement(n) && n.expression) edits.push({ start: n.expression.getStart(sf), end: n.expression.end, text: parseWrap(n.expression) });
        ts.forEachChild(n, visit);
      };
      ts.forEachChild(fn.body, visit);
    }
    return null;
  };
  if (s.kind === 'alias') {
    const lineStart = text.lastIndexOf('\n', s.node.getStart(sf)) + 1;
    const lineEnd = text.indexOf('\n', s.node.end);
    edits.push({ start: lineStart, end: lineEnd + 1, text: '' });
    let rewritten = 0;
    const find = (n) => {
      if (ts.isFunctionLike(n) && n.type && n.body && new RegExp(`\\b${s.name}\\b`, 'u').test(n.type.getText(sf))) {
        const why = rewriteReturns(n, n.type.getText(sf));
        if (why) throw new Error(why);
        rewritten++;
      }
      ts.forEachChild(n, find);
    };
    find(sf);
    if (!rewritten) return { ok: false, reason: 'alias used by no annotated function in this file (importers elsewhere)' };
    if (s.node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) return { ok: false, reason: 'exported alias: importers elsewhere must be re-pointed' };
  } else {
    // replace the object part of the return type text
    const t = p.inner;
    edits.push({ start: t.getStart(sf), end: t.end, text: base });
    // rewrite returns
    const why = rewriteReturns(s.fnNode, s.typeNode.getText(sf));
    if (why) return { ok: false, reason: why };
  }
  // imports in the source
  const firstImport = sf.statements.find((x) => ts.isImportDeclaration(x));
  const anchor = firstImport ? firstImport.getStart(sf) : 0;
  let spec = path.relative(path.dirname(s.file), cfile.replace(/\.ts$/u, ''));
  if (!spec.startsWith('.')) spec = './' + spec;
  spec = spec.split(path.sep).join('/');
  const needValue = true;
  edits.push({ start: anchor, end: anchor, text: `${needValue ? `import { ${cname} } from '${spec}';\n` : ''}import type { ${base} } from '${spec}';\n` });
  let newText = lib.applyEdits(text, edits);
  newText = dropUnusedImports(s.file, newText);
  // apply zero-width import before same-start replacements: applyEdits sorts desc by start; ok
  return { ok: true, base, cname, cfile, dir, contractText, stubText, testText, srcFile: s.file, srcText: newText, kind: s.kind, folder: ft };
};
const dropUnusedImports = (abs, text) => {
  const sf = lib.parse(abs, text);
  const edits = [];
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings) || st.importClause.name) continue;
    const els = st.importClause.namedBindings.elements;
    const used = (nm) => { let hit = false; const v = (n) => { if (hit || ts.isImportDeclaration(n)) return; if (ts.isIdentifier(n) && n.text === nm) hit = true; ts.forEachChild(n, v); }; sf.statements.forEach(v); return hit; };
    const keep = els.filter((e) => used(e.name.text));
    if (keep.length === els.length) continue;
    if (!keep.length) {
      const le = text.indexOf('\n', st.end);
      edits.push({ start: st.getStart(sf), end: le === -1 ? st.end : le + 1, text: '' });
    } else edits.push({ start: st.getStart(sf), end: st.end, text: `import${st.importClause.isTypeOnly ? ' type' : ''} { ${keep.map((e) => e.getText(sf)).join(', ')} } from ${st.moduleSpecifier.getText(sf)};` });
  }
  return lib.applyEdits(text, edits);
};
const sampleUses = (body, type) => new RegExp(`\\b${type}Stub\\(`, 'u').test(body);

module.exports = { genOne };
if (require.main === module) {
  const [f, n] = process.argv.slice(2);
  const g = genOne(f, n);
  if (!g.ok) return console.log('not generated:', g.reason);
  console.log(g.contractText, '\n---stub\n', g.stubText, '\n---src diff\n', lib.unifiedDiff(rel(g.srcFile), fs.readFileSync(g.srcFile, 'utf8'), g.srcText));
  if (out) {
    for (const [p, t] of [[g.cfile, g.contractText], [path.join(g.dir, `${kebab(g.base)}.stub.ts`), g.stubText], [path.join(g.dir, `${kebab(g.base)}-contract.test.ts`), g.testText], [g.srcFile, g.srcText]]) {
      const d = path.join(ROOT, out, rel(p));
      fs.mkdirSync(path.dirname(d), { recursive: true });
      fs.writeFileSync(d, t);
    }
  }
}

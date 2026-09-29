// SD1 (b) end to end: convert every test and proxy file of eslint-plugin and local-eslint that builds `TsestreeStub`
// trees or `EslintContextStub`s, over the SD1 production sample, generate the gateway node stubs the swaps
// need (an overlay, the real gateway is L0's), and typecheck every converted file before and after.
// Usage: node tmp/phase34/sd1-retype-residue/tests.cjs [--prod=tmp/sd1-sample2] [--out=tmp/sd1-tests-out] [--pkg=eslint-plugin]
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');
const { retype } = require('./retype.cjs');
const { convertTest, kebab } = require('./convert-tests2.cjs');
const { ts, ROOT, rel } = lib;
fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const PROD = path.join(ROOT, arg('prod') ?? 'tmp/sd1-sample2');
const outDir = arg('out');
const pkgs = (arg('pkg') ?? 'eslint-plugin,local-eslint').split(',');
const DEFAULT_CODE = { Identifier: 'x;', Literal: "'x';", TSTypeAnnotation: 'let x: string;', TSTypeReference: 'let x: T;', TSTypeLiteral: 'type T = { a: string };', TSPropertySignature: 'type T = { a: string };', AssignmentPattern: 'const { a = 1 } = y;', ObjectPattern: 'const { a } = y;', ImportDeclaration: "import { a } from 'x';", ImportSpecifier: "import { a } from 'x';", ExportNamedDeclaration: 'export const a = 1;', FunctionDeclaration: 'function f() {}', FunctionExpression: 'const f = function () {};', SpreadElement: 'f(...a);', VariableDeclarator: 'const a = 1;', IfStatement: 'if (a) {}', UnaryExpression: '!a;', TSArrayType: 'let x: string[];', TSStringKeyword: 'let x: string;', TSBooleanKeyword: 'let x: boolean;', ArrayExpression: 'const a = [];', ArrayPattern: 'const [a] = y;', TemplateLiteral: 'const t = `a`;', ClassDeclaration: 'class A {}', MethodDefinition: 'class A { m() {} }', ImportExpression: "import('x');", JSXText: 'const j = <a>t</a>;', JSXExpressionContainer: 'const j = <a>{b}</a>;', TSInterfaceBody: 'interface I { a: string }', TSTypePredicate: 'function f(x): x is string {}', NewExpression: 'new A();', TSAsExpression: 'a as b;', SwitchCase: 'switch (a) { case 1: }', BinaryExpression: 'a + b;', ExportSpecifier: 'export { a };' };

const overlay = new Map();
const walkSample = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walkSample(path.join(d, e.name)) : overlay.set(path.join(ROOT, path.relative(PROD, path.join(d, e.name))), fs.readFileSync(path.join(d, e.name), 'utf8'))));
walkSample(PROD);
const total = { files: 0, rootsOk: 0, rootsSkipped: 0, helperRoots: 0, ctx: 0 };
const needStubs = new Set();
const checked = [];
const perFile = [];
for (const pk of pkgs) {
  const w = lib.workspaces().find((x) => x.short === pk);
  for (const f of lib.walk(path.join(w.dir, 'src'))) {
    if (!lib.isTestSupport(f) || f.endsWith('.stub.ts')) continue;
    let text = fs.readFileSync(f, 'utf8');
    if (!/\b(Tsestree|TsestreeStub|EslintContext|EslintContextStub|TsestreeNodeType)\b/u.test(text)) continue;
    const c = convertTest(f, text);
    if (c.changed) {
      text = c.text;
      total.rootsOk += c.rootsOk;
      total.rootsSkipped += c.rootsSkipped;
      total.helperRoots += c.helperRoots;
      total.ctx += c.ctxConverted;
      (c.stubTypes ?? []).forEach((t) => needStubs.add(t));
    }
    const r = retype(f, text);
    if (r.changed) text = r.text;
    overlay.set(f, text);
    checked.push(f);
    total.files++;
    perFile.push({ file: rel(f), leftTsestree: (text.match(/\bTsestree(Stub|NodeType)?\b|\bEslintContext(Stub)?\b/gu) || []).length, rootsOk: c.rootsOk ?? 0, rootsSkipped: c.rootsSkipped ?? 0, helperRoots: c.helperRoots ?? 0 });
  }
}
const gwDir = path.join(ROOT, 'packages/@gateway/npm/src/typescript-eslint__utils');
const generated = [];
for (const t of needStubs) {
  const file = path.join(gwDir, kebab(t), `${kebab(t)}.stub.ts`);
  if (fs.existsSync(file)) continue;
  const code = DEFAULT_CODE[t] ?? 'foo(a);';
  overlay.set(file, `import { AST_NODE_TYPES } from '@typescript-eslint/utils';\nimport type { TSESTree } from '@typescript-eslint/utils';\nimport { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';\n\nexport const ${t}Stub = ({\n  code = ${JSON.stringify(code).replace(/^"|"$/gu, "'")},\n}: { code?: string } = {}): TSESTree.${t} =>\n  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.${t} });\n`);
  generated.push(t);
}
const key = (d) => `${d.code}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
const rows = [];
for (const pk of pkgs) {
  const w = lib.workspaces().find((x) => x.short === pk);
  const mine = checked.filter((f) => f.startsWith(w.dir + path.sep));
  const options = lib.packageCompilerOptions(w.dir);
  const base = lib.diagnosticsWithOverlay(mine, new Map(), options).diagnostics;
  const after = lib.diagnosticsWithOverlay(mine, overlay, options).diagnostics;
  for (const f of mine) {
    const bk = new Set((base.get(f) ?? []).map(key));
    const added = (after.get(f) ?? []).filter((d) => !bk.has(key(d)));
    rows.push({ file: rel(f), base: (base.get(f) ?? []).length, added: added.length, diags: added.map(lib.formatDiagnostic) });
  }
}
fs.writeFileSync(path.join(__dirname, 'out', 'tests-run.json'), JSON.stringify({ total, generated, perFile, rows }, null, 1));
console.log(JSON.stringify({ ...total, generatedStubs: generated, filesWithNewDiagnostics: rows.filter((r) => r.added).length, newDiagnostics: rows.reduce((a, r) => a + r.added, 0) }));
if (outDir) {
  for (const [f, t] of overlay) {
    if (!checked.includes(f) && !f.includes('typescript-eslint__utils') && !f.startsWith(path.join(ROOT, 'packages/eslint-plugin/src')) && !f.startsWith(path.join(ROOT, 'packages/local-eslint/src'))) continue;
    const dest = path.join(ROOT, outDir, rel(f));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, t);
  }
}

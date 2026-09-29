// B04 end-to-end sample: whole-package production retype+strip (from sample-all) plus converted tests/proxies
// of the chosen folders and generated missing gateway stubs; typechecks the chosen folders' files.
// Usage: node .../sample.cjs <folderSubstr,...> [--out=dir]
const fs = require('fs');
const path = require('path');
const lib = require('../../phase34/lib/repo.cjs');
const { retype } = require('./retype.cjs');
const { convertTest, kebab } = require('./convert-tests.cjs');
const { ts, ROOT, rel } = lib;
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const folders = process.argv[2].split(',');
const outDir = arg('out');
const SAMPLE_ALL = path.join(__dirname, 'sample-all');

const w = lib.workspaces().find((x) => x.short === 'eslint-plugin');
const gw = lib.workspaces().find((x) => x.name === '@dungeonmaster/gateway-npm' || x.rel === 'packages/@gateway/npm');
const overlay = new Map();
// 1) production retype+strip from the all-package run
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : overlay.set(path.join(ROOT, path.relative(SAMPLE_ALL, path.join(d, e.name))), fs.readFileSync(path.join(d, e.name), 'utf8'))));
walk(SAMPLE_ALL);

// 2) chosen folders: every ts file (prod already overlaid), tests+proxies retyped and converted
const inFolder = lib.walk(path.join(w.dir, 'src')).filter((f) => folders.some((s) => rel(f).includes(s)));
const stats = { tests: 0, rootsOk: 0, rootsSkipped: 0, ctx: 0 };
const needStubs = new Set();
const checked = [];
for (const f of inFolder) {
  checked.push(f);
  if (!lib.isTestSupport(f)) continue;
  let text = fs.readFileSync(f, 'utf8');
  if (f.endsWith('.stub.ts')) continue;
  const c = convertTest(f, text);
  if (c.changed) {
    text = c.text;
    stats.rootsOk += c.rootsOk;
    stats.rootsSkipped += c.rootsSkipped;
    stats.ctx += c.ctxConverted;
    (c.stubTypes ?? []).forEach((t) => needStubs.add(t));
  }
  const r = retype(f, text);
  if (r.changed) text = r.text;
  overlay.set(f, text);
  stats.tests++;
}
// 3) generate missing gateway stubs
const gwDir = path.join(ROOT, 'packages/@gateway/npm/src/typescript-eslint__utils');
const DEFAULT_CODE = { Identifier: 'x;', Literal: "'x';", TSTypeAnnotation: 'let x: string;', TSTypeReference: 'let x: T;', TSTypeLiteral: 'type T = { a: string };', TSPropertySignature: 'type T = { a: string };', AssignmentPattern: 'const { a = 1 } = y;', ObjectPattern: 'const { a } = y;', ImportDeclaration: "import { a } from 'x';", ImportSpecifier: "import { a } from 'x';", ExportNamedDeclaration: 'export const a = 1;', FunctionDeclaration: 'function f() {}', FunctionExpression: 'const f = function () {};', SpreadElement: 'f(...a);', VariableDeclarator: 'const a = 1;', IfStatement: 'if (a) {}', UnaryExpression: '!a;', TSArrayType: 'let x: string[];', TSStringKeyword: 'let x: string;', TSBooleanKeyword: 'let x: boolean;', ArrayExpression: 'const a = [];' };
const generated = [];
for (const t of needStubs) {
  const dir = path.join(gwDir, kebab(t));
  const file = path.join(dir, `${kebab(t)}.stub.ts`);
  if (fs.existsSync(file)) continue;
  const code = DEFAULT_CODE[t] ?? 'foo(a);';
  overlay.set(file, `import { AST_NODE_TYPES } from '@typescript-eslint/utils';\nimport type { TSESTree } from '@typescript-eslint/utils';\nimport { parseAndFindNode } from '../../gateway-test-support/parse-and-find-node';\n\nexport const ${t}Stub = ({\n  code = ${JSON.stringify(code).replace(/^"|"$/gu, "'")},\n}: { code?: string } = {}): TSESTree.${t} =>\n  parseAndFindNode({ code, nodeType: AST_NODE_TYPES.${t} });\n`);
  generated.push(t);
}
// 4) typecheck
const options = lib.packageCompilerOptions(w.dir);
const base = lib.diagnosticsWithOverlay(checked, new Map(), options).diagnostics;
const after = lib.diagnosticsWithOverlay(checked, overlay, options).diagnostics;
const key = (d) => `${d.code}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
let bad = 0;
const rows = [];
for (const f of checked) {
  const bk = new Set((base.get(f) ?? []).map(key));
  const added = (after.get(f) ?? []).filter((d) => !bk.has(key(d)));
  bad += added.length;
  rows.push({ f: rel(f), base: (base.get(f) ?? []).length, added: added.length, diags: added.map(lib.formatDiagnostic) });
}
fs.writeFileSync(path.join(__dirname, 'out', 'sample-' + folders.join('_').replace(/[^a-z0-9_-]/giu, '-') + '.json'), JSON.stringify(rows, null, 1));
console.log(JSON.stringify({ folders, files: checked.length, ...stats, generatedStubs: generated, newDiagnostics: bad, filesWithNew: rows.filter((r) => r.added).length }));
for (const r of rows.filter((x) => x.added)) {
  console.log(' ', r.f, r.added);
  r.diags.slice(0, 3).forEach((d) => console.log('     ', d.slice(0, 260)));
}
if (outDir) {
  for (const [f, t] of overlay) {
    if (SAMPLE_ALL && !checked.includes(f) && !f.includes('typescript-eslint__utils')) continue;
    const dest = path.join(ROOT, outDir, rel(f));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, t);
  }
}

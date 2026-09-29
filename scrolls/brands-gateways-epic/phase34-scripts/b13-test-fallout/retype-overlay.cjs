// Loads the B13 prototype (feasibility/b13/index.cjs + retype.cjs) with its repo.cjs require pointed at
// phase34/lib, then builds the retype overlay the way validate.cjs does. The prototype computes its
// candidates at load time from process.argv, so --tests is pushed before it loads.
const fs = require('fs');
const path = require('path');
const Module = require('module');
const lib = require('../lib/repo.cjs');
const { ts } = lib;

const b13Dir = path.join(__dirname, '..', 'feasibility', 'b13');
const libPath = path.join(__dirname, '..', 'lib', 'repo.cjs');
const cache = new Map();
const loadProto = (name) => {
  if (cache.has(name)) return cache.get(name);
  const file = path.join(b13Dir, `${name}.cjs`);
  const src = fs
    .readFileSync(file, 'utf8')
    .replaceAll("'../../phase34/lib/repo.cjs'", JSON.stringify(libPath))
    .replace(/require\('\.\/(\w+)\.cjs'\)/gu, (_, n) => `__loadProto(${JSON.stringify(n)})`);
  const m = new Module(file, module);
  m.filename = file;
  m.paths = Module._nodeModulePaths(b13Dir);
  m.exports = {};
  cache.set(name, m.exports);
  const wrapped = new Function('exports', 'require', 'module', '__filename', '__dirname', '__loadProto', src);
  wrapped.call(m.exports, m.exports, (s) => require(s), m, file, b13Dir, loadProto);
  cache.set(name, m.exports);
  return m.exports;
};

const loadRetype = ({ tests }) => {
  if (tests && !process.argv.includes('--tests')) process.argv.push('--tests');
  return loadProto('retype');
};

const buildOverlay = ({ candidates, barrelExports }) => {
  const byFile = new Map();
  for (const c of candidates) (byFile.get(c.file) ?? byFile.set(c.file, []).get(c.file)).push(c);
  const overlay = new Map();
  const kept = [];
  for (const [f, cs] of byFile) {
    const text = fs.readFileSync(f, 'utf8');
    const sf = lib.parse(f, text);
    const imports = new Map();
    for (const st of sf.statements)
      if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings))
        for (const e of st.importClause.namedBindings.elements) imports.set(e.name.text, st.moduleSpecifier.text);
    const edits = [];
    const need = new Map();
    for (const c of cs) {
      let spec;
      if (c.ownerPkg === c.pkg) {
        let r = path.relative(path.dirname(f), c.ownerFile.replace(/\.ts$/u, ''));
        if (!r.startsWith('.')) r = './' + r;
        spec = r.split(path.sep).join('/');
      } else {
        if (!barrelExports(c.ownerPkg, c.owner)) continue;
        spec = `${c.ownerPkg}/contracts`;
      }
      if (imports.has(c.owner) && imports.get(c.owner) !== spec) continue;
      if (sf.statements.some((s) => (ts.isTypeAliasDeclaration(s) || ts.isInterfaceDeclaration(s) || ts.isClassDeclaration(s)) && s.name?.text === c.owner)) continue;
      if (!imports.has(c.owner)) need.set(c.owner, spec);
      edits.push({ start: c.strStart, end: c.strEnd, text: `${c.owner}['${c.key}']` });
      kept.push(c);
    }
    if (!edits.length) continue;
    const firstImport = sf.statements.find((s) => ts.isImportDeclaration(s));
    const anchor = firstImport ? firstImport.getStart(sf) : 0;
    const lines = [...need].map(([n, s]) => `import type { ${n} } from '${s}';`).join('\n');
    if (lines) edits.push({ start: anchor, end: anchor, text: lines + '\n' });
    overlay.set(f, lib.mergeDuplicateImports(f, lib.applyEdits(text, edits)));
  }
  return { overlay, kept };
};

module.exports = { loadRetype, buildOverlay };

// Finds `x.parse(arg)` / `x.safeParse(arg)` whose argument's type is a Promise (a missing await), in every package.
// Usage: node scrolls/brands-gateways-epic/bigbang/promise-parse-scan.cjs [--root=DIR]
const fs = require('fs');
const path = require('path');
const port = require('../phase34-scripts/lib/port-config.cjs');

const root = port.ROOT;
const ts = require(path.join(root, 'node_modules', 'typescript'));
const pkgDirs = [];
for (const d of fs.readdirSync(path.join(root, 'packages'))) {
  const p = path.join(root, 'packages', d);
  if (d.startsWith('@')) for (const e of fs.readdirSync(p)) pkgDirs.push(path.join(p, e));
  else pkgDirs.push(p);
}

const hits = [];
for (const dir of pkgDirs) {
  const cfgPath = path.join(dir, 'tsconfig.json');
  if (!fs.existsSync(cfgPath)) continue;
  const cfg = ts.getParsedCommandLineOfConfigFile(cfgPath, {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} });
  if (!cfg) continue;
  const program = ts.createProgram({ rootNames: cfg.fileNames, options: { ...cfg.options, noEmit: true } });
  const checker = program.getTypeChecker();
  const isPromise = (t) => {
    if (t.isUnion()) return t.types.some(isPromise);
    const s = t.getSymbol() ?? t.aliasSymbol;
    return s !== undefined && s.getName() === 'Promise';
  };
  for (const sf of program.getSourceFiles()) {
    if (!sf.fileName.startsWith(dir + path.sep) || sf.fileName.includes('/node_modules/')) continue;
    const visit = (n) => {
      if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)
        && ['parse', 'safeParse'].includes(n.expression.name.text) && n.arguments.length === 1) {
        const arg = n.arguments[0];
        if (!ts.isAwaitExpression(arg) && isPromise(checker.getTypeAtLocation(arg))) {
          const { line } = sf.getLineAndCharacterOfPosition(n.getStart(sf));
          hits.push(`${path.relative(root, sf.fileName)}:${line + 1}  ${n.getText(sf).replace(/\s+/g, ' ').slice(0, 140)}`);
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
}
const uniq = [...new Set(hits)];
console.log(uniq.join('\n'));
console.log(`${uniq.length} parse calls on a Promise`);

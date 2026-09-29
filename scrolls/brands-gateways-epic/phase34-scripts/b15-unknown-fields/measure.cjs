// Measures what a responder `data` contract generator faces: the checker's type of `data` at every
// responderResultContract.parse({ status, data }) site in packages/server production code.
const path = require('path');
const lib = require('../lib/repo.cjs');
const { ts } = lib;
const pkg = path.join(lib.ROOT, 'packages/server');
const { service, fileNames } = lib.makeLanguageService(pkg);
const prog = service.getProgram();
const chk = prog.getTypeChecker();
const rows = [];
for (const f of fileNames) {
  if (lib.isTestSupport(f) || !f.includes('/src/')) continue;
  const sf = prog.getSourceFile(f);
  if (!sf) continue;
  const visit = (n) => {
    if (ts.isCallExpression(n) && n.expression.getText(sf) === 'responderResultContract.parse' && n.arguments[0] && ts.isObjectLiteralExpression(n.arguments[0])) {
      const dp = n.arguments[0].properties.find((p) => (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) && p.name.getText(sf) === 'data');
      if (dp) {
        const node = ts.isShorthandPropertyAssignment(dp) ? dp.name : dp.initializer;
        const t = chk.getTypeAtLocation(node);
        const txt = chk.typeToString(t, undefined, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias);
        const props = t.getProperties().map((p) => p.name);
        rows.push({ file: lib.rel(f), line: sf.getLineAndCharacterOfPosition(n.getStart()).line + 1, txt, props, any: /\bany\b|unknown/.test(txt), isErr: props.length === 1 && props[0] === 'error', objLit: ts.isObjectLiteralExpression(node) });
      } else rows.push({ file: lib.rel(f), line: 0, txt: '(no data)', props: [], any: false });
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
const err = rows.filter((r) => r.isErr);
const rest = rows.filter((r) => !r.isErr);
const groups = {};
for (const r of rest) { const k = r.props.slice().sort().join(','); (groups[k] ||= []).push(r); }
console.log('sites', rows.length, 'files', new Set(rows.map((r) => r.file)).size);
console.log('error-only {error}', err.length, 'typed:', [...new Set(err.map((r) => r.txt))].join(' | '));
console.log('other', rest.length, 'distinct prop-sets', Object.keys(groups).length);
console.log('with any/unknown inside type', rest.filter((r) => r.any).length, 'literal-object data', rest.filter((r) => r.objLit).length);
for (const [k, v] of Object.entries(groups).sort((a, b) => b[1].length - a[1].length)) console.log(v.length, `{${k}}`, '|', v[0].txt.slice(0, 110).replace(/\s+/g, ' '), '|', v[0].file.split('/').pop() + ':' + v[0].line);

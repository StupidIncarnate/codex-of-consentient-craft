// SD1: the hand queue. Everything the SD1 scripts could not do, by file, in rule-folder order (EPIC rule Q):
//   1. type errors left in production files after retype, strip, guard, brand-widen and dead-condition removal
//   2. stub trees the printer cannot print (helper-body roots and malformed trees are not here: the first are
//      converted through their call sites, the second are on the deletion list)
// Usage: node scrolls/brands-gateways-epic/phase34-scripts/sd1-retype-residue/leftovers.cjs [--residue=out/residue.json] [--md=out/hand-queue.md]
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');
const { convertRoot, classify } = require('./stubprint2.cjs');
const { ts, ROOT, rel } = lib;
fs.mkdirSync(lib.outDir(__dirname), { recursive: true });
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const residue = JSON.parse(fs.readFileSync(path.join(lib.workDir(__dirname), arg('residue') ?? 'out/residue.json'), 'utf8'));
const PROD_SAMPLE = arg('prod') ?? path.relative(ROOT, path.join(lib.OUT, 'sd1-sample2'));

const label = (msg, code) => {
  if (/'Node'\./u.test(msg) || /does not exist on type 'Node'/u.test(msg)) return 'helper parameter still typed TSESTree.Node: retype to the function or object node its callers pass, then drop the dead checks after it';
  if (/\$brand<"Identifier">|type 'string'.*not assignable to parameter of type 'string &/u.test(msg)) return 'a name brand on a local Map or Set: retype to string';
  if (/'parent'|\bparent\b/u.test(code) && /TS2322/u.test(msg)) return 'walk variable declared with the wrong node type: declare it TSESTree.Node | undefined';
  if (/TS2352/u.test(msg)) return 'cast of a union to a record: narrow the node first';
  if (/TS2677|TS2345|TS2322/u.test(msg)) return 'a value the real type widens: read and retype the receiving variable';
  if (/TS2339/u.test(msg)) return 'field read on a union the guard pass could not narrow safely (its edit raised the file\'s errors): narrow by hand';
  return 'read the diagnostic';
};

const typeRows = residue.remaining.map((d) => {
  const m = /^(.*?):(\d+) (TS\d+): (.*)$/u.exec(d);
  const srcPath = path.join(ROOT, PROD_SAMPLE, m[1]);
  const code = fs.existsSync(srcPath) ? fs.readFileSync(srcPath, 'utf8').split('\n')[Number(m[2]) - 1].trim().slice(0, 120) : '';
  return { file: m[1], line: Number(m[2]), code: m[3], msg: m[4].slice(0, 160), src: code, what: label(`${m[3]} ${m[4]}`, code) };
});

const stubRows = [];
let malformed = 0;
let helperRoots = 0;
const helperOf = (n) => {
  for (let c = n.parent; c; c = c.parent) {
    if ((ts.isArrowFunction(c) || ts.isFunctionExpression(c)) && c.parameters.length && ts.isVariableDeclaration(c.parent) && ts.isIdentifier(c.parent.name)) return true;
    if (ts.isFunctionDeclaration(c) && c.name && c.parameters.length) return true;
  }
  return false;
};
for (const pk of ['eslint-plugin', 'local-eslint']) {
  const w = lib.workspaces().find((x) => x.short === pk);
  for (const f of lib.walk(path.join(w.dir, 'src'))) {
    if (!lib.isTestSupport(f) || f.endsWith('.stub.ts')) continue;
    const text = fs.readFileSync(f, 'utf8');
    if (!text.includes('TsestreeStub(')) continue;
    const sf = lib.parse(f, text);
    const roots = [];
    const visit = (n, inStub) => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'TsestreeStub') {
        if (!inStub) roots.push(n);
        n.arguments.forEach((a) => visit(a, true));
        return;
      }
      ts.forEachChild(n, (c) => visit(c, inStub));
    };
    visit(sf, false);
    for (const r of roots) {
      if (helperOf(r)) {
        helperRoots++;
        continue;
      }
      let c;
      try {
        c = convertRoot(r, sf);
      } catch (e) {
        c = { ok: false, reason: `crash:${e.message}` };
      }
      const cls = classify(c);
      if (cls === 'ok') continue;
      if (cls.startsWith('malformed')) {
        malformed++;
        continue;
      }
      stubRows.push({ file: rel(f), line: sf.getLineAndCharacterOfPosition(r.getStart(sf)).line + 1, reason: c.reason.slice(0, 80), src: r.getText(sf).replace(/\s+/gu, ' ').slice(0, 130) });
    }
  }
}

const md = ['# SD1 hand queue', '', `Type errors: ${typeRows.length}. Unprintable stub trees: ${stubRows.length}. Malformed trees (deletion list, not here): ${malformed}. Dead conditions left: ${JSON.stringify(Object.fromEntries(Object.entries(residue.deadCensus ?? {}).map(([k, v]) => [k, v.after])))}.`, ''];
const byFile = new Map();
for (const r of typeRows) (byFile.get(r.file) ?? byFile.set(r.file, { type: [], stub: [] }).get(r.file)).type.push(r);
for (const r of stubRows) (byFile.get(r.file) ?? byFile.set(r.file, { type: [], stub: [] }).get(r.file)).stub.push(r);
for (const f of [...byFile.keys()].sort()) {
  const e = byFile.get(f);
  md.push(`## ${f}`);
  for (const r of e.type) md.push(`- line ${r.line} ${r.code}: ${r.what}. \`${r.src}\``);
  for (const r of e.stub) md.push(`- stub tree at line ${r.line} (${r.reason}): \`${r.src}\``);
  md.push('');
}
fs.writeFileSync(path.join(lib.workDir(__dirname), arg('md') ?? 'out/hand-queue.md'), md.join('\n'));
fs.writeFileSync(path.join(lib.workDir(__dirname), 'out/hand-queue.json'), JSON.stringify({ typeRows, stubRows, malformed, helperRoots }, null, 1));
console.log(JSON.stringify({ typeErrors: typeRows.length, typeFiles: new Set(typeRows.map((r) => r.file)).size, unprintableTrees: stubRows.length, stubFiles: new Set(stubRows.map((r) => r.file)).size, queueFiles: byFile.size, malformed }));

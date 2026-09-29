// SD1 (d): every test that builds a node the real TSESTree types forbid (a required field undefined or null, an
// array or wrong node type in a slot, a non-Program with `parent: null`) covers a branch the retype makes dead.
// Writes the deletion list: the test, what is missing, and the production lines that test the missing field.
// Usage: node tmp/phase34/sd1-retype-residue/malformed.cjs [--sample=tmp/sd1-sample2] [--md=out/malformed-tests.md] [--json=out/malformed-tests.json]
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');
const { convertRoot, classify } = require('./stubprint2.cjs');
const { ts, ROOT, rel } = lib;
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const SAMPLE = arg('sample') ?? 'tmp/sd1-sample2';

const fieldsOf = (c) => {
  if (c.reason === 'parent-null') return ['parent'];
  if (c.reason === 'not-a-node') return ['body'];
  const out = new Set();
  for (const d of c.diffs ?? []) {
    const p = d.split(': ')[0];
    const seg = p.replace(/\[\d+\]/gu, '').split('.').pop();
    if (seg) out.add(seg);
  }
  return [...out];
};

const branchLines = (src, fields) => {
  const rows = [];
  const lines = src.split('\n');
  const cond = /(!\s*[\w.?]+|\?\.|\?\?|===\s*(undefined|null)|!==\s*(undefined|null)|isArray\(|\bif\s*\(|&&|\|\|)/u;
  lines.forEach((l, i) => {
    for (const f of fields) {
      if (new RegExp(`\\b${f}\\b`, 'u').test(l) && cond.test(l) && !/^\s*(import|\/\/|\*)/u.test(l)) {
        rows.push({ line: i + 1, field: f, text: l.trim().slice(0, 140) });
        break;
      }
    }
  });
  return rows.slice(0, 6);
};

const itOf = (n, sf) => {
  for (let c = n.parent; c; c = c.parent) {
    if (ts.isCallExpression(c)) {
      const head = c.expression.getText(sf);
      if (/^(it|test)(\.each\(.*\))?$/u.test(head) || /^(it|test)\./u.test(head)) {
        const a = c.arguments[0];
        return { title: a && (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a)) ? a.text : a?.getText(sf).slice(0, 60), line: sf.getLineAndCharacterOfPosition(c.getStart(sf)).line + 1, node: c };
      }
    }
  }
  return null;
};

const main = () => {
  const tests = new Map();
  let totalRoots = 0;
  const kinds = {};
  for (const p of ['eslint-plugin', 'local-eslint']) {
    for (const f of lib.walk(path.join(ROOT, 'packages', p))) {
      const text = fs.readFileSync(f, 'utf8');
      if (!/\.test\.tsx?$/u.test(f) || !text.includes('TsestreeStub(')) continue;
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
        totalRoots++;
        const it = itOf(r, sf);
        const key = `${rel(f)}::${it?.title ?? '(outside an it)'}`;
        const e = tests.get(key) ?? { file: rel(f), title: it?.title ?? '(outside an it)', line: it?.line ?? 0, roots: [] };
        let c;
        try {
          c = convertRoot(r, sf);
        } catch (err) {
          c = { ok: false, reason: `crash:${err.message}` };
        }
        const cls = classify(c);
        kinds[cls] = (kinds[cls] ?? 0) + 1;
        e.roots.push({ line: sf.getLineAndCharacterOfPosition(r.getStart(sf)).line + 1, cls, fields: cls.startsWith('malformed') ? fieldsOf(c) : [], detail: (c.diffs ?? []).slice(0, 2) });
        tests.set(key, e);
      }
    }
  }
  const out = [];
  for (const e of tests.values()) {
    const bad = e.roots.filter((r) => r.cls.startsWith('malformed'));
    if (!bad.length) continue;
    const prodPath = path.join(ROOT, e.file.replace(/\.test\.tsx?$/u, '.ts'));
    const prod = fs.existsSync(prodPath) ? fs.readFileSync(prodPath, 'utf8') : '';
    const sampleProd = fs.existsSync(path.join(ROOT, SAMPLE, rel(prodPath))) ? fs.readFileSync(path.join(ROOT, SAMPLE, rel(prodPath)), 'utf8') : null;
    const fields = [...new Set(bad.flatMap((r) => r.fields))];
    const lines = branchLines(prod, fields).map((l) => ({ ...l, inSample: sampleProd === null ? null : sampleProd.includes(l.text.slice(0, 60)) }));
    out.push({ ...e, allRootsMalformed: bad.length === e.roots.length, malformedRoots: bad.length, otherRoots: e.roots.length - bad.length, fields, prodFile: rel(prodPath), branchLines: lines });
  }
  out.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  const jsonPath = path.join(__dirname, arg('json') ?? 'out/malformed-tests.json');
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify({ totalRoots, kinds, tests: out }, null, 1));
  const md = [
    '# Malformed-node tests: deletion list (SD1)',
    '',
    'Each row is a test that builds a node the real TSESTree types forbid. The branch it covers is dead once the visitor takes the real type. Delete the test and the branch together; a test marked "edit" also holds valid cases, so only its malformed case goes.',
    '',
    `Roots seen: ${totalRoots}. Root classes: ${Object.entries(kinds).map(([k, v]) => `${k} ${v}`).join(', ')}.`,
    `Tests listed: ${out.length}, of which delete-whole: ${out.filter((t) => t.allRootsMalformed).length}, edit: ${out.filter((t) => !t.allRootsMalformed).length}.`,
    '',
  ];
  let cur = '';
  for (const t of out) {
    if (t.file !== cur) {
      cur = t.file;
      md.push(`## ${t.file}`, '', `Production file: \`${t.prodFile}\``, '');
    }
    md.push(`- **${t.allRootsMalformed ? 'delete' : 'edit'}** line ${t.line}, \`${t.title}\` — missing/wrong: ${t.fields.join(', ') || '?'} (roots ${t.roots.filter((r) => r.cls.startsWith('malformed')).map((r) => r.line).join(', ')}; ${[...new Set(t.roots.filter((r) => r.cls.startsWith('malformed')).map((r) => r.cls.replace('malformed:', '')))].join(', ')})`);
    for (const l of t.branchLines) md.push(`  - dead branch candidate ${t.prodFile.split('/').pop()}:${l.line} (${l.field}): \`${l.text.replace(/`/gu, "'")}\``);
    if (!t.branchLines.length) md.push('  - dead branch: no line reads these fields in a condition; read the visitor');
    md.push('');
  }
  fs.writeFileSync(path.join(__dirname, arg('md') ?? 'out/malformed-tests.md'), md.join('\n') + '\n');
  console.log(JSON.stringify({ totalRoots, kinds, tests: out.length, deleteWhole: out.filter((t) => t.allRootsMalformed).length }));
};
main();

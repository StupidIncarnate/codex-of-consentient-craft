// T05 (SD11): a hand-made Node error, `Object.assign(new Error('...'), { code: 'ENOENT' })`, staged on a
// proxy becomes a recorded failure.
//
//   R1  the receiver is a `@gateway/node` fs proxy that has a named method staging that code by path alone
//       (`missing`, `denied`, `isDirectory`, `notADirectory`; the names are read from the proxy source, not
//       assumed): `proxy.throwsMatchingPath({ path: p, error: <hand-made> })` becomes `proxy.missing({ path: p })`.
//       Only when the call's object holds exactly `path` and `error`.
//   R2  any other staging position (a wrapper proxy's `error:` parameter, a `.rejects(...)`/`.throws(...)`
//       argument, a `const` used only that way): the expression becomes `FileMissingErrorStub(...)` (ENOENT with no
//       syscall) or `FsErrorStub({ code, path?, syscall? })`, plus the import. The path comes from the hand-made
//       error's own `path`, else from a sibling `path:` property of the same call.
//
// An edit lands only when the file's diagnostics after it equal its diagnostics before (lib's gateEdits, one
// LanguageService per package). Candidates outside those shapes (an error handed to the code under test, an extra
// property such as `name`/`url`/`status`/`issues`, a code with no literal) are listed in out/leftovers.txt with the
// reason. Files are only edited, never moved or deleted.
//
// Usage: node tmp/phase34/t05-recorded-failures/run.cjs [pkg ...] [--sample-out=<dir>] [apply]
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');

const { ts, ROOT, rel } = lib;
const args = process.argv.slice(2);
const opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? null;
const APPLY = args.includes('apply');
const sampleOut = opt('sample-out');
const only = args.filter((a) => !a.startsWith('--') && a !== 'apply');

const STUB_IMPORTS = {
  FsErrorStub: '#gateway/node/fs/is-fs-error/fs-error.stub',
  FileMissingErrorStub: '#gateway/node/fs/file-missing-error/file-missing-error.stub',
};
const GATEWAY_PROXY = /packages\/@gateway\/node\/src\/fs(__promises)?\/.+\.proxy\.ts$/u;
const SKIP_FILE = /packages\/(@gateway\/|eslint-plugin\/src\/brokers\/rule\/ban-invented)/u;

const stripWrap = (n) => {
  let x = n;
  while (ts.isParenthesizedExpression(x) || ts.isAsExpression(x) || ts.isNonNullExpression(x)) x = x.expression;
  return x;
};
const wrapTop = (n) => {
  let x = n;
  while (x.parent && (ts.isParenthesizedExpression(x.parent) || ts.isAsExpression(x.parent) || ts.isNonNullExpression(x.parent))) x = x.parent;
  return x;
};
const propName = (p) => (p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text : null);

// Object.assign(new Error(..), { code, ... }) -> { props } or null
const inventedShape = (n, sf) => {
  const x = stripWrap(n);
  if (!ts.isCallExpression(x) || x.arguments.length !== 2) return null;
  const c = x.expression;
  if (!(ts.isPropertyAccessExpression(c) && c.expression.getText(sf) === 'Object' && c.name.text === 'assign')) return null;
  const [errArg, lit] = x.arguments;
  const e = stripWrap(errArg);
  if (!(ts.isNewExpression(e) && e.expression.getText(sf) === 'Error')) return null;
  if (!ts.isObjectLiteralExpression(lit)) return null;
  const props = {};
  for (const p of lit.properties) {
    if (ts.isShorthandPropertyAssignment(p)) props[p.name.text] = p.name.text;
    else if (ts.isPropertyAssignment(p) && propName(p)) props[propName(p)] = p.initializer.getText(sf);
    else return { props: null, extra: 'spread or method in the property list' };
  }
  if (!('code' in props)) return null;
  return { props, node: x };
};

const methodNamesFor = (proxyFileText, code) => {
  const names = [];
  const re = /^\s{4}(\w+): \(\{ path \}: \{ path: string \}\): void => \{([\s\S]*?)^\s{4}\},/gmu;
  for (const m of proxyFileText.matchAll(re)) if (m[2].includes(`code: '${code}'`)) names.push(m[1]);
  return names;
};

const analyse = (f, text, program) => {
  const sf = program.getSourceFile(f);
  const checker = program.getTypeChecker();
  const found = [];
  const proxyTextCache = new Map();
  const gatewayMethod = (recv, code) => {
    if (!code) return null;
    const type = checker.getTypeAtLocation(recv);
    const hits = [];
    for (const prop of type.getProperties()) {
      const decl = prop.declarations?.[0];
      const declFile = decl?.getSourceFile().fileName;
      if (!declFile || !GATEWAY_PROXY.test(rel(declFile))) continue;
      if (!proxyTextCache.has(declFile)) proxyTextCache.set(declFile, fs.readFileSync(declFile, 'utf8'));
      if (methodNamesFor(proxyTextCache.get(declFile), code).includes(prop.name)) hits.push(prop.name);
    }
    return hits.length === 1 ? hits[0] : null;
  };
  const isProxyReceiver = (recv) => {
    const t = recv.getText(sf);
    return /roxy$/u.test(t) || /roxy\)?\.?$/u.test(t);
  };
  const stagingCall = (top) => {
    // top is inside `{ ..., error: top }` inside a call arg, or is itself a call arg
    const p = top.parent;
    if (ts.isPropertyAssignment(p) && ts.isObjectLiteralExpression(p.parent) && ts.isCallExpression(p.parent.parent)) {
      const call = p.parent.parent;
      if (ts.isPropertyAccessExpression(call.expression)) return { call, obj: p.parent, prop: p };
    }
    if (ts.isCallExpression(p) && ts.isPropertyAccessExpression(p.expression) && ['rejects', 'throws'].includes(p.expression.name.text))
      return { call: p, obj: null, prop: null, direct: true };
    return null;
  };
  const useOk = (st) => {
    if (!st) return false;
    const name = st.call.expression.name.text;
    if (st.direct) return true;
    return isProxyReceiver(st.call.expression.expression) || name === 'rejects' || name === 'throws';
  };

  const visit = (n) => {
    const shape = inventedShape(n, sf);
    if (shape && stripWrap(n) === n) {
      const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
      const rec = { file: f, line, node: n, shape };
      found.push(rec);
      const top = wrapTop(n);
      if (shape.props === null) rec.reason = shape.extra;
      else {
        const extra = Object.keys(shape.props).filter((k) => !['code', 'path', 'syscall'].includes(k));
        if (extra.length) rec.reason = `extra properties: ${extra.join(', ')}`;
        else if (!/^'E[A-Z]+'$/u.test(shape.props.code) && !/^[A-Za-z_]\w*$/u.test(shape.props.code)) rec.reason = 'code is not a literal or a name';
        else {
          const codeLit = /^'(E[A-Z]+)'$/u.exec(shape.props.code)?.[1] ?? null;
          let st = stagingCall(top);
          let viaConst = null;
          if (!st && ts.isVariableDeclaration(top.parent) && ts.isIdentifier(top.parent.name)) {
            const id = top.parent.name.text;
            const scope = (function up(x) {
              while (x && !ts.isBlock(x) && !ts.isSourceFile(x)) x = x.parent;
              return x;
            })(top.parent);
            const uses = [];
            const scan = (m) => {
              if (ts.isIdentifier(m) && m.text === id && m !== top.parent.name) uses.push(m);
              ts.forEachChild(m, scan);
            };
            scan(scope);
            const oks = uses.map((u) => {
              if (ts.isShorthandPropertyAssignment(u.parent)) {
                const o = u.parent.parent;
                return ts.isCallExpression(o.parent) && ts.isPropertyAccessExpression(o.parent.expression) && isProxyReceiver(o.parent.expression.expression) && u.parent.name.text === 'error';
              }
              if (ts.isPropertyAssignment(u.parent) && u.parent.initializer === u && propName(u.parent) === 'error') {
                const o = u.parent.parent;
                return ts.isCallExpression(o.parent) && ts.isPropertyAccessExpression(o.parent.expression) && isProxyReceiver(o.parent.expression.expression);
              }
              return false;
            });
            if (uses.length && oks.every(Boolean)) viaConst = uses[0];
            else rec.reason = uses.length ? 'const also used outside a proxy staging call (handed to the code under test)' : 'const never staged on a proxy';
          }
          if (!st && !viaConst && !rec.reason) rec.reason = 'not staged on a proxy (handed to the code under test)';
          if (st && !useOk(st)) rec.reason = 'staged on a call whose receiver is not a proxy';
          if (!rec.reason) {
            let siblingPath = null;
            if (st?.obj) {
              const pp = st.obj.properties.find((p) => propName(p) === 'path' || (ts.isShorthandPropertyAssignment(p) && p.name.text === 'path'));
              if (pp) siblingPath = ts.isShorthandPropertyAssignment(pp) ? 'path' : pp.initializer.getText(sf);
            }
            const pathText = shape.props.path ?? siblingPath;
            // R1
            if (st && st.obj && codeLit && st.obj.properties.length === 2 && !shape.props.syscall) {
              const keys = st.obj.properties.map((p) => (ts.isShorthandPropertyAssignment(p) ? p.name.text : propName(p)));
              if (keys.includes('path') && keys.includes('error') && st.prop === st.obj.properties.find((p) => propName(p) === 'error') && !shape.props.path) {
                const m = gatewayMethod(st.call.expression.expression, codeLit);
                if (m) {
                  const ps = st.obj.properties.find((p) => ts.isShorthandPropertyAssignment(p) ? p.name.text === 'path' : propName(p) === 'path');
                  const ptxt = ts.isShorthandPropertyAssignment(ps) ? 'path' : `path: ${ps.initializer.getText(sf)}`;
                  const nameNode = st.call.expression.name;
                  rec.edit = { start: nameNode.getStart(sf), end: st.call.end, text: `${m}({ ${ptxt} })`, kind: 'R1', ...lib.enclosingStatement(n, sf) };
                }
              }
            }
            if (!rec.edit) {
              const parts = [`code: ${shape.props.code}`];
              if (pathText) parts.push(pathText === 'path' ? 'path' : `path: ${pathText}`);
              if (shape.props.syscall) parts.push(`syscall: ${shape.props.syscall}`);
              const simple = codeLit === 'ENOENT' && !shape.props.syscall;
              const stub = simple ? 'FileMissingErrorStub' : 'FsErrorStub';
              const call = simple ? `FileMissingErrorStub(${pathText ? `{ ${parts[1]} }` : ''})` : `FsErrorStub({ ${parts.join(', ')} })`;
              const wrapped = wrapTop(n);
              rec.edit = { start: wrapped.getStart(sf), end: wrapped.end, text: call, kind: 'R2', stub, ...lib.enclosingStatement(n, sf) };
            }
          }
        }
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return { sf, found };
};

const importEdits = (sf, text, accepted, allFoundNodes) => {
  const need = new Set(accepted.filter((c) => c.stub).map((c) => c.stub));
  const edits = [];
  const existing = new Set();
  for (const st of sf.statements)
    if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings))
      for (const e of st.importClause.namedBindings.elements) existing.add(e.name.text);
  const add = [...need].filter((s) => !existing.has(s));
  if (add.length) {
    const imports = sf.statements.filter(ts.isImportDeclaration);
    const at = imports.length ? imports[imports.length - 1].end : 0;
    edits.push({ start: at, end: at, text: (imports.length ? '\n' : '') + add.map((s) => `import { ${s} } from '${STUB_IMPORTS[s]}';`).join('\n') + (imports.length ? '' : '\n') });
  }
  return edits;
};

// Drops a now-unused `FsError` type import (only a lone `import type { FsError } from '#gateway/node/fs'`).
const unusedFsErrorImport = (text, path0, editsApplied) => {
  const sf = lib.parse(path0, editsApplied);
  const refs = [];
  const scan = (n) => {
    if (ts.isIdentifier(n) && n.text === 'FsError' && !ts.isImportSpecifier(n.parent)) refs.push(n);
    ts.forEachChild(n, scan);
  };
  scan(sf);
  if (refs.length) return editsApplied;
  const eds = [];
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings)) continue;
    const els = st.importClause.namedBindings.elements;
    if (!els.some((e) => e.name.text === 'FsError')) continue;
    const keep = els.filter((e) => e.name.text !== 'FsError');
    if (!keep.length) {
      const le = editsApplied.indexOf('\n', st.end);
      eds.push({ start: st.getStart(sf), end: le === -1 ? st.end : le + 1, text: '' });
    } else {
      eds.push({ start: els[0].getStart(sf), end: els[els.length - 1].end, text: keep.map((e) => e.getText(sf)).join(', ') });
    }
  }
  return lib.applyEdits(editsApplied, eds);
};

const workspaces = lib.workspaces().filter((w) => !w.isGateway && (only.length ? only.includes(w.short) : true));
const stats = {};
const leftovers = [];
let diffText = '';
const t0 = Date.now();
for (const w of workspaces) {
  const st = (stats[w.short] = { found: 0, scripted: 0, left: 0, R1: 0, R2: 0 });
  const files = lib.walk(w.dir).filter((f) => /\.tsx?$/u.test(f) && !SKIP_FILE.test(rel(f)));
  const cand = files.filter((f) => {
    const t = fs.readFileSync(f, 'utf8');
    return t.includes('Object.assign') && /code\b/u.test(t);
  });
  if (!cand.length) continue;
  const live = new Map();
  const { service } = lib.makeLanguageService(w.dir, live);
  for (const f of cand) {
    const text = fs.readFileSync(f, 'utf8');
    const program = service.getProgram();
    if (!program.getSourceFile(f)) continue; // outside the package's tsconfig: not seen
    const { sf, found } = analyse(f, text, program);
    if (!found.length) continue;
    st.found += found.length;
    const cands = found.filter((r) => r.edit).map((r) => ({ ...r.edit, rec: r }));
    const render = (acc) => {
      const es = [...acc, ...(acc.length ? importEdits(sf, text, acc) : [])];
      let out = lib.applyEdits(text, es);
      if (acc.some((c) => c.kind === 'R1') || acc.length) out = unusedFsErrorImport(text, f, out);
      return out;
    };
    const accepted = cands.length ? lib.gateEdits({ service, live, file: f, text, cands, render }) : [];
    for (const r of found) {
      const ok = accepted.some((c) => c.rec === r);
      if (ok) {
        st.scripted++;
        st[r.edit.kind]++;
      } else {
        st.left++;
        leftovers.push(`${rel(f)}:${r.line}\t${r.reason ?? 'the edit made the file typecheck differently (gate refused it)'}`);
      }
    }
    if (!accepted.length) continue;
    const after = render(accepted);
    diffText += lib.unifiedDiff(rel(f), text, after);
    if (sampleOut) {
      const dest = path.join(path.resolve(ROOT, sampleOut), rel(f));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, after);
    } else if (APPLY) fs.writeFileSync(f, after);
  }
}
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'run.diff'), diffText);
fs.writeFileSync(path.join(OUT, 'leftovers.txt'), leftovers.join('\n') + '\n');
console.log(`${APPLY ? 'APPLIED' : sampleOut ? 'SAMPLE' : 'DRY RUN'}:`, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
for (const [k, v] of Object.entries(stats)) if (v.found) console.log(k.padEnd(18), JSON.stringify(v));
console.log(`diff: ${rel(path.join(OUT, 'run.diff'))}; leftovers: ${rel(path.join(OUT, 'leftovers.txt'))}`);

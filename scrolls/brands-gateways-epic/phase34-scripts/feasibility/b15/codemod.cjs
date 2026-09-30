// B15 prototype: make ONE standalone scalar brand contract go plain across the repo, on an overlay.
//   type refs T -> string|number; C.parse(v) -> v; TStub({ value: x }) -> x; TStub() -> the stub's default literal;
//   contract field `key: C` -> inline brand; delete contract, stub, contract test, barrel re-exports.
// Every statement edit passes lib.gateEdits (no new diagnostic in its file); a whole-repo check counts the rest.
// Usage: node .../codemod.cjs --brand=headerTextContract [--file=<contract path>] [--sample-out=dir]
const fs = require('fs');
const path = require('path');
const lib = require('../../lib/repo.cjs');
const { ts, ROOT, rel } = lib;
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const ws = lib.workspaces();
const resolver = lib.makeResolver();

// ---- locate the brand ----
const brandName = arg('brand');
let contractFile = arg('file') ? path.resolve(ROOT, arg('file')) : null;
if (!contractFile) {
  const hits = [];
  for (const w of ws) if (!w.isGateway) for (const f of lib.walk(path.join(w.dir, 'src'))) if (/-contract\.ts$/u.test(f) && new RegExp(`export const ${brandName}\\b`, 'u').test(fs.readFileSync(f, 'utf8'))) hits.push(f);
  if (hits.length !== 1) throw new Error(`brand ${brandName} found in ${hits.length} files; pass --file`);
  contractFile = hits[0];
}
const csf = lib.parse(contractFile);
let initText = null;
let typeName = null;
for (const st of csf.statements) {
  if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name) && d.name.text === brandName) initText = d.initializer.getText(csf);
  if (ts.isTypeAliasDeclaration(st) && st.type.getText(csf).includes(`typeof ${brandName}`)) typeName = st.name.text;
}
const kind = /^z\s*\.\s*number/u.test(initText) ? 'number' : 'string';
const baseSchema = initText.replace(/\s+/gu, ' ').replace(/\.brand<[^>]*>\(\)\s*$/u, '');
const stubBase = path.basename(contractFile).replace(/-contract\.ts$/u, '');
const stubFile = path.join(path.dirname(contractFile), `${stubBase}.stub.ts`);
const testFile = contractFile.replace(/\.ts$/u, '.test.ts');
const stubName = `${typeName}Stub`;
// default literal of the stub
let stubDefault = null;
if (fs.existsSync(stubFile)) {
  const st = fs.readFileSync(stubFile, 'utf8');
  const m = /value(?:\s*=\s*|:\s*)('[^'\n]*'|"[^"\n]*"|-?\d+(?:\.\d+)?)/u.exec(st.replace(/value:\s*(string|number)/gu, ''));
  stubDefault = m ? m[1] : null;
}
const inlineOk = !/[A-Z_]{4,}|statics|Statics/u.test(baseSchema.replace(/\/[^/]+\/[a-z]*/gu, ''));

console.log(JSON.stringify({ brandName, typeName, kind, contractFile: rel(contractFile), baseSchema, stubDefault, inlineOk }));

// ---- gather user files ----
const all = [];
for (const w of ws) if (!w.isGateway) for (const d of ['src', 'test', 'e2e']) for (const f of lib.walk(path.join(w.dir, d))) all.push(f);
const wordRe = new RegExp(`\\b(${brandName}|${typeName}|${stubName})\\b`, 'u');
const users = all.filter((f) => f !== contractFile && f !== stubFile && f !== testFile && wordRe.test(fs.readFileSync(f, 'utf8')));
// the brand's own package first, so a caller's gate already sees the retyped signatures it calls
const ownDir = lib.workspaceOf(contractFile, ws).dir + path.sep;
users.sort((a, b) => (b.startsWith(ownDir) ? 1 : 0) - (a.startsWith(ownDir) ? 1 : 0));

const declaringFileOf = (f, sf, name) => {
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings)) continue;
    for (const e of st.importClause.namedBindings.elements) {
      if (e.name.text !== name) continue;
      const r = resolver(st.moduleSpecifier.text, f);
      if (!r) return null;
      const d = lib.findDeclaringFile(r, (e.propertyName ?? e.name).text, resolver);
      return d?.file ?? null;
    }
  }
  return null;
};
const sameFile = (a, b) => a && b && path.resolve(a) === path.resolve(b);

// ---- build candidate edits per file ----
const live = new Map();
const services = new Map();
const svcFor = (f) => {
  const w = lib.workspaceOf(f, ws);
  if (!services.has(w.name)) services.set(w.name, lib.makeLanguageService(w.dir, live));
  return services.get(w.name);
};
const stats = { typeRefs: 0, parseCalls: 0, stubValue: 0, stubDefault: 0, fieldInline: 0, leftoverStubOther: 0, leftoverOther: 0, acceptedEdits: 0, restoredByGate: 0, userFiles: users.length };
const needParen = (n) => ts.isBinaryExpression(n) || ts.isConditionalExpression(n) || ts.isArrowFunction(n) || ts.isAsExpression(n) || ts.isAwaitExpression(n);

const collectFor = (f, text) => {
  const sf = lib.parse(f, text);
  const local = { C: declaringFileOf(f, sf, brandName), T: declaringFileOf(f, sf, typeName), S: declaringFileOf(f, sf, stubName) };
  const isC = (id) => id.text === brandName && sameFile(local.C, contractFile);
  const isT = (id) => id.text === typeName && sameFile(local.T, contractFile);
  const isS = (id) => id.text === stubName && sameFile(local.S, stubFile);
  const cands = [];
  const addCand = (n, start, end, newText, kindName) => {
    const { stmtStart, stmtEnd } = lib.enclosingStatement(n, sf);
    cands.push({ start, end, text: newText, stmtStart, stmtEnd, kindName });
  };
  const inContractFile = /-contract\.ts$/u.test(f);
  const visit = (n) => {
    if (ts.isImportDeclaration(n)) return;
    if (ts.isTypeReferenceNode(n) && ts.isIdentifier(n.typeName) && isT(n.typeName)) addCand(n, n.getStart(sf), n.end, kind, 'type');
    else if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && ts.isIdentifier(n.expression.expression) && isC(n.expression.expression) && n.expression.name.text === 'parse' && n.arguments.length === 1) {
      const a = n.arguments[0];
      const t = a.getText(sf);
      addCand(n, n.getStart(sf), n.end, needParen(a) ? `(${t})` : t, 'parse');
    } else if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && isS(n.expression)) {
      const a = n.arguments[0];
      if (!a) {
        if (stubDefault) addCand(n, n.getStart(sf), n.end, stubDefault, 'stub-default');
        else stats.leftoverStubOther++;
      } else if (ts.isObjectLiteralExpression(a) && a.properties.length === 1 && ts.isPropertyAssignment(a.properties[0]) && a.properties[0].name.getText(sf) === 'value') {
        const v = a.properties[0].initializer;
        addCand(n, n.getStart(sf), n.end, needParen(v) ? `(${v.getText(sf)})` : v.getText(sf), 'stub-value');
      } else stats.leftoverStubOther++;
    } else if (inContractFile && ts.isIdentifier(n) && isC(n) && n.parent && ts.isPropertyAssignment(n.parent) && n.parent.initializer === n) {
      // key: C  ->  inline brand
      if (inlineOk) {
        let owner = null;
        for (let p = n.parent; p && !owner; p = p.parent) {
          if (ts.isCallExpression(p) && ts.isPropertyAccessExpression(p.expression) && p.expression.name.text === 'brand' && p.typeArguments?.[0]) owner = p.typeArguments[0].getText(sf).replace(/['"]/gu, '');
          if (ts.isVariableDeclaration(p) && ts.isIdentifier(p.name) && !owner) owner = p.name.text.replace(/Contract$/u, '').replace(/^./u, (c) => c.toUpperCase());
        }
        const key = n.parent.name.getText(sf).replace(/['"]/gu, '');
        const brand = `${owner}${key.replace(/^./u, (c) => c.toUpperCase())}`;
        addCand(n, n.getStart(sf), n.end, `${baseSchema}.brand<'${brand}'>()`, 'field-inline');
      } else stats.leftoverOther++;
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  // drop a candidate that contains another one; the next round redoes it
  const flat = cands.filter((c) => !cands.some((o) => o !== c && o.start >= c.start && o.end <= c.end));
  return { f, text, sf, cands: flat, local };
};

// ---- gate + apply per file ----
const importDropEdits = (f, out) => {
  const sf2 = lib.parse(f, out);
  const drop = [];
  for (const st of sf2.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings) || st.importClause.name) continue;
    const els = st.importClause.namedBindings.elements;
    const used = (nm) => { let hit = false; const v = (n) => { if (hit || ts.isImportDeclaration(n)) return; if (ts.isIdentifier(n) && n.text === nm) hit = true; ts.forEachChild(n, v); }; sf2.statements.forEach(v); return hit; };
    const keep = els.filter((e) => used(e.name.text) || ![brandName, typeName, stubName].includes(e.name.text));
    if (keep.length === els.length) continue;
    if (!keep.length) { const le = out.indexOf('\n', st.end); drop.push({ start: st.getStart(sf2), end: le === -1 ? st.end : le + 1, text: '' }); }
    else drop.push({ start: st.getStart(sf2), end: st.end, text: `import${st.importClause.isTypeOnly ? ' type' : ''} { ${keep.map((e) => e.getText(sf2)).join(', ')} } from ${st.moduleSpecifier.getText(sf2)};` });
  }
  return lib.applyEdits(out, drop);
};
const overlay = new Map();
for (const f of users) {
  let text = fs.readFileSync(f, 'utf8');
  const svc = svcFor(f);
  let any = false;
  for (let round = 0; round < 5; round++) {
    const pf = collectFor(f, text);
    if (!pf.cands.length) break;
    const render = (acc) => importDropEdits(f, lib.applyEdits(text, acc));
    const accepted = lib.gateEdits({ service: svc.service, live, file: f, text, cands: pf.cands, render });
    stats.restoredByGate += pf.cands.length - accepted.length;
    stats.acceptedEdits += accepted.length;
    for (const c of accepted) stats[{ type: 'typeRefs', parse: 'parseCalls', 'stub-value': 'stubValue', 'stub-default': 'stubDefault', 'field-inline': 'fieldInline' }[c.kindName]]++;
    if (!accepted.length) break;
    text = lib.applyEdits(text, accepted);
    any = true;
    live.set(f, { v: (live.get(f)?.v ?? 0) + 1, text });
    if (accepted.length === pf.cands.length && !collectFor(f, text).cands.length) break;
  }
  if (!any) continue;
  const out = importDropEdits(f, text);
  overlay.set(f, out);
  live.set(f, { v: (live.get(f)?.v ?? 0) + 1, text: out });
}
// ---- delete contract / stub / test, strip barrel lines ----
const removed = [contractFile, stubFile, testFile].filter((f) => fs.existsSync(f));
for (const f of removed) overlay.set(f, null);
const barrelEdits = [];
for (const f of all) {
  if (!/\/(contracts|testing|index|[a-z-]+)\.ts$/u.test(f)) continue;
  const t = fs.readFileSync(f, 'utf8');
  if (!t.includes(stubBase)) continue;
  const lines = t.split('\n');
  const keep = lines.filter((l) => !(/^\s*export\s/u.test(l) && l.includes(`/${stubBase}-contract'`) || /^\s*export\s/u.test(l) && l.includes(`/${stubBase}.stub'`)));
  if (keep.length !== lines.length) { overlay.set(f, keep.join('\n')); barrelEdits.push(rel(f)); }
}
console.log('removed files', removed.map(rel), 'barrel lines edited in', barrelEdits);
console.log(JSON.stringify(stats));

// ---- whole-repo check: packages with edited or dependent files ----
if (!process.argv.includes('--no-check')) {
const keyOf = (d) => `${d.code}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
const touchedPkgs = new Set([...overlay.keys()].map((f) => lib.workspaceOf(f, ws).name));
const target = ws.filter((w) => !w.isGateway && (touchedPkgs.has(w.name) || Object.keys({ ...w.packageJson.dependencies, ...w.packageJson.devDependencies }).some((d) => touchedPkgs.has(d))));
let newD = 0;
const kinds = {};
const bad = [];
let checked = 0;
for (const w of target) {
  const files = lib.walk(w.dir).filter((f) => !f.includes('/dist/'));
  const options = lib.packageCompilerOptions(w.dir);
  const base = lib.diagnosticsWithOverlay(files, new Map(), options).diagnostics;
  const aft = lib.diagnosticsWithOverlay(files.filter((f) => overlay.get(f) !== null), overlay, options).diagnostics;
  for (const f of files) {
    if (overlay.get(f) === null) continue;
    checked++;
    const bk = new Set((base.get(f) ?? []).map(keyOf));
    const add = (aft.get(f) ?? []).filter((d) => !bk.has(keyOf(d)));
    if (add.length) { newD += add.length; bad.push([rel(f), ...add.slice(0, 3).map((d) => lib.formatDiagnostic(d).slice(0, 230))]); for (const d of add) { const k = `TS${d.code} ` + ts.flattenDiagnosticMessageText(d.messageText, ' ').slice(0, 60).replace(/'[^']*'/g, 'X'); kinds[k] = (kinds[k] ?? 0) + 1; } }
  }
}
console.log(JSON.stringify({ packagesChecked: target.map((w) => w.short), filesChecked: checked, filesWithNewDiagnostics: bad.length, newDiagnostics: newD }));
console.log(Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 8));
bad.slice(0, 10).forEach((b) => console.log(b.join('\n   ')));
}
const out = arg('sample-out');
if (out) for (const [f, t] of overlay) { if (t === null) continue; const d = path.join(ROOT, out, rel(f)); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.writeFileSync(d, t); }
if (process.argv.includes('apply')) {
  for (const [f, t] of overlay) {
    if (t !== null) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, t); continue; }
    const mv = path.join(lib.DELETIONS, 'W1', rel(f));
    fs.mkdirSync(path.dirname(mv), { recursive: true });
    if (fs.existsSync(f)) fs.renameSync(f, mv);
  }
  console.log(`applied ${overlay.size} files`);
}

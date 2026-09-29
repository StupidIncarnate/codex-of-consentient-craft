// B18 split (b) prototype: functions returning AdapterResult / { success: true } become void, their constant return
// disappears, callers that discard the value stay as they are, tests that assert the constant assert undefined.
// Usage: node .../run.cjs [--pkgs=a,b] [--apply-sample] [--sample-out=dir]
const fs = require('fs');
const path = require('path');
const lib = require('../../phase34/lib/repo.cjs');
const { ts, ROOT, rel } = lib;
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const onlyPkgs = arg('pkgs')?.split(',');
const ws = lib.workspaces();

const isSuccessTrueLiteral = (e) => {
  while (ts.isParenthesizedExpression(e) || ts.isAwaitExpression(e)) e = e.expression;
  if (ts.isObjectLiteralExpression(e) && e.properties.length === 1 && ts.isPropertyAssignment(e.properties[0]) && e.properties[0].name.getText() === 'success' && e.properties[0].initializer.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (ts.isCallExpression(e) && ts.isPropertyAccessExpression(e.expression) && e.expression.name.text === 'parse' && e.expression.expression.getText() === 'adapterResultContract' && e.arguments.length === 1) return isSuccessTrueLiteral(e.arguments[0]);
  if (ts.isCallExpression(e) && e.expression.getText() === 'AdapterResultStub' && e.arguments.length === 0) return true;
  return false;
};
const constType = (t, sf) => {
  if (t.kind === ts.SyntaxKind.VoidKeyword) return false;
  let x = t;
  if (ts.isTypeReferenceNode(x) && x.typeName.getText(sf) === 'Promise' && x.typeArguments?.length === 1) x = x.typeArguments[0];
  if (ts.isTypeReferenceNode(x) && x.typeName.getText(sf) === 'AdapterResult') return { node: x, promise: x !== t };
  if (ts.isTypeLiteralNode(x) && x.members.length === 1 && ts.isPropertySignature(x.members[0]) && x.members[0].name.getText(sf) === 'success' && x.members[0].type?.getText(sf) === 'true') return { node: x, promise: x !== t };
  return false;
};

const total = { candidates: 0, ownReturnsConstOnly: 0, convertible: 0, blockedByCaller: 0, blockedByReturn: 0, prodFiles: new Set(), callersDiscard: 0, callersForward: 0, callersUsed: 0, testAssertRewritten: 0, testAssertOther: 0 };
const overlay = new Map();
const blockedReasons = {};
const perPkg = {};

for (const w of ws) {
  if (w.isGateway) continue;
  if (onlyPkgs && !onlyPkgs.includes(w.short)) continue;
  const files = lib.walk(w.dir).filter((f) => !f.includes('/dist/'));
  const text = new Map(files.map((f) => [f, fs.readFileSync(f, 'utf8')]));
  const prodFiles = files.filter((f) => !lib.isTestSupport(f) && /AdapterResult|success: true/u.test(text.get(f)));
  if (!prodFiles.length) continue;
  const svc = lib.makeLanguageService(w.dir, new Map());
  const program = svc.service.getProgram();
  const checker = program.getTypeChecker();
  // ---- candidate functions ----
  const cands = [];
  for (const f of prodFiles) {
    const sf = program.getSourceFile(f);
    if (!sf) continue;
    const visit = (n) => {
      let fn = null;
      let nameNode = null;
      if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer && (ts.isArrowFunction(n.initializer) || ts.isFunctionExpression(n.initializer))) { fn = n.initializer; nameNode = n.name; }
      else if (ts.isFunctionDeclaration(n) && n.name && n.body) { fn = n; nameNode = n.name; }
      if (fn && fn.type) {
        const ct = constType(fn.type, sf);
        if (ct) cands.push({ file: f, sf, fn, nameNode, ct, decl: n });
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
  if (!cands.length) continue;
  total.candidates += cands.length;
  const byDecl = new Map(cands.map((c) => [c.fn, c]));
  // ---- (a) own returns ----
  const ownReturns = (c) => {
    const out = [];
    const fn = c.fn;
    if (!ts.isBlock(fn.body)) { out.push(fn.body); return out; }
    const v = (n) => { if (n !== fn && ts.isFunctionLike(n)) return; if (ts.isReturnStatement(n)) out.push(n.expression ?? null); ts.forEachChild(n, v); };
    ts.forEachChild(fn.body, v);
    return out;
  };
  const symDecl = (expr) => {
    let e = expr;
    while (ts.isParenthesizedExpression(e) || ts.isAwaitExpression(e)) e = e.expression;
    if (!ts.isCallExpression(e)) return null;
    let sym = checker.getSymbolAtLocation(e.expression);
    if (sym && sym.flags & ts.SymbolFlags.Alias) sym = checker.getAliasedSymbol(sym);
    const d = sym?.declarations?.[0];
    if (!d) return null;
    const fnNode = ts.isVariableDeclaration(d) ? d.initializer : d;
    return fnNode;
  };
  let alive = new Set(cands);
  const reason = new Map();
  for (let round = 0; round < 12; round++) {
    let changed = false;
    for (const c of [...alive]) {
      const rs = ownReturns(c);
      let ok = true;
      for (const r of rs) {
        if (r === null) continue;
        if (isSuccessTrueLiteral(r)) continue;
        const target = symDecl(r);
        if (target && byDecl.has(target) && alive.has(byDecl.get(target))) continue; // forwarder to another convertible function
        ok = false;
        reason.set(c, `return ${r.getText(c.sf).slice(0, 50)}`);
        break;
      }
      // (b) callers in production code must discard or forward
      if (ok) {
        const refs = svc.service.findReferences(c.file, c.nameNode.getStart(c.sf)) ?? [];
        for (const ref of refs) for (const r of ref.references) {
          if (r.isDefinition) continue;
          const rf = path.resolve(r.fileName);
          if (lib.isTestSupport(rf)) continue;
          const rsf = program.getSourceFile(rf);
          const tok = (function find(n) { if (r.textSpan.start >= n.getStart(rsf) && r.textSpan.start + r.textSpan.length <= n.end) return ts.forEachChild(n, find) ?? n; })(rsf);
          const p = tok?.parent;
          if (!p || ts.isImportSpecifier(p) || ts.isExportSpecifier(p)) continue;
          if (!ts.isCallExpression(p) || p.expression !== tok) { ok = false; reason.set(c, `non-call reference ${p.getText(rsf).slice(0, 40)}`); break; }
          let cur = p;
          while (cur.parent && (ts.isAwaitExpression(cur.parent) || ts.isParenthesizedExpression(cur.parent))) cur = cur.parent;
          const q = cur.parent;
          if (q && ts.isExpressionStatement(q)) { c.discard = (c.discard ?? 0) + 1; continue; }
          if (q && (ts.isReturnStatement(q) || (ts.isArrowFunction(q) && q.body === cur))) {
            // forwarder: the enclosing function must itself be alive
            let fnUp = q; while (fnUp && !ts.isFunctionLike(fnUp)) fnUp = fnUp.parent;
            const en = fnUp && (ts.isArrowFunction(fnUp) && ts.isVariableDeclaration(fnUp.parent) ? fnUp : fnUp);
            if (en && byDecl.has(en) && alive.has(byDecl.get(en))) { c.forward = (c.forward ?? 0) + 1; continue; }
          }
          // Promise.all([...]) statements, `void F()`, `.catch`, etc: not scripted
          ok = false;
          reason.set(c, `caller uses the value: ${q ? q.getText(rsf).replace(/\s+/g, ' ').slice(0, 60) : '?'}`);
          break;
        }
      }
      if (!ok) { alive.delete(c); changed = true; }
    }
    if (!changed) break;
  }
  const conv = [...alive];
  total.convertible += conv.length;
  perPkg[w.short] = { candidates: cands.length, convertible: conv.length };
  for (const c of cands) if (!alive.has(c)) { const k = (reason.get(c) ?? '?').replace(/[:(].*/u, '').slice(0, 40); blockedReasons[k] = (blockedReasons[k] ?? 0) + 1; }
  // ---- rewrite production files ----
  const editsByFile = new Map();
  const add = (f, e) => (editsByFile.get(f) ?? editsByFile.set(f, []).get(f)).push(e);
  for (const c of conv) {
    const { sf, fn, ct } = c;
    add(c.file, { start: ct.node.getStart(sf), end: ct.node.end, text: 'void' });
    total.prodFiles.add(c.file);
    total.callersDiscard += c.discard ?? 0;
    total.callersForward += c.forward ?? 0;
    if (!ts.isBlock(fn.body)) {
      if (isSuccessTrueLiteral(fn.body)) add(c.file, { start: fn.body.getStart(sf), end: fn.body.end, text: '{}' });
      continue;
    }
    const stmts = fn.body.statements;
    const v = (n) => {
      if (n !== fn && ts.isFunctionLike(n)) return;
      if (ts.isReturnStatement(n) && n.expression && isSuccessTrueLiteral(n.expression)) {
        const isLast = n === stmts[stmts.length - 1];
        const ls = c.file && text.get(c.file).lastIndexOf('\n', n.getStart(sf)) + 1;
        if (isLast) add(c.file, { start: ls, end: text.get(c.file).indexOf('\n', n.end) + 1, text: '' });
        else add(c.file, { start: n.getStart(sf), end: n.end, text: 'return;' });
      }
      ts.forEachChild(n, v);
    };
    ts.forEachChild(fn.body, v);
  }
  // drop imports that became unused
  for (const [f, edits] of editsByFile) {
    let out = lib.applyEdits(text.get(f), edits);
    const sf2 = lib.parse(f, out);
    const drop = [];
    for (const st of sf2.statements) {
      if (!ts.isImportDeclaration(st) || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings) || st.importClause.name) continue;
      const els = st.importClause.namedBindings.elements;
      const used = (nm) => { let hit = false; const vv = (n) => { if (hit || ts.isImportDeclaration(n)) return; if (ts.isIdentifier(n) && n.text === nm) hit = true; ts.forEachChild(n, vv); }; sf2.statements.forEach(vv); return hit; };
      const keep = els.filter((e) => used(e.name.text));
      if (keep.length === els.length) continue;
      if (!keep.length) { const le = out.indexOf('\n', st.end); drop.push({ start: st.getStart(sf2), end: le === -1 ? st.end : le + 1, text: '' }); }
      else drop.push({ start: st.getStart(sf2), end: st.end, text: `import${st.importClause.isTypeOnly ? ' type' : ''} { ${keep.map((e) => e.getText(sf2)).join(', ')} } from ${st.moduleSpecifier.getText(sf2)};` });
    }
    overlay.set(f, lib.applyEdits(out, drop));
  }
  // ---- tests / proxies of the converted functions: assertion rewrite ----
  const convNames = new Set(conv.map((c) => c.nameNode.text));
  const testFiles = files.filter((f) => lib.isTestSupport(f) && /success: true|AdapterResultStub/u.test(text.get(f)));
  for (const f of testFiles) {
    let t = overlay.get(f) ?? text.get(f);
    let n = 0;
    const before = t;
    // expect(x).toStrictEqual({ success: true }) / .resolves.toStrictEqual({ success: true }) / toStrictEqual(AdapterResultStub())
    t = t.replace(/\.(toStrictEqual|toBe|toEqual)\(\s*\{\s*success:\s*true\s*\}\s*\)/gu, () => (n++, '.toBeUndefined()'));
    t = t.replace(/\.(toStrictEqual|toBe|toEqual)\(\s*AdapterResultStub\(\)\s*\)/gu, () => (n++, '.toBeUndefined()'));
    t = t.replace(/\.(mockResolvedValue|mockReturnValue|mockResolvedValueOnce|mockReturnValueOnce)\(\s*(\{\s*success:\s*true\s*\}|AdapterResultStub\(\))\s*\)/gu, (m, k) => (n++, `.${k}(undefined)`));
    if (t !== before) { overlay.set(f, t); total.testAssertRewritten += n; }
    const left = (t.match(/success:\s*true|AdapterResultStub/gu) || []).length;
    total.testAssertOther += left;
  }
}
const totalOut = { ...total, prodFiles: total.prodFiles.size };
console.log(JSON.stringify(totalOut));
console.log('per package', JSON.stringify(perPkg));
console.log('blocked reasons', JSON.stringify(Object.entries(blockedReasons).sort((a, b) => b[1] - a[1]).slice(0, 10)));

// ---- verify: typecheck every touched package, all files of it ----
const keyOf = (d) => `${d.code}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
const byPkg = {};
for (const f of overlay.keys()) (byPkg[lib.workspaceOf(f, ws).name] ??= []).push(f);
let newD = 0;
let cleanFiles = 0;
const bad = [];
const kinds = {};
const allTouched = [...overlay.keys()];
for (const [pn, fl] of Object.entries(byPkg)) {
  const w = ws.find((x) => x.name === pn);
  const options = lib.packageCompilerOptions(w.dir);
  const pf = lib.walk(w.dir).filter((f) => !f.includes('/dist/'));
  const base = lib.diagnosticsWithOverlay(pf, new Map(), options).diagnostics;
  const aft = lib.diagnosticsWithOverlay(pf, overlay, options).diagnostics;
  for (const f of pf) {
    const bk = new Set((base.get(f) ?? []).map(keyOf));
    const add = (aft.get(f) ?? []).filter((d) => !bk.has(keyOf(d)));
    if (overlay.has(f) && !add.length) cleanFiles++;
    if (add.length) { newD += add.length; bad.push([rel(f), ...add.slice(0, 2).map((d) => lib.formatDiagnostic(d).slice(0, 200))]); for (const d of add) { const k = `TS${d.code} ` + ts.flattenDiagnosticMessageText(d.messageText, ' ').slice(0, 50).replace(/'[^']*'/g, 'X'); kinds[k] = (kinds[k] ?? 0) + 1; } }
  }
  console.error(`${pn} verified`);
}
console.log(JSON.stringify({ filesRewritten: overlay.size, rewrittenFilesWithZeroNewDiagnostics: cleanFiles, newDiagnosticsAnywhereInTouchedPackages: newD }));
console.log(Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 10));
bad.slice(0, 8).forEach((b) => console.log(b.join('\n   ')));
const out = arg('sample-out');
if (out) for (const [f, t] of overlay) { const d = path.join(ROOT, out, rel(f)); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.writeFileSync(d, t); }

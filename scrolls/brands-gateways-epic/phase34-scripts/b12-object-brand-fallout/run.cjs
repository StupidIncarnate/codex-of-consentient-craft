// SD5, wave W6: the construction-site fallout of branding every object contract (R2's autofix).
//
// Step 1 (overlay only): every top-level `export const xContract = z.object(...)` chain (and `.extend/.pick/.omit/...` of another
//   contract, which zod v4 leaves unbranded) with no `.brand<>()` gets `.brand<'X'>()`, X = the const name minus `Contract`,
//   PascalCase. Enum, union and scalar contracts are left alone. Nested object fields are NOT branded here.
// Step 2, the rewriter ("build through the root parse"), driven by the checker: every object literal whose contextual type
//   carries an owner brand its own type lacks is wrapped in `ownerContract.parse(...)` (`OwnerStub(...)` in test support), and
//   `lit as Owner` becomes the parse alone. A literal is rewritten only when it names every required property of the owner;
//   a literal holding a spread is PARTIAL and goes to the partial list for a person; a literal missing a property is
//   INCOMPLETE (its error predates the brand or the stub fills it) and goes to leftovers too.
//
// Usage (from the worktree root, `tmp/phase34/` copy):
//   node --max-old-space-size=32000 tmp/phase34/b12-object-brand-fallout/run.cjs [--census] [--only-pkg=shared,mcp]
//     [--pkgs=a,b] [--rounds=3] [--no-rewrite] [--sample-out=dir] [--leftovers=file]
// `--only-pkg` restricts which packages' contracts get branded (default all); `--pkgs` restricts which packages are measured
// (default: every package that holds or depends on a branded one, in dependency order). Nothing under packages/ is written.
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');
const { ts, ROOT, rel } = lib;
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const flag = (n) => process.argv.includes(`--${n}`);
const ws = lib.workspaces().filter((w) => !w.isGateway);
const resolver = lib.makeResolver();
const t0 = Date.now();
const log = (...a) => console.error(`[${Math.round((Date.now() - t0) / 1000)}s]`, ...a);
const pascal = (s) => s.replace(/(^|[_\-\s]+)([a-zA-Z0-9])/gu, (_, __, c) => c.toUpperCase()).replace(/^./u, (c) => c.toUpperCase());
const sameFile = (a, b) => a && b && path.resolve(a) === path.resolve(b);

// ---------- step 1: census and brand overlay ----------
const DERIVE = new Set(['extend', 'pick', 'omit', 'partial', 'required', 'merge', 'safeExtend']);
const OBJ_ROOT = new Set(['object', 'strictObject', 'looseObject']);
// 'branded' | 'object' | 'derived' | null, walking the call chain from the outside in
const classify = (init) => {
  let e = init;
  while (ts.isParenthesizedExpression(e)) e = e.expression;
  let derivedSeen = false;
  for (;;) {
    if (ts.isCallExpression(e) && ts.isPropertyAccessExpression(e.expression)) {
      const m = e.expression.name.text;
      if (m === 'brand') return derivedSeen ? 'derived' : 'branded';
      if (OBJ_ROOT.has(m) && ts.isIdentifier(e.expression.expression) && e.expression.expression.text === 'z') return derivedSeen ? 'derived' : 'object';
      if (DERIVE.has(m)) derivedSeen = true;
      e = e.expression.expression;
      continue;
    }
    if (ts.isIdentifier(e) && /Contract$/u.test(e.text) && derivedSeen) return 'derived';
    return null;
  }
};
const census = []; // { pkg, file, const, brand, typeName, cls }
const overlay = new Map();
const onlyPkg = arg('only-pkg')?.split(',');
for (const w of ws) {
  if (onlyPkg && !onlyPkg.includes(w.short)) continue;
  for (const f of lib.walk(path.join(w.dir, 'src'))) {
    if (!/-contract\.ts$/u.test(f)) continue;
    const text = fs.readFileSync(f, 'utf8');
    const sf = lib.parse(f, text);
    const edits = [];
    for (const st of sf.statements) {
      if (!ts.isVariableStatement(st) || !st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
      for (const d of st.declarationList.declarations) {
        if (!ts.isIdentifier(d.name) || !d.initializer) continue;
        const cls = classify(d.initializer);
        if (cls !== 'object' && cls !== 'derived') continue;
        const brand = pascal(d.name.text.replace(/Contract$/u, ''));
        let typeName = null;
        for (const s2 of sf.statements) if (ts.isTypeAliasDeclaration(s2) && new RegExp(`typeof ${d.name.text}\\b`, 'u').test(s2.type.getText(sf)) && !/\[/u.test(s2.type.getText(sf))) typeName = s2.name.text;
        census.push({ pkg: w.short, file: f, const: d.name.text, brand, typeName, cls });
        edits.push({ start: d.initializer.end, end: d.initializer.end, text: `.brand<'${brand}'>()` });
      }
    }
    if (edits.length) overlay.set(f, lib.applyEdits(text, edits));
  }
}
const byPkg = {};
for (const c of census) byPkg[c.pkg] = (byPkg[c.pkg] ?? 0) + 1;
console.log('CENSUS', JSON.stringify({ total: census.length, object: census.filter((c) => c.cls === 'object').length, derived: census.filter((c) => c.cls === 'derived').length, byPkg }));
if (flag('census')) process.exit(0);
const ownersByBrand = new Map();
for (const c of census) ownersByBrand.set(c.brand, [...(ownersByBrand.get(c.brand) ?? []), c]);

// ---------- measurement ----------
const keyOf = (d) => `${d.code}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
const touched = new Set(census.map((c) => c.pkg));
const depsOf = (w) => Object.keys({ ...w.packageJson.dependencies, ...w.packageJson.devDependencies });
const order = [];
const seen = new Set();
const visitPkg = (w) => {
  if (seen.has(w.name)) return;
  seen.add(w.name);
  for (const d of depsOf(w)) { const x = ws.find((y) => y.name === d); if (x) visitPkg(x); }
  order.push(w);
};
ws.forEach(visitPkg);
let target = order.filter((w) => touched.has(w.short) || depsOf(w).some((d) => touched.has(d.replace(/^@dungeonmaster\//u, '')) || [...touched].some((t) => d === `@dungeonmaster/${t}`)));
target = target.filter((w) => touched.has(w.short) || depsOf(w).some((d) => touched.has(d.replace(/^@dungeonmaster\//u, ''))));
if (arg('pkgs')) target = target.filter((w) => arg('pkgs').split(',').includes(w.short));
const baseByPkg = new Map();
const baseOf = (w) => {
  if (!baseByPkg.has(w.name)) {
    const files = lib.walk(w.dir).filter((f) => !f.includes('/dist/'));
    const b = lib.diagnosticsWithOverlay(files, new Map(), lib.packageCompilerOptions(w.dir)).diagnostics;
    const m = new Map();
    for (const [f, ds] of b) m.set(f, new Set((ds ?? []).map(keyOf)));
    baseByPkg.set(w.name, m);
    log('base', w.short);
  }
  return baseByPkg.get(w.name);
};
const measure = (handler) => {
  const res = new Map();
  for (const w of target) {
    const base = baseOf(w);
    const files = lib.walk(w.dir).filter((f) => !f.includes('/dist/') && overlay.get(f) !== null);
    const r = lib.diagnosticsWithOverlay(files, overlay, lib.packageCompilerOptions(w.dir));
    const list = [];
    for (const f of files) for (const d of r.diagnostics.get(f) ?? []) if (!(base.get(f) ?? new Set()).has(keyOf(d))) list.push({ f, d });
    handler?.(w, list, r.program);
    res.set(w.short, { count: list.length, items: list.map(({ f, d }) => ({ where: `${rel(f)}:${d.file ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : 0}`, code: d.code, msg: ts.flattenDiagnosticMessageText(d.messageText, ' ').slice(0, 220) })) });
    log('measured', w.short, list.length);
  }
  return res;
};
const summarize = (res) => {
  const per = {};
  const kinds = {};
  let total = 0;
  for (const [k, v] of res) {
    per[k] = v.count;
    total += v.count;
    for (const it of v.items) { const key = `TS${it.code}`; kinds[key] = (kinds[key] ?? 0) + 1; }
  }
  return { total, per, kinds };
};

// ---------- step 2: the rewriter ----------
const leftovers = { partial: [], incomplete: [], ambiguous: [], noImport: [] };
const brandTextsOf = (checker, type) => {
  const out = [];
  for (const p of checker.getPropertiesOfType(type)) {
    if (!/BRAND/iu.test(p.name)) continue;
    const pt = checker.getTypeOfSymbol ? checker.getTypeOfSymbol(p) : null;
    if (pt) for (const q of checker.getPropertiesOfType(pt)) out.push(q.name);
  }
  return out;
};
const specFor = (fromFile, targetFile, name) => {
  const wf = lib.workspaceOf(fromFile, ws);
  const wt = lib.workspaceOf(targetFile, ws);
  if (wf === wt) {
    let r = path.relative(path.dirname(fromFile), targetFile).replace(/\.tsx?$/u, '').split(path.sep).join('/');
    if (!r.startsWith('.')) r = `./${r}`;
    return r;
  }
  for (const s of [`${wt.name}/contracts`, `${wt.name}/${path.relative(path.join(wt.dir, 'src'), targetFile).replace(/\.tsx?$/u, '').split(path.sep).join('/')}`]) {
    const r = resolver(s, fromFile);
    const d = r && lib.findDeclaringFile(r, name, resolver);
    if (d && sameFile(d.file, targetFile)) return s;
  }
  return null;
};
const typeOnlyNames = (sf) => {
  const s = new Set();
  for (const st of sf.statements) if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) for (const e of st.importClause.namedBindings.elements) if (st.importClause.isTypeOnly || e.isTypeOnly) s.add(e.name.text);
  return s;
};
const collectRewrites = (prog, list, editsByFile) => {
  const checker = prog.getTypeChecker();
  const files = [...new Set(list.map((x) => x.f))];
  let count = 0;
  const hitsOf = (ctx0, own) => {
    const ctx = ctx0 && checker.getNonNullableType(ctx0);
    if (!ctx) return [];
    const ownBrands = new Set(own ? brandTextsOf(checker, own) : []);
    const hits = [];
    for (const m of ctx.isUnion() ? ctx.types : [ctx]) {
      const texts = brandTextsOf(checker, m).filter((x) => ownersByBrand.has(x) && !ownBrands.has(x));
      if (texts.length) hits.push({ m, text: texts[0] });
    }
    return hits;
  };
  // wraps literal `n` for owner `text` (member type `m`); false when it is left for a person
  const wrap = (n, sf, f, entry, support, text, m, tag) => {
    const where = `${rel(f)}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`;
    if (n.properties.some((p) => ts.isSpreadAssignment(p))) {
      leftovers.partial.push(`${where} ${text}${tag} spread: ${n.properties.filter((p) => ts.isSpreadAssignment(p)).map((p) => p.expression.getText(sf).replace(/\s+/gu, ' ').slice(0, 60)).join(', ')}`);
      return false;
    }
    const have = new Set(n.properties.map((p) => p.name?.getText(sf).replace(/['"]/gu, '')));
    const missing = checker.getPropertiesOfType(m).filter((p) => !/BRAND/iu.test(p.name) && !(p.flags & ts.SymbolFlags.Optional) && !have.has(p.name)).map((p) => p.name);
    if (missing.length) { leftovers.incomplete.push(`${where} ${text}${tag} missing ${missing.join(',')}`); return false; }
    let cand = null;
    let spec = null;
    let useStub = false;
    let stubStyle = null;
    const typeOnly = typeOnlyNames(sf);
    for (const c of ownersByBrand.get(text)) {
      const stub = path.join(path.dirname(c.file), `${path.basename(c.file).replace(/-contract\.ts$/u, '')}.stub.ts`);
      const stubName = c.typeName ? `${c.typeName}Stub` : null;
      if (support && stubName && !typeOnly.has(stubName) && fs.existsSync(stub)) {
        const stubText = fs.readFileSync(stub, 'utf8');
        const style = /\(\s*\{\s*value\s*\}\s*:\s*\{\s*value:/u.test(stubText) ? 'value' : /StubArgument</u.test(stubText) ? 'argument' : null;
        const s = style && specFor(f, stub, stubName);
        if (s) { cand = c; spec = s; useStub = true; stubStyle = style; break; }
      }
      const s = specFor(f, c.file, c.const);
      if (s) { cand = c; spec = s; useStub = false; break; }
    }
    if (!cand) { leftovers.noImport.push(`${where} ${text}${tag}`); return false; }
    const name = useStub ? `${cand.typeName}Stub` : cand.const;
    const lit = n.getText(sf);
    const wrapped = !useStub ? `${name}.parse(${lit})` : stubStyle === 'value' ? `${name}({ value: ${lit} })` : `${name}(${lit})`;
    let outer = n;
    while (ts.isParenthesizedExpression(outer.parent)) outer = outer.parent;
    if (outer.parent && (ts.isAsExpression(outer.parent) || ts.isSatisfiesExpression(outer.parent)) && outer.parent.expression === outer) outer = outer.parent;
    entry.edits.push({ start: outer.getStart(sf), end: outer.end, text: wrapped });
    entry.imports.set(name, spec);
    count++;
    return true;
  };
  // the object literals that BUILD the value of `e`, followed through `.map` callbacks, conditionals, array literals and same-file consts
  const origins = (e, sf, depth = 0) => {
    if (depth > 6) return null;
    if (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isNonNullExpression(e) || ts.isSatisfiesExpression(e)) return origins(e.expression, sf, depth + 1);
    if (ts.isObjectLiteralExpression(e)) return [e];
    if (ts.isConditionalExpression(e)) { const a = origins(e.whenTrue, sf, depth + 1); const b = origins(e.whenFalse, sf, depth + 1); return a && b ? [...a, ...b] : null; }
    if (ts.isBinaryExpression(e) && [ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.BarBarToken].includes(e.operatorToken.kind)) { const a = origins(e.left, sf, depth + 1); const b = origins(e.right, sf, depth + 1); return a && b ? [...a, ...b] : null; }
    if (ts.isArrayLiteralExpression(e)) { const out = []; for (const el of e.elements) { const o = origins(el, sf, depth + 1); if (!o) return null; out.push(...o); } return out; }
    if (ts.isCallExpression(e) && ts.isPropertyAccessExpression(e.expression)) {
      const nm = e.expression.name.text;
      if (['filter', 'slice', 'sort', 'reverse', 'concat'].includes(nm) && nm !== 'concat') return origins(e.expression.expression, sf, depth + 1);
      if (nm === 'map' && e.arguments.length === 1 && (ts.isArrowFunction(e.arguments[0]) || ts.isFunctionExpression(e.arguments[0]))) {
        const fn = e.arguments[0];
        if (!ts.isBlock(fn.body)) return origins(fn.body, sf, depth + 1);
        const rets = [];
        const v = (x) => { if (ts.isFunctionLike(x) && x !== fn) return; if (ts.isReturnStatement(x)) rets.push(x); ts.forEachChild(x, v); };
        v(fn.body);
        const out = [];
        for (const r of rets) { if (!r.expression) return null; const o = origins(r.expression, sf, depth + 1); if (!o) return null; out.push(...o); }
        return out.length ? out : null;
      }
      return null;
    }
    if (ts.isIdentifier(e)) {
      const sym = checker.getSymbolAtLocation(e);
      const decl = sym?.valueDeclaration;
      if (decl && ts.isVariableDeclaration(decl) && decl.initializer && decl.getSourceFile() === sf && ts.isVariableDeclarationList(decl.parent) && (decl.parent.flags & ts.NodeFlags.Const)) return origins(decl.initializer, sf, depth + 1);
    }
    return null;
  };
  for (const f of files) {
    const sf = prog.getSourceFile(f);
    if (!sf) continue;
    const support = lib.isTestSupport(f);
    const entry = editsByFile.get(f) ?? { f, edits: [], imports: new Map() };
    editsByFile.set(f, entry);
    // pass 1: a literal whose own contextual type is an owner it lacks the brand of
    const visit = (n) => {
      ts.forEachChild(n, visit);
      if (!ts.isObjectLiteralExpression(n)) return;
      const hits = hitsOf(checker.getContextualType(n), checker.getTypeAtLocation(n));
      if (!hits.length) return;
      if (hits.length > 1) { leftovers.ambiguous.push(`${rel(f)}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1} ${hits.map((h) => h.text).join('|')}`); return; }
      wrap(n, sf, f, entry, support, hits[0].text, hits[0].m, '');
    };
    visit(sf);
    // pass 2: a diagnostic on a value that is not a literal, built by literals somewhere upstream
    for (const { d } of list.filter((x) => x.f === f)) {
      if (![2322, 2345, 2739, 2740, 2741, 2769].includes(d.code)) continue;
      let node = sf;
      const descend = (x) => { for (const c of x.getChildren(sf)) if (c.getStart(sf) <= d.start && d.start + d.length <= c.end) { node = c; descend(c); return; } };
      descend(sf);
      let e = node;
      if (ts.isIdentifier(node) && ts.isVariableDeclaration(node.parent) && node.parent.name === node && node.parent.initializer) e = node.parent.initializer;
      else if (ts.isIdentifier(node) && ts.isPropertyAssignment(node.parent) && node.parent.name === node) e = node.parent.initializer;
      else while (e.parent && e.parent.getStart(sf) === e.getStart(sf) && e.parent.end === e.end && !ts.isExpressionStatement(e.parent)) e = e.parent;
      if (ts.isObjectLiteralExpression(e)) continue;
      const ctx0 = checker.getContextualType(e) ?? (ts.isIdentifier(node) && ts.isVariableDeclaration(node.parent) ? checker.getTypeAtLocation(node.parent.name) : undefined);
      if (!ctx0) continue;
      const ctx = checker.getNonNullableType(ctx0);
      const elem = checker.getIndexTypeOfType(ctx, ts.IndexKind.Number);
      const hits = hitsOf(elem && !brandTextsOf(checker, ctx).length ? elem : ctx0, null);
      if (hits.length !== 1) continue;
      const lits = origins(e, sf);
      if (!lits) continue;
      for (const lit of lits) if (hitsOf(checker.getContextualType(lit), checker.getTypeAtLocation(lit)).length === 0) wrap(lit, sf, f, entry, support, hits[0].text, hits[0].m, ' (upstream)');
    }
  }
  return count;
};
const applyRewrites = (editsByFile) => {
  let applied = 0;
  for (const { f, edits, imports } of editsByFile.values()) {
    const uniq = edits.filter((e, i) => edits.findIndex((o) => o.start === e.start && o.end === e.end) === i);
    const flat = uniq.filter((e) => !uniq.some((o) => o !== e && o.start <= e.start && o.end >= e.end && (o.start !== e.start || o.end !== e.end)));
    if (!flat.length) continue;
    let text = lib.applyEdits(overlay.get(f) ?? fs.readFileSync(f, 'utf8'), flat);
    const sf2 = lib.parse(f, text);
    const have = new Set();
    for (const st of sf2.statements) if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) for (const e of st.importClause.namedBindings.elements) have.add(e.name.text);
    const declared = new Set();
    for (const st of sf2.statements) if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name)) declared.add(d.name.text);
    const add = [...imports].filter(([nm]) => !have.has(nm) && !declared.has(nm) && text.includes(nm)).map(([nm, s]) => `import { ${nm} } from '${s}';`);
    if (add.length) {
      const last = [...sf2.statements].filter(ts.isImportDeclaration).pop();
      const at = last ? last.end : 0;
      text = text.slice(0, at) + (last ? '\n' : '') + add.join('\n') + (last ? '' : '\n') + text.slice(at);
      text = lib.mergeDuplicateImports(f, text);
    }
    overlay.set(f, text);
    applied += flat.length;
  }
  return applied;
};

const result = { census: { total: census.length, byPkg } };
let cur;
const rewritten = new Set();
const rounds = flag('no-rewrite') ? 0 : Number(arg('rounds') ?? 3);
for (let r = 0; r <= rounds; r++) {
  for (const k of Object.keys(leftovers)) leftovers[k] = [];
  const editsByFile = new Map();
  cur = measure((w, list, prog) => collectRewrites(prog, list, editsByFile));
  const s = summarize(cur);
  if (r === 0) { result.overlayOnly = s; console.log('OVERLAY ONLY', JSON.stringify(s)); }
  else console.log(`AFTER REWRITER round ${r}`, JSON.stringify(s));
  result.withRewriter = s;
  if (r === rounds) break;
  for (const [f, e] of editsByFile) if (e.edits.length) rewritten.add(f);
  const n = applyRewrites(editsByFile);
  log(`rewrite round ${r + 1}: ${n} edits applied`);
  if (!n) break;
}
const standing = [];
for (const [pk, v] of cur) for (const it of v.items) standing.push({ pkg: pk, where: it.where, text: `TS${it.code} ${it.msg}` });
const outDir = path.join(ROOT, 'tmp', 'phase34', 'b12-object-brand-fallout', 'out');
fs.mkdirSync(outDir, { recursive: true });
const lf = arg('leftovers') ? path.resolve(ROOT, arg('leftovers')) : path.join(outDir, 'leftovers.json');
fs.writeFileSync(lf, JSON.stringify({ ...result, rewrittenFiles: rewritten.size, leftovers, standing }, null, 1));
console.log('RESULT', JSON.stringify(result));
console.log('leftovers file', rel(lf), fs.statSync(lf).size, 'bytes; standing', standing.length, '; partial', leftovers.partial.length, '; incomplete', leftovers.incomplete.length, '; ambiguous', leftovers.ambiguous.length, '; noImport', leftovers.noImport.length, '; rewritten files', rewritten.size);
const sampleOut = arg('sample-out');
if (sampleOut) for (const [f, t] of overlay) { if (t === null) continue; const d = path.join(ROOT, sampleOut, rel(f)); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.writeFileSync(d, t); }
if (process.argv.includes('apply')) {
  let written = 0;
  for (const [f, t] of overlay) if (t !== null) { fs.writeFileSync(f, t); written++; }
  console.log(`applied ${written} files`);
}

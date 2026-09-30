// B17 C4 census and rewrite: every JSON.parse(..) / .json() in production code outside the gateway, classified by where
// the raw value goes next; the mechanical classes are rewritten on an overlay and typechecked.
// Usage: node .../census.cjs [--rewrite] [--sample-out=dir]
const fs = require('fs');
const path = require('path');
const lib = require('../../lib/repo.cjs');
const { typeIndex, pascal, camel } = require('../b14/census.cjs');
const { ts, ROOT, rel } = lib;
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const ws = lib.workspaces();
const doRewrite = process.argv.includes('--rewrite');

const isParseCall = (n) => ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && /^(parse|safeParse)$/u.test(n.expression.name.text) && /Contract$|contract/u.test(n.expression.expression.getText());
const sites = [];
for (const w of ws) {
  if (w.isGateway) continue;
  for (const f of lib.walk(path.join(w.dir, 'src'))) {
    if (lib.isTestSupport(f)) continue;
    const text = fs.readFileSync(f, 'utf8');
    if (!/JSON\.parse|\.json\(/u.test(text)) continue;
    const sf = lib.parse(f, text);
    const fileImports = new Map();
    for (const st of sf.statements) if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) for (const e of st.importClause.namedBindings.elements) fileImports.set(e.name.text, st.moduleSpecifier.text);
    const visit = (n) => {
      const isJsonParse = ts.isCallExpression(n) && n.expression.getText(sf) === 'JSON.parse';
      const isDotJson = ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'json' && n.arguments.length === 0;
      if (isJsonParse || isDotJson) {
        // climb through await / parens
        let cur = n;
        while (cur.parent && (ts.isAwaitExpression(cur.parent) || ts.isParenthesizedExpression(cur.parent))) cur = cur.parent;
        const p = cur.parent;
        let klass = 'other';
        const info = { file: f, pkg: w.name, sf, node: n, cur, text, fileImports, isJsonParse };
        if (p && ts.isCallExpression(p) && p.arguments[0] === cur && isParseCall(p)) klass = 'direct-parse';
        else if (p && (ts.isAsExpression(p) || ts.isTypeAssertionExpression?.(p)) && p.expression === cur) {
          const ty = p.type;
          info.castType = ty.getText(sf);
          klass = ty.kind === ts.SyntaxKind.UnknownKeyword ? 'cast-unknown' : 'cast-type';
          info.castNode = p;
          // `as unknown` followed by a var decl / parse?
          if (klass === 'cast-unknown' && p.parent && ts.isVariableDeclaration(p.parent)) { info.decl = p.parent; klass = 'var'; }
          else if (klass === 'cast-unknown') { info.outer = p; }
        } else if (p && ts.isVariableDeclaration(p) && p.initializer === cur) { info.decl = p; klass = 'var'; }
        else if (p && ts.isReturnStatement(p)) klass = 'return';
        else if (p && ts.isArrowFunction(p) && p.body === cur) klass = 'return';
        else if (p && ts.isPropertyAccessExpression(p)) klass = 'read-first';
        else if (p && ts.isCallExpression(p) && p.arguments.includes(cur)) klass = 'passed-to-call';
        if (klass === 'var') {
          const d = info.decl;
          if (ts.isIdentifier(d.name)) {
            // single-use analysis in the enclosing block / function
            const scope = (function up(x) { while (x && !ts.isBlock(x) && !ts.isSourceFile(x)) x = x.parent; return x; })(d);
            const uses = [];
            const v = (x) => { if (ts.isIdentifier(x) && x.text === d.name.text && x !== d.name && !(ts.isPropertyAccessExpression(x.parent) && x.parent.name === x) && !(ts.isPropertyAssignment(x.parent) && x.parent.name === x)) uses.push(x); ts.forEachChild(x, v); };
            ts.forEachChild(scope, v);
            info.uses = uses;
            if (uses.length === 1 && uses[0].parent && ts.isCallExpression(uses[0].parent) && uses[0].parent.arguments[0] === uses[0] && isParseCall(uses[0].parent)) klass = 'var-single-use-parse';
            else if (uses.length === 0) klass = 'var-unused';
            else if (uses.some((u) => u.parent && ts.isCallExpression(u.parent) && u.parent.arguments[0] === u && isParseCall(u.parent)) && uses.length > 1) klass = 'var-parse-plus-other-uses';
            else klass = 'var-other';
          } else klass = 'var-destructured';
        }
        sites.push({ ...info, klass });
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
}

const byKlass = {};
sites.forEach((s) => (byKlass[s.klass] = (byKlass[s.klass] ?? 0) + 1));
const files = new Set(sites.map((s) => s.file));
console.log(JSON.stringify({ sites: sites.length, files: files.size, jsonParse: sites.filter((s) => s.isJsonParse).length, dotJson: sites.filter((s) => !s.isJsonParse).length, byKlass }, null, 1));

// ---- rewrites ----
const rewrites = new Map(); // file -> edits
const addEdit = (f, e) => (rewrites.get(f) ?? rewrites.set(f, []).get(f)).push(e);
const stats = { inlined: 0, castToContract: 0, castNoContract: 0 };
const extraImports = new Map();
for (const s of sites) {
  const { sf, file } = s;
  if (s.klass === 'var-single-use-parse') {
    // const raw = JSON.parse(x);  ...  contract.parse(raw)   ->   contract.parse(JSON.parse(x))
    const use = s.uses[0];
    const stmt = s.decl.parent.parent; // VariableStatement
    if (!ts.isVariableStatement(stmt) || stmt.declarationList.declarations.length !== 1) continue;
    // statements between the decl and the use must not contain awaits or side effects that reorder: require decl and use in same block
    // and no other statement between them that calls anything (crude purity check)
    const block = stmt.parent;
    const useStmt = (function up(x) { while (x.parent !== block && x.parent) x = x.parent; return x; })(use);
    if (!ts.isBlock(block) && !ts.isSourceFile(block)) continue;
    const idxA = block.statements.indexOf(stmt);
    const idxB = block.statements.indexOf(useStmt);
    if (idxB < idxA) continue;
    const between = block.statements.slice(idxA + 1, idxB);
    if (between.some((b) => /\(|await/u.test(b.getText(sf)))) continue;
    const initText = s.cur.getText(sf); // JSON.parse(..) / await response.json()
    addEdit(file, { start: use.getStart(sf), end: use.end, text: initText });
    const ls = s.text.lastIndexOf('\n', stmt.getStart(sf)) + 1;
    const le = s.text.indexOf('\n', stmt.end);
    addEdit(file, { start: ls, end: le + 1, text: '' });
    stats.inlined++;
  } else if (s.klass === 'cast-type') {
    // JSON.parse(x) as T  ->  tContract.parse(JSON.parse(x)), when T is a contract type imported into the file
    const tn = s.castNode.type;
    if (!ts.isTypeReferenceNode(tn) || !s.fileImports.has(tn.typeName.getText(sf)) || !typeIndex.has(tn.typeName.getText(sf))) { stats.castNoContract++; continue; }
    const name = tn.typeName.getText(sf);
    const cands = typeIndex.get(name);
    const c = cands.find((x) => x.pkg === s.pkg) ?? (cands.length === 1 ? cands[0] : null);
    if (!c) { stats.castNoContract++; continue; }
    addEdit(file, { start: s.castNode.getStart(sf), end: s.castNode.end, text: `${c.contractConst}.parse(${s.cur.getText(sf)})` });
    // the contract value import: same specifier as the type import, add the const next to it
    (extraImports.get(file) ?? extraImports.set(file, new Set()).get(file)).add(`${c.contractConst}\0${s.fileImports.get(name)}`);
    stats.castToContract++;
  }
}
console.log('rewrite candidates', JSON.stringify(stats));

if (doRewrite) {
  const overlay = new Map();
  for (const [f, edits] of rewrites) {
    let text = fs.readFileSync(f, 'utf8');
    const sf = lib.parse(f, text);
    const extra = extraImports.get(f);
    if (extra) {
      const firstImport = sf.statements.find((x) => ts.isImportDeclaration(x));
      const anchor = firstImport ? firstImport.getStart(sf) : 0;
      const bySpec = new Map();
      for (const e of extra) { const [n, sp] = e.split('\0'); (bySpec.get(sp) ?? bySpec.set(sp, []).get(sp)).push(n); }
      edits.push({ start: anchor, end: anchor, text: [...bySpec].map(([sp, ns]) => `import { ${ns.join(', ')} } from '${sp}';\n`).join('') });
    }
    let out = lib.applyEdits(text, edits);
    out = lib.mergeDuplicateImports(f, out);
    // drop imports that became unused (type import of the cast type)
    const sf2 = lib.parse(f, out);
    const drop = [];
    for (const st of sf2.statements) {
      if (!ts.isImportDeclaration(st) || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings) || st.importClause.name) continue;
      const els = st.importClause.namedBindings.elements;
      const used = (nm) => { let hit = false; const v = (n) => { if (hit || ts.isImportDeclaration(n)) return; if (ts.isIdentifier(n) && n.text === nm) hit = true; ts.forEachChild(n, v); }; sf2.statements.forEach(v); return hit; };
      const keep = els.filter((e) => used(e.name.text));
      if (keep.length === els.length) continue;
      if (!keep.length) { const le = out.indexOf('\n', st.end); drop.push({ start: st.getStart(sf2), end: le === -1 ? st.end : le + 1, text: '' }); }
      else drop.push({ start: st.getStart(sf2), end: st.end, text: `import${st.importClause.isTypeOnly ? ' type' : ''} { ${keep.map((e) => e.getText(sf2)).join(', ')} } from ${st.moduleSpecifier.getText(sf2)};` });
    }
    overlay.set(f, lib.applyEdits(out, drop));
  }
  // typecheck per package
  const keyOf = (d) => `${d.code}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
  const byPkg = {};
  for (const f of overlay.keys()) (byPkg[lib.workspaceOf(f, ws).name] ??= []).push(f);
  let clean = 0;
  let newD = 0;
  const bad = [];
  for (const [pn, fl] of Object.entries(byPkg)) {
    const w = ws.find((x) => x.name === pn);
    const options = lib.packageCompilerOptions(w.dir);
    const base = lib.diagnosticsWithOverlay(fl, new Map(), options).diagnostics;
    const aft = lib.diagnosticsWithOverlay(fl, overlay, options).diagnostics;
    for (const f of fl) {
      const bk = new Set((base.get(f) ?? []).map(keyOf));
      const add = (aft.get(f) ?? []).filter((d) => !bk.has(keyOf(d)));
      if (!add.length) clean++;
      else { newD += add.length; bad.push([rel(f), ...add.slice(0, 2).map((d) => lib.formatDiagnostic(d).slice(0, 220))]); }
    }
  }
  console.log(JSON.stringify({ filesRewritten: overlay.size, filesWithZeroNewDiagnostics: clean, newDiagnostics: newD }));
  bad.slice(0, 12).forEach((b) => console.log(b.join('\n   ')));
  const out = arg('sample-out');
  if (out) for (const [f, t] of overlay) { const d = path.join(ROOT, out, rel(f)); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.writeFileSync(d, t); }
}
fs.mkdirSync(lib.outDir(__dirname), { recursive: true });
fs.writeFileSync(path.join(lib.outDir(__dirname), 'sites.json'), JSON.stringify(sites.map((s) => ({ file: rel(s.file), line: s.sf.getLineAndCharacterOfPosition(s.node.getStart(s.sf)).line + 1, klass: s.klass, text: s.cur.parent.getText(s.sf).slice(0, 120).replace(/\s+/g, ' ') })), null, 1));

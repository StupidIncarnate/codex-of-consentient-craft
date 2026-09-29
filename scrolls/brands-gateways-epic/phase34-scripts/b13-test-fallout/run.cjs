// B13 test-side fallout (SD12). After R8's autofix retypes a parameter (or a harness method's destructured
// parameter) from `string` to `Owner['id']`, every call site that hands it a plain string breaks. This script
// applies the retype (feasibility/b13, --tests scope) on an in-memory overlay, then repairs each new
// `Type 'string' is not assignable to type 'string & $brand<"X">'` at an object-literal property:
//   String(x)            -> x                     when x is already that brand (the String() only existed to feed a string parameter)
//   'literal'            -> XStub({ value: 'literal' })   when the contract accepts the literal
//   const K = 'literal'  -> const K = XStub({ value: 'literal' })   (declaration, so every use is fixed at once)
//   other string expr    -> XStub({ value: expr })
//   { x }                -> { x: XStub({ value: x }) }   when x is not a literal const
// A round's edits to a file are reverted when the file ends the round with MORE diagnostics than it began it with.
// Everything else goes to leftovers.txt. Nothing under packages/ is written; --sample-out writes final texts.
// Usage: node tmp/phase34/b13-test-fallout/run.cjs [--pkgs=a,b] [--sample-out=dir] [--leftovers=file]
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');
const { ts, ROOT, rel } = lib;
const { loadRetype, buildOverlay } = require('./retype-overlay.cjs');
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const onlyPkgs = arg('pkgs')?.split(',');
const MAX_ROUNDS = 4;

const ws = lib.workspaces();
const retype = loadRetype({ tests: true });
const { overlay: retypeOverlay, kept } = buildOverlay({ candidates: retype.candidates, barrelExports: retype.barrelExports });

// brand -> stub: every `export const XStub` in a non-gateway workspace whose contract chain ends `.brand<'X'>()`.
const stubs = new Map();
for (const w of ws) {
  if (w.isGateway) continue;
  for (const f of lib.walk(path.join(w.dir, 'src')).filter((x) => /\.stub\.tsx?$/u.test(x))) {
    const text = fs.readFileSync(f, 'utf8');
    const m = /export const (\w+)Stub = \(\s*\{ value \}: \{ value: string \}/u.exec(text);
    if (!m) continue;
    const contractFile = f.replace(/\.stub\.tsx?$/u, '-contract.ts');
    if (!fs.existsSync(contractFile)) continue;
    const c = fs.readFileSync(contractFile, 'utf8');
    const cm = /export const \w+ = (z\.[^;]*?)\.brand<'(\w+)'>\(\)/su.exec(c);
    if (!cm || cm[2] !== m[1] || !/^z\.(string|uuid)\(/u.test(cm[1])) continue;
    stubs.set(m[1], { name: `${m[1]}Stub`, file: f, pkg: w, uuid: /uuid\(/u.test(cm[1]), chain: cm[1].replace(/\s+/gu, '') });
  }
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^0{8}-0{4}-0{4}-0{4}-0{12}$/iu;
const literalOk = (stub, lit) => (stub.uuid ? UUID.test(lit) : lit.length > 0);
const resolver = lib.makeResolver();
const reach = (w) => new Set([w.name, ...Object.keys(w.packageJson.dependencies ?? {}), ...Object.keys(w.packageJson.devDependencies ?? {})]);
const barrelHas = (pkg, name) => {
  const b = path.join(pkg.dir, 'src/contracts/contracts.ts');
  const legacy = path.join(pkg.dir, 'contracts.ts');
  const f = fs.existsSync(b) ? b : fs.existsSync(legacy) ? legacy : null;
  return f ? !!lib.findDeclaringFile(f, name, resolver) : false;
};
const specFor = (stub, fromFile, fromPkg) => {
  if (stub.pkg.name === fromPkg.name) {
    let r = path.relative(path.dirname(fromFile), stub.file.replace(/\.tsx?$/u, ''));
    if (!r.startsWith('.')) r = './' + r;
    return r.split(path.sep).join('/');
  }
  if (!reach(fromPkg).has(stub.pkg.name)) return null;
  return barrelHas(stub.pkg, stub.name) ? `${stub.pkg.name}/contracts` : null;
};

const key = (d) => `${d.code}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
const live = new Map(); // shared by every package's service: the retype overlay, then our edits
for (const [f, text] of retypeOverlay) live.set(f, { v: 1, text });
const setLive = (f, text) => live.set(f, { v: (live.get(f)?.v ?? 0) + 1, text });
const currentText = (f) => live.get(f)?.text ?? fs.readFileSync(f, 'utf8');

const edited = new Set([...retypeOverlay.keys()].map((f) => lib.workspaceOf(f, ws).name));
const target = ws.filter((w) => !w.isGateway && !(onlyPkgs && !onlyPkgs.includes(w.short)) && (edited.has(w.name) || Object.keys({ ...w.packageJson.dependencies, ...w.packageJson.devDependencies }).some((d) => edited.has(d))));

const leftovers = [];
const counts = {}; // pkg -> { retype, final }
const touched = new Set();

const newDiags = (svc, base, files) => {
  const out = [];
  for (const f of files) {
    const bk = new Set(base.service.getSemanticDiagnostics(f).map(key));
    for (const d of [...svc.service.getSemanticDiagnostics(f), ...svc.service.getSyntacticDiagnostics(f)]) if (!bk.has(key(d))) out.push({ f, d });
  }
  return out;
};

const stringDiag = /Type 'string' is not assignable to type 'string & \$brand<"(\w+)">'/u;

for (const w of target) {
  const svc = lib.makeLanguageService(w.dir, live);
  const base = lib.makeLanguageService(w.dir, new Map());
  const files = svc.service.getProgram().getSourceFiles().map((s) => path.resolve(s.fileName)).filter((f) => f.startsWith(w.dir + path.sep) && !f.includes('/node_modules/') && !f.includes('/dist/'));
  let pool = files;
  let round = 0;
  let list = newDiags(svc, base, pool);
  counts[w.short] = { retype: list.length };
  pool = [...new Set(list.map((x) => x.f))];
  console.error(`${w.short}: ${files.length} files, ${list.length} new diagnostics after retype`);
  const declined = new Map(); // `${file}:${start}` -> reason, sticky across rounds
  while (list.length && round < MAX_ROUNDS) {
    round++;
    const before = new Map();
    for (const f of pool) before.set(f, list.filter((x) => x.f === f).length);
    const checker = svc.service.getProgram().getTypeChecker();
    const byFile = new Map();
    for (const { f, d } of list) (byFile.get(f) ?? byFile.set(f, []).get(f)).push(d);
    const prevText = new Map();
    for (const [f, ds] of byFile) {
      const text = currentText(f);
      const sf = svc.service.getProgram().getSourceFile(f);
      if (!sf || sf.text !== text) continue;
      const edits = [];
      const needImports = new Map();
      const seenStart = new Set();
      const decline = (d, why, node) => {
        declined.set(`${f}:${d.start}`, { f, line: sf.getLineAndCharacterOfPosition(d.start).line + 1, why, text: node ? node.getText(sf).replace(/\s+/gu, ' ').slice(0, 70) : '', msg: ts.flattenDiagnosticMessageText(d.messageText, ' ').slice(0, 90) });
      };
      const imports = new Map();
      for (const st of sf.statements) if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) for (const e of st.importClause.namedBindings.elements) imports.set(e.name.text, st.moduleSpecifier.text);
      const wrap = (stub, inner, d, node) => {
        const spec = specFor(stub, f, w);
        if (!spec) return decline(d, `stub ${stub.name} unreachable from ${w.short}`, node), null;
        if (imports.has(stub.name) && imports.get(stub.name) !== spec) return decline(d, `${stub.name} imported from ${imports.get(stub.name)}`, node), null;
        if (!imports.has(stub.name)) needImports.set(stub.name, spec);
        return `${stub.name}({ value: ${inner} })`;
      };
      for (const d of ds) {
        if (d.code !== 2322 || d.start === undefined) continue;
        const m = stringDiag.exec(ts.flattenDiagnosticMessageText(d.messageText, ' '));
        const find = (n) => ts.forEachChild(n, (c) => (d.start >= c.getStart(sf) && d.start < c.end ? find(c) : undefined)) ?? n;
        const nameNode = find(sf);
        const prop = nameNode.parent;
        if (!m) { decline(d, 'not a plain-string-to-brand mismatch', nameNode); continue; }
        if (!ts.isPropertyAssignment(prop) && !ts.isShorthandPropertyAssignment(prop)) { decline(d, `error node is ${ts.SyntaxKind[prop.kind]}, not an object-literal property`, nameNode); continue; }
        const brand = m[1];
        const stub = stubs.get(brand);
        const shorthand = ts.isShorthandPropertyAssignment(prop);
        let expr = shorthand ? prop.name : prop.initializer;
        const target_ = brand;
        const isBrandType = (t) => { const s = checker.typeToString(t); return s === target_ || s.includes(`$brand<"${brand}">`); };
        // String(x): x already holds the brand
        if (!shorthand && ts.isCallExpression(expr) && expr.expression.getText(sf) === 'String' && expr.arguments.length === 1) {
          const inner = expr.arguments[0];
          const it = checker.getTypeAtLocation(inner);
          if (isBrandType(it)) { edits.push({ start: expr.getStart(sf), end: expr.end, text: inner.getText(sf) }); continue; }
          expr = inner; // wrap the inner, dropping the String()
          if (!stub) { decline(d, `no stub for brand ${brand}`, prop); continue; }
          const w2 = wrap(stub, inner.getText(sf), d, prop);
          if (w2) edits.push({ start: prop.initializer.getStart(sf), end: prop.initializer.end, text: w2 });
          continue;
        }
        if (!stub) { decline(d, `no stub for brand ${brand}`, prop); continue; }
        const isLit = ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr);
        if (isLit) {
          if (!literalOk(stub, expr.text)) { decline(d, `literal is not valid for ${brand} (${stub.uuid ? 'uuid' : stub.chain})`, prop); continue; }
          const w2 = wrap(stub, expr.getText(sf), d, prop);
          if (w2) edits.push({ start: expr.getStart(sf), end: expr.end, text: w2 });
          continue;
        }
        if (ts.isIdentifier(expr)) {
          let sym = checker.getSymbolAtLocation(expr);
          if (sym && sym.flags & ts.SymbolFlags.ShorthandPropertyAssignment) sym = checker.getShorthandAssignmentValueSymbol(prop);
          const decl = sym?.valueDeclaration;
          if (decl && ts.isVariableDeclaration(decl) && decl.getSourceFile() === sf && !decl.type && decl.initializer && (ts.isStringLiteral(decl.initializer) || ts.isNoSubstitutionTemplateLiteral(decl.initializer)) && ts.isVariableDeclarationList(decl.parent) && decl.parent.flags & ts.NodeFlags.Const) {
            if (!literalOk(stub, decl.initializer.text)) { decline(d, `const literal is not valid for ${brand} (${stub.uuid ? 'uuid' : stub.chain})`, prop); continue; }
            if (seenStart.has(decl.initializer.getStart(sf))) continue;
            seenStart.add(decl.initializer.getStart(sf));
            const w2 = wrap(stub, decl.initializer.getText(sf), d, prop);
            if (w2) edits.push({ start: decl.initializer.getStart(sf), end: decl.initializer.end, text: w2 });
            continue;
          }
        }
        // any other expression must be a plain string to wrap
        const et = checker.getTypeAtLocation(expr);
        if (!(et.flags & ts.TypeFlags.StringLike) && !(et.flags & ts.TypeFlags.Any)) { decline(d, `expression type is ${checker.typeToString(et)}, not string`, prop); continue; }
        const w2 = wrap(stub, expr.getText(sf), d, prop);
        if (!w2) continue;
        if (shorthand) edits.push({ start: prop.getStart(sf), end: prop.end, text: `${prop.name.text}: ${w2}` });
        else edits.push({ start: expr.getStart(sf), end: expr.end, text: w2 });
      }
      // drop edits nested inside another edit
      edits.sort((a, b) => a.start - b.start || b.end - a.end);
      const flat = [];
      for (const e of edits) if (!flat.some((x) => e.start >= x.start && e.end <= x.end && x !== e)) flat.push(e);
      const uniq = flat.filter((e, i) => !flat.slice(0, i).some((x) => x.start === e.start));
      if (!uniq.length) continue;
      const firstImport = sf.statements.find((s) => ts.isImportDeclaration(s));
      const anchor = firstImport ? firstImport.getStart(sf) : 0;
      const importLines = [...needImports].map(([n, s]) => `import { ${n} } from '${s}';`).join('\n');
      if (importLines) uniq.push({ start: anchor, end: anchor, text: importLines + '\n' });
      prevText.set(f, text);
      setLive(f, lib.mergeDuplicateImports(f, lib.applyEdits(text, uniq)));
      touched.add(f);
    }
    if (!prevText.size) break;
    const after = newDiags(svc, base, pool);
    // revert files that gained diagnostics
    let reverted = 0;
    for (const [f, t] of prevText) {
      const n = after.filter((x) => x.f === f).length;
      if (n > before.get(f)) { setLive(f, t); reverted++; for (const k of [...declined.keys()]) if (k.startsWith(f + ':')) {} declined.set(`${f}:gate`, { f, line: 0, why: `edits reverted: file went from ${before.get(f)} to ${n} diagnostics`, text: '', msg: '' }); }
    }
    list = reverted ? newDiags(svc, base, pool) : after;
    console.error(`  round ${round}: ${list.length} left${reverted ? ` (${reverted} files reverted)` : ''}`);
    if (list.length === [...before.values()].reduce((a, b) => a + b, 0)) break;
    pool = [...new Set(list.map((x) => x.f))];
  }
  counts[w.short].final = list.length;
  for (const { f, d } of list) {
    const sf = d.file;
    const line = sf ? sf.getLineAndCharacterOfPosition(d.start ?? 0).line + 1 : 0;
    const hit = declined.get(`${f}:${d.start}`);
    leftovers.push({ pkg: w.short, file: rel(f), line, code: d.code, why: hit?.why ?? 'still failing after the last round (edit did not help or was reverted)', text: hit?.text ?? '', msg: ts.flattenDiagnosticMessageText(d.messageText, ' ').replace(/\s+/gu, ' ').slice(0, 100) });
  }
}

// report
let a = 0, b = 0;
console.log('pkg'.padEnd(18), 'retype only', 'retype + script');
for (const [p, c] of Object.entries(counts)) { if (!c.retype && !c.final) continue; console.log(p.padEnd(18), String(c.retype).padStart(11), String(c.final ?? c.retype).padStart(15)); a += c.retype; b += c.final ?? c.retype; }
console.log('total'.padEnd(18), String(a).padStart(11), String(b).padStart(15));
const byWhy = {};
for (const l of leftovers) { const k = l.why.replace(/\d+/gu, 'N'); byWhy[k] = (byWhy[k] ?? 0) + 1; }
console.log('leftover reasons', JSON.stringify(Object.entries(byWhy).sort((x, y) => y[1] - x[1]), null, 0));
const outDir = path.join(__dirname, 'out');
fs.mkdirSync(outDir, { recursive: true });
const lo = arg('leftovers') ?? path.join(outDir, 'leftovers.txt');
leftovers.sort((x, y) => x.pkg.localeCompare(y.pkg) || x.file.localeCompare(y.file) || x.line - y.line);
fs.writeFileSync(lo, `# B13 test-fallout leftovers: diagnostics that remain after the retype overlay plus this script's edits.\n# One line per diagnostic: pkg file:line | reason | source text\n` + leftovers.map((l) => `${l.pkg} ${l.file}:${l.line} | ${l.why} | ${l.text || l.msg}`).join('\n') + '\n');
console.log(`leftovers ${leftovers.length} -> ${rel(lo)}`);
const so = arg('sample-out');
if (so) {
  const files = new Set([...retypeOverlay.keys(), ...touched]);
  for (const f of files) { const d = path.join(ROOT, so, rel(f)); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.writeFileSync(d, currentText(f)); }
  console.log(`sample-out: ${files.size} files (${retypeOverlay.size} from the retype, ${touched.size} edited by the script) in ${so}`);
}

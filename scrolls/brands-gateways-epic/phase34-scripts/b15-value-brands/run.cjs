// SD4, wave W5: make ONE standalone value brand (errorMessage, filePath, ...) a derived inline brand per object field.
//
// Step 1, the retype (overlay only):
//   `key: C` (also `C.optional()`, `z.array(C)`) in an object contract becomes `z.string()....brand<'OwnerKey'>()`, the text
//   derived by B3 (owner const minus `Contract`, plus each key on the path, PascalCase); loose type refs `T` become `string`
//   or `number`; `C.parse(x)` becomes `x`; `TStub({ value: x })` becomes `x`; the contract, stub, contract test and barrel
//   lines are removed on the overlay.
// Step 2, the rewriter ("build through the root parse"), driven by the typechecker's new diagnostics:
//   a plain value going into a derived-brand field of an object literal wraps the ROOT literal in `ownerContract.parse(...)`
//   (`OwnerStub(...)` in test support), when the literal is a complete owner value; otherwise, for a depth-1 field in
//   production code, the field's value becomes `ownerContract.shape.key.parse(value)`. Anything else goes to leftovers.
//
// Standalone contracts sharing the const name and brand text (the filePath copies in six packages) are one brand to the type
// system and are retyped together; `--no-group` keeps to the one file named. A field's own brand text may be shared by
// sibling inline brands (`ErrorMessage` on ward's error entry): those are re-derived too, so every text is unique and a value
// carries one owner. The leftovers file is JSON: the rewriter's skips (with reasons), what still names the brand, and every
// diagnostic still standing.
//
// Usage (from the repo root, or pass --root=DIR; settings in lib/port-config.cjs):
//   node scrolls/brands-gateways-epic/phase34-scripts/b15-value-brands/run.cjs --brand=errorMessageContract --file=packages/shared/src/contracts/error-message/error-message-contract.ts
//     [--no-rewrite] [--rounds=3] [--pkgs=a,b] [--sample-out=dir] [--leftovers=file]
// A dry run: nothing under packages/ is written and nothing is deleted. --sample-out writes the changed files as copies at
// their repo paths (prove them with lib/verify-sample.cjs).
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');
const { ts, ROOT, rel } = lib;
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const flag = (n) => process.argv.includes(`--${n}`);
const ws = lib.workspaces();
const resolver = lib.makeResolver();
const t0 = Date.now();
const log = (...a) => console.error(`[${Math.round((Date.now() - t0) / 1000)}s]`, ...a);

// ---------- locate the brand ----------
// Standalone contracts that share a const name AND a brand text are one brand to the type system (the text is what is
// compared), so a value typed by one flows into a field typed by another. They are retyped together, or the copies left
// behind reject the plain values the retype produces. `--no-group` keeps to the one file named.
const brandName = arg('brand');
const loadDef = (contractFile) => {
  const csf = lib.parse(contractFile);
  let initText = null;
  let typeName = null;
  for (const st of csf.statements) {
    if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name) && d.name.text === brandName) initText = d.initializer.getText(csf);
    if (ts.isTypeAliasDeclaration(st) && st.type.getText(csf).includes(`typeof ${brandName}`)) typeName = st.name.text;
  }
  if (!initText) return null;
  const kind = /^z\s*\.\s*number/u.test(initText) ? 'number' : 'string';
  const baseSchema = initText.replace(/\s+/gu, ' ').replace(/\s*\.brand<[^>]*>\(\)\s*$/u, '').replace(/ (?=\.)/gu, '').trim();
  const stubBase = path.basename(contractFile).replace(/-contract\.ts$/u, '');
  const stubFile = path.join(path.dirname(contractFile), `${stubBase}.stub.ts`);
  const testFile = contractFile.replace(/\.ts$/u, '.test.ts');
  let stubDefault = null;
  if (fs.existsSync(stubFile)) {
    const st = fs.readFileSync(stubFile, 'utf8');
    const m = /value(?:\s*=\s*|:\s*)('[^'\n]*'|"[^"\n]*"|-?\d+(?:\.\d+)?)/u.exec(st.replace(/value:\s*(string|number)/gu, ''));
    stubDefault = m ? m[1] : null;
  }
  // The base schema may name other contracts (a union of two brands) or zod's own methods only. Every such name must be an
  // import of the standalone contract's file, so the contract files that inline it can import the same thing.
  const stripped = baseSchema.replace(/\/(?:[^/\\\n]|\\.)+\/[a-z]*/gu, '').replace(/'[^']*'|"[^"]*"/gu, '');
  const baseIds = [...new Set([...stripped.matchAll(/(^|[^.\w$])([A-Za-z_$][\w$]*)/gu)].map((m) => m[2]).filter((n) => n !== 'z'))];
  const baseImportFiles = new Map();
  for (const id of baseIds) {
    for (const st of csf.statements) {
      if (!ts.isImportDeclaration(st) || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings)) continue;
      for (const e of st.importClause.namedBindings.elements) {
        if (e.name.text !== id) continue;
        const r = resolver(st.moduleSpecifier.text, contractFile);
        const d = r && lib.findDeclaringFile(r, (e.propertyName ?? e.name).text, resolver);
        if (d) baseImportFiles.set(id, d.file);
      }
    }
  }
  return {
    contractFile, typeName, kind, baseSchema, stubBase, stubFile, testFile, stubDefault, baseIds, baseImportFiles,
    inlineOk: baseIds.every((id) => baseImportFiles.has(id)),
    standaloneText: /\.brand<\s*['"]([^'"]+)['"]\s*>/u.exec(initText)?.[1],
  };
};
let firstFile = arg('file') ? path.resolve(ROOT, arg('file')) : null;
const candidateFiles = [];
for (const w of ws) if (!w.isGateway) for (const f of lib.walk(path.join(w.dir, 'src'))) if (/-contract\.ts$/u.test(f) && new RegExp(`export const ${brandName}\\b`, 'u').test(fs.readFileSync(f, 'utf8'))) candidateFiles.push(f);
if (!firstFile) {
  if (candidateFiles.length !== 1) throw new Error(`brand ${brandName} found in ${candidateFiles.length} files; pass --file`);
  firstFile = candidateFiles[0];
}
const def0 = loadDef(firstFile);
const defs = [def0];
if (!flag('no-group')) for (const f of candidateFiles) if (f !== firstFile) { const d = loadDef(f); if (d && d.standaloneText === def0.standaloneText && d.typeName === def0.typeName) defs.push(d); }
const { typeName, standaloneText } = def0;
const brandFiles = new Set(defs.flatMap((d) => [d.contractFile, d.stubFile, d.testFile]));
const stubName = `${typeName}Stub`;
const contractFile = firstFile;
log(JSON.stringify({ brandName, typeName, copies: defs.map((d) => ({ file: rel(d.contractFile), kind: d.kind, baseSchema: d.baseSchema, stubDefault: d.stubDefault, inlineOk: d.inlineOk })) }));

// ---------- gather users ----------
const all = [];
for (const w of ws) if (!w.isGateway) for (const d of ['src', 'test', 'e2e']) for (const f of lib.walk(path.join(w.dir, d))) all.push(f);
for (const w of ws) if (!w.isGateway) for (const e of fs.readdirSync(w.dir)) if (/^[a-z-]+\.ts$/u.test(e) && !e.endsWith('.d.ts')) all.push(path.join(w.dir, e));
const wordRe = new RegExp(`\\b(${brandName}|${typeName}|${stubName})\\b|brand<\\s*['"]${standaloneText}['"]\\s*>`, 'u');
const users = all.filter((f) => !brandFiles.has(f) && wordRe.test(fs.readFileSync(f, 'utf8')));

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
const pascal = (s) => s.replace(/(^|[_\-\s]+)([a-zA-Z0-9])/gu, (_, __, c) => c.toUpperCase());

// ---------- step 1: the retype ----------
const stats = { userFiles: users.length, typeRefs: 0, parseCalls: 0, stubValue: 0, stubDefault: 0, fieldInline: 0, siblingBrands: 0 };
const leftovers = { fieldNotInObject: [], notInlineable: [], remainingRefs: [], stubOther: [], rewriter: [] };
const fieldNeeds = new Map(); // file -> Map(name -> declaring file) the inlined base schema needs imported
const owners = new Map(); // derived brand text -> { ownerConst, ownerFile, keys }
const needParen = (n) => ts.isBinaryExpression(n) || ts.isConditionalExpression(n) || ts.isArrowFunction(n) || ts.isAsExpression(n) || ts.isAwaitExpression(n);
const isObjectCtor = (call) => {
  const t = call.expression.getText();
  return /(^|\.)(object|strictObject|looseObject|extend|merge|safeExtend)$/u.test(t) && !/^(Object)\./u.test(t);
};

// The property assignment holding `node`, inside a z.object(...) call, inside the const naming the owner.
const describeField = (node, sf) => {
  let prop = null;
  let objCall = null;
  let decl = null;
  const keys = [];
  for (let p = node.parent; p; p = p.parent) {
    if (ts.isPropertyAssignment(p) && !prop) { prop = p; keys.push(p.name.getText(sf).replace(/['"]/gu, '')); continue; }
    if (ts.isPropertyAssignment(p) && prop && objCall) keys.push(p.name.getText(sf).replace(/['"]/gu, ''));
    if (ts.isCallExpression(p) && prop && isObjectCtor(p)) objCall = p;
    if (ts.isVariableDeclaration(p)) { decl = p; break; }
    if (ts.isFunctionLike(p) && !objCall) break;
  }
  if (!prop || !objCall || !decl || !ts.isIdentifier(decl.name)) return null;
  const ownerConst = decl.name.text;
  const path_ = keys.reverse();
  return { text: pascal(ownerConst.replace(/Contract$/u, '')) + path_.map(pascal).join(''), ownerConst, ownerFile: path.resolve(sf.fileName), keys: path_ };
};

const collectFor = (f, text) => {
  const sf = lib.parse(f, text);
  const local = { C: declaringFileOf(f, sf, brandName), T: declaringFileOf(f, sf, typeName), S: declaringFileOf(f, sf, stubName) };
  const defOf = (file, key) => defs.find((d) => sameFile(d[key], file));
  const isC = (id) => id.text === brandName && defOf(local.C, 'contractFile');
  const isT = (id) => id.text === typeName && defOf(local.T, 'contractFile');
  const isS = (id) => id.text === stubName && defOf(local.S, 'stubFile');
  const cands = [];
  const add = (n, start, end, newText, kindName) => cands.push({ start, end, text: newText, kindName });
  const visit = (n) => {
    if (ts.isImportDeclaration(n)) return;
    if (ts.isTypeReferenceNode(n) && ts.isIdentifier(n.typeName) && isT(n.typeName)) add(n, n.getStart(sf), n.end, isT(n.typeName).kind, 'type');
    else if (ts.isTypeReferenceNode(n) && ts.isIdentifier(n.typeName) && n.typeName.text === 'ReturnType' && n.typeArguments?.length === 1 && ts.isTypeQueryNode(n.typeArguments[0]) && ts.isIdentifier(n.typeArguments[0].exprName) && isS(n.typeArguments[0].exprName)) add(n, n.getStart(sf), n.end, isS(n.typeArguments[0].exprName).kind, 'type');
    else if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && ts.isIdentifier(n.expression.expression) && isC(n.expression.expression) && n.expression.name.text === 'parse' && n.arguments.length === 1) {
      const a = n.arguments[0];
      add(n, n.getStart(sf), n.end, needParen(a) ? `(${a.getText(sf)})` : a.getText(sf), 'parse');
      n.arguments.forEach(visit);
      return;
    } else if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && isS(n.expression)) {
      const a = n.arguments[0];
      if (!a) {
        if (isS(n.expression).stubDefault) add(n, n.getStart(sf), n.end, isS(n.expression).stubDefault, 'stub-default');
      } else if (ts.isObjectLiteralExpression(a) && a.properties.length === 1 && ts.isPropertyAssignment(a.properties[0]) && a.properties[0].name.getText(sf) === 'value') {
        const v = a.properties[0].initializer;
        add(n, n.getStart(sf), n.end, needParen(v) ? `(${v.getText(sf)})` : v.getText(sf), 'stub-value');
      }
    } else if (ts.isIdentifier(n) && isC(n)) {
      const info = describeField(n, sf);
      const dd = isC(n);
      const line = `${rel(f)}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`;
      if (!info) leftovers.fieldNotInObject.push(line);
      else if (!dd.inlineOk) leftovers.notInlineable.push(line);
      else {
        owners.set(info.text, info);
        if (dd.baseIds.length) { const m = fieldNeeds.get(f) ?? new Map(); for (const id of dd.baseIds) m.set(id, dd.baseImportFiles.get(id)); fieldNeeds.set(f, m); }
        add(n, n.getStart(sf), n.end, `${dd.baseSchema}.brand<'${info.text}'>()`, 'field-inline');
      }
    } else if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'brand' && n.typeArguments?.length === 1 && ts.isLiteralTypeNode(n.typeArguments[0]) && n.typeArguments[0].literal.text === standaloneText && n.parent && !(ts.isPropertyAccessExpression(n.parent) && n.parent.name.text === 'brand')) {
      // an inline brand that shares the standalone brand's text: its field is the same brand today, so it is re-derived too
      const info = describeField(n, sf);
      if (info) {
        owners.set(info.text, info);
        add(n.typeArguments[0], n.typeArguments[0].getStart(sf), n.typeArguments[0].end, `'${info.text}'`, 'sibling-brand');
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  const flat = cands.filter((c) => !cands.some((o) => o !== c && o.start >= c.start && o.end <= c.end && !(o.start === c.start && o.end === c.end)));
  return { sf, cands: flat };
};

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
const kindStat = { type: 'typeRefs', parse: 'parseCalls', 'stub-value': 'stubValue', 'stub-default': 'stubDefault', 'field-inline': 'fieldInline', 'sibling-brand': 'siblingBrands' };
for (const f of users) {
  let text = fs.readFileSync(f, 'utf8');
  let any = false;
  for (let round = 0; round < 6; round++) {
    const { cands } = collectFor(f, text);
    if (!cands.length) break;
    for (const c of cands) stats[kindStat[c.kindName]]++;
    text = lib.applyEdits(text, cands);
    any = true;
  }
  if (any) overlay.set(f, importDropEdits(f, text));
}
// contract files that hold field uses but are not users of the word list
const removed = [...brandFiles].filter((f) => fs.existsSync(f));
for (const f of removed) overlay.set(f, null);
for (const f of all) {
  if (overlay.get(f) === null) continue;
  const t0_ = overlay.get(f) ?? fs.readFileSync(f, 'utf8');
  const bases = defs.map((d) => d.stubBase).filter((s) => t0_.includes(s));
  if (!bases.length || !/\/(contracts|testing|index|[a-z-]+)\.ts$/u.test(f)) continue;
  const lines = t0_.split('\n');
  const isBrandLine = (l) => {
    const m = /^\s*export\s.*from\s+['"]([^'"]+)['"]/u.exec(l);
    return !!m && m[1].startsWith('.') && brandFiles.has(`${path.resolve(path.dirname(f), m[1])}.ts`);
  };
  const keep = lines.filter((l) => !isBrandLine(l));
  if (keep.length !== lines.length) overlay.set(f, keep.join('\n'));
}
// what still names the brand
for (const [f, t] of overlay) {
  if (t === null) continue;
  const sf = lib.parse(f, t);
  // a local `type T = string` left by the retype names nothing that needs a hand edit
  const localAlias = sf.statements.some((st) => ts.isTypeAliasDeclaration(st) && st.name.text === typeName && /^(string|number)$/u.test(st.type.getText(sf)));
  const v = (n) => {
    if (ts.isImportDeclaration(n)) return;
    if (ts.isIdentifier(n) && localAlias && n.text === typeName) return;
    if (ts.isIdentifier(n) && [brandName, typeName, stubName].includes(n.text) && !(ts.isPropertyAssignment(n.parent) && n.parent.name === n)) leftovers.remainingRefs.push(`${rel(f)}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1} ${n.text} ${n.parent.getText(sf).slice(0, 80).replace(/\s+/gu, ' ')}`);
    ts.forEachChild(n, v);
  };
  sf.statements.forEach(v);
}
log('retype', JSON.stringify(stats), 'owners', owners.size, 'files', overlay.size);

// ---------- step 2 support: typecheck ----------
const keyOf = (d) => `${d.code}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
const touchedPkgs = new Set([...overlay.keys()].map((f) => lib.workspaceOf(f, ws).name));
let target = ws.filter((w) => !w.isGateway && (touchedPkgs.has(w.name) || Object.keys({ ...w.packageJson.dependencies, ...w.packageJson.devDependencies }).some((d) => touchedPkgs.has(d))));
if (arg('pkgs')) target = target.filter((w) => arg('pkgs').split(',').includes(w.short));
const baseByPkg = new Map();
const baseOf = (w) => {
  if (!baseByPkg.has(w.name)) {
    const files = lib.walk(w.dir).filter((f) => !f.includes('/dist/'));
    const options = lib.packageCompilerOptions(w.dir);
    const b = lib.diagnosticsWithOverlay(files, new Map(), options).diagnostics;
    const m = new Map();
    for (const [f, ds] of b) m.set(f, new Set((ds ?? []).map(keyOf)));
    baseByPkg.set(w.name, m);
    log('base', w.short);
  }
  return baseByPkg.get(w.name);
};
// new diagnostics per package under the current overlay. `handler(w, list, program)` runs while the program is alive;
// only plain data is kept, so the heap stays small.
const measure = (handler, pkgs = target) => {
  const res = new Map();
  for (const w of pkgs) {
    const base = baseOf(w);
    const files = lib.walk(w.dir).filter((f) => !f.includes('/dist/') && overlay.get(f) !== null);
    const options = lib.packageCompilerOptions(w.dir);
    const r = lib.diagnosticsWithOverlay(files, overlay, options);
    const list = [];
    for (const f of files) for (const d of r.diagnostics.get(f) ?? []) if (!(base.get(f) ?? new Set()).has(keyOf(d))) list.push({ f, d });
    handler?.(w, list, r.program);
    res.set(w.short, {
      count: list.length,
      items: list.map(({ f, d }) => ({ where: `${rel(f)}:${d.file ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : 0}`, code: d.code, msg: ts.flattenDiagnosticMessageText(d.messageText, ' ') })),
    });
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
    for (const it of v.items) {
      const key = `TS${it.code} ${it.msg.slice(0, 70).replace(/'[^']*'|"[^"]*"/gu, 'X')}`;
      kinds[key] = (kinds[key] ?? 0) + 1;
    }
  }
  return { total, per, kinds: Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 8) };
};

const result = { brand: brandName, stats };
let cur;

// ---------- step 2: the rewriter ----------
const brandsIn = (msg) => [...msg.matchAll(/(?:BRAND|\$brand)<["']([^"']+)["']>/gu)].map((m) => m[1]);
// the brand the value must carry: the first one after "is not assignable to"
const targetBrandOf = (msg) => {
  const i = msg.search(/is not assignable to (?:type|parameter of type)/u);
  const tail = i === -1 ? msg : msg.slice(i);
  return brandsIn(tail)[0];
};
const known = (b) => owners.has(b) || b === standaloneText;
const ownerTypeNameOf = (prog, ownerFile, ownerConst) => {
  const sf = prog.getSourceFile(ownerFile);
  if (!sf) return null;
  for (const st of sf.statements) if (ts.isTypeAliasDeclaration(st) && st.type.getText(sf).includes(`typeof ${ownerConst}`) && !/\[/u.test(st.type.getText(sf))) return st.name.text;
  return null;
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
const climb = (lit, levels, keys) => {
  let cur = lit;
  for (let i = 0; i < levels; i++) {
    let p = cur.parent;
    while (p && (ts.isArrayLiteralExpression(p) || ts.isParenthesizedExpression(p) || ts.isAsExpression(p) || ts.isSatisfiesExpression(p))) p = p.parent;
    if (!p || !ts.isPropertyAssignment(p) || !ts.isObjectLiteralExpression(p.parent)) return null;
    if (p.name.getText().replace(/['"]/gu, '') !== keys[keys.length - 2 - i]) return null;
    cur = p.parent;
  }
  return cur;
};

const collectRewrites = (prog, list0, editsByFile) => {
  const checker = prog.getTypeChecker();
  const skip = (f, d, why) => leftovers.rewriter.push({ where: `${rel(f)}:${d.file ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : 0}`, why, msg: ts.flattenDiagnosticMessageText(d.messageText, ' ').slice(0, 160) });
  let count = 0;
  for (const { f, d } of list0) {
    if (![2322, 2345, 2739, 2740, 2741, 2769].includes(d.code)) { skip(f, d, `code TS${d.code}`); continue; }
    const msg = ts.flattenDiagnosticMessageText(d.messageText, ' ');
    const sf = prog.getSourceFile(f);
    let node = sf;
    const descend = (n) => { for (const c of n.getChildren(sf)) if (c.getStart(sf) <= d.start && d.start + d.length <= c.end) { node = c; descend(c); return; } };
    descend(sf);
    const support = lib.isTestSupport(f);
    const list = editsByFile.get(f) ?? { f, edits: [], imports: new Map() };
    editsByFile.set(f, list);
    // the property assignment or assignment whose value failed
    let prop = node;
    while (prop && !(ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop) || ts.isBinaryExpression(prop) || ts.isCallExpression(prop) || ts.isReturnStatement(prop) || ts.isVariableDeclaration(prop))) prop = prop.parent;
    // the type the value must have, printed in full (a diagnostic's own text elides long types)
    let valueNode = node;
    while (valueNode.parent && valueNode.parent.getStart(sf) === valueNode.getStart(sf) && valueNode.parent.end === valueNode.end) valueNode = valueNode.parent;
    let tType = null;
    const isPropCase = prop && (ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop)) && ts.isObjectLiteralExpression(prop.parent);
    if (isPropCase) {
      const ctx0 = checker.getContextualType(prop.parent);
      const ctx = ctx0 && checker.getNonNullableType(ctx0);
      for (const m of ctx ? (ctx.isUnion() ? ctx.types : [ctx]) : []) {
        const sym = checker.getPropertyOfType(m, prop.name.getText(sf).replace(/['"]/gu, ''));
        if (sym) { tType = checker.getTypeOfSymbolAtLocation(sym, prop); break; }
      }
    } else if (prop && ts.isBinaryExpression(prop) && prop.operatorToken.kind === ts.SyntaxKind.EqualsToken) tType = checker.getTypeAtLocation(prop.left);
    else tType = checker.getContextualType(valueNode);
    const fullText = tType ? checker.typeToString(tType, undefined, ts.TypeFormatFlags.NoTruncation) : msg;
    const brand = brandsIn(fullText).find((b) => owners.has(b)) ?? brandsIn(fullText).find(known) ?? brandsIn(msg).find(known);
    if (!brand) { skip(f, d, 'target is not one of this brand\'s fields'); continue; }
    // owner of the field: from the checker's view of the target, else from the derived text
    let own = null;
    if (prop && (ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop)) && ts.isObjectLiteralExpression(prop.parent)) {
      const ctx0 = checker.getContextualType(prop.parent);
      const ctx = ctx0 && checker.getNonNullableType(ctx0);
      for (const m of ctx ? (ctx.isUnion() ? ctx.types : [ctx]) : []) {
        const sym = checker.getPropertyOfType(m, prop.name.getText(sf).replace(/['"]/gu, ''));
        const decl = sym?.valueDeclaration ?? sym?.declarations?.[0];
        if (decl && ts.isPropertyAssignment(decl)) { own = describeField(decl.initializer, decl.getSourceFile()); if (own) break; }
      }
    }
    own = own ?? owners.get(brand) ?? null;
    if (!own) { skip(f, d, 'owner of the field not found'); continue; }
    if (owners.get(own.text) === undefined) owners.set(own.text, own);
    const ownerName = ownerTypeNameOf(prog, own.ownerFile, own.ownerConst) ?? pascal(own.ownerConst.replace(/Contract$/u, ''));
    const stubPath = path.join(path.dirname(own.ownerFile), `${path.basename(own.ownerFile).replace(/-contract\.ts$/u, '')}.stub.ts`);
    const useStub = support && fs.existsSync(stubPath);
    const callee = useStub ? `${ownerName}Stub` : `${own.ownerConst}.parse`;
    const valueStyle = useStub && /\(\s*\{\s*value\s*\}\s*:/u.test(fs.readFileSync(stubPath, 'utf8'));
    const wrapText = (inner) => (valueStyle ? `${callee}({ value: ${inner} })` : `${callee}(${inner})`);
    const importName = useStub ? `${ownerName}Stub` : own.ownerConst;
    const importFile = useStub ? stubPath : own.ownerFile;
    if (prop && (ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop)) && ts.isObjectLiteralExpression(prop.parent)) {
      const root = climb(prop.parent, own.keys.length - 1, own.keys);
      if (!root) { skip(f, d, 'literal path does not reach the owner root'); continue; }
      const ownerSf = prog.getSourceFile(own.ownerFile);
      let ownerType = null;
      for (const st of ownerSf?.statements ?? []) if (ts.isTypeAliasDeclaration(st) && st.name.text === ownerName) ownerType = checker.getTypeAtLocation(st.name);
      const ctx0 = checker.getContextualType(root);
      const ctx = ctx0 && checker.getNonNullableType(ctx0);
      const members = ctx ? (ctx.isUnion() ? ctx.types : [ctx]) : [];
      const sig = (ty) => checker.getPropertiesOfType(ty).map((pp) => `${pp.name}${pp.flags & ts.SymbolFlags.Optional ? '?' : ''}`).sort().join(',');
      const complete = ownerType && members.some((m2) => sig(m2) === sig(ownerType));
      if (ts.isCallExpression(root.parent) && root.parent.expression.getText(sf) === callee && root.parent.arguments[0] === root) { skip(f, d, 'already inside the owner parse'); continue; }
      if (complete) {
        const spec = specFor(f, importFile, importName);
        if (!spec) { skip(f, d, `no import path for ${importName}`); continue; }
        list.edits.push({ start: root.getStart(sf), end: root.end, text: wrapText(root.getText(sf)), kindName: 'root-parse' });
        list.imports.set(importName, spec);
        count++;
      } else if (own.keys.length === 1 && !support) {
        const spec = specFor(f, own.ownerFile, own.ownerConst);
        if (!spec) { skip(f, d, `no import path for ${own.ownerConst}`); continue; }
        const v2 = ts.isShorthandPropertyAssignment(prop) ? prop.name.getText(sf) : prop.initializer.getText(sf);
        const w = `${own.ownerConst}.shape.${own.keys[0]}.parse(${v2})`;
        list.edits.push(ts.isShorthandPropertyAssignment(prop) ? { start: prop.getStart(sf), end: prop.end, text: `${prop.name.getText(sf)}: ${w}`, kindName: 'field-parse' } : { start: prop.initializer.getStart(sf), end: prop.initializer.end, text: w, kindName: 'field-parse' });
        list.imports.set(own.ownerConst, spec);
        count++;
      } else skip(f, d, support ? 'partial literal in test support' : 'partial nested literal');
      continue;
    }
    // a bare value handed to a field-typed slot: assignment right side, call argument, return
    let target = null;
    if (prop && ts.isBinaryExpression(prop) && prop.operatorToken.kind === ts.SyntaxKind.EqualsToken && (prop.left === valueNode || prop.left.getStart(sf) === d.start)) target = prop.right;
    else if (ts.isCallExpression(valueNode.parent) || ts.isReturnStatement(valueNode.parent) || ts.isVariableDeclaration(valueNode.parent) || ts.isArrowFunction(valueNode.parent)) target = valueNode;
    if (target && own.keys.length === 1 && !support) {
      const spec = specFor(f, own.ownerFile, own.ownerConst);
      if (!spec) { skip(f, d, `no import path for ${own.ownerConst}`); continue; }
      list.edits.push({ start: target.getStart(sf), end: target.end, text: `${own.ownerConst}.shape.${own.keys[0]}.parse(${target.getText(sf)})`, kindName: 'field-parse' });
      list.imports.set(own.ownerConst, spec);
      count++;
    } else skip(f, d, support ? 'value in test support' : target ? 'nested field path' : `unhandled shape (${ts.SyntaxKind[node.kind]})`);
  }
  return count;
};
// outer edit wins over an inner one, identical edits dedupe
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
    const add = [...imports].filter(([n]) => !have.has(n) && text.includes(n)).map(([n, s]) => `import { ${n} } from '${s}';`);
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

for (const [f, m] of fieldNeeds) {
  let text = overlay.get(f);
  const have = new Set();
  for (const st of lib.parse(f, text).statements) if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) for (const e of st.importClause.namedBindings.elements) have.add(e.name.text);
  const add = [];
  for (const [n, file] of m) {
    if (have.has(n)) continue;
    const spec = specFor(f, file, n);
    if (spec) add.push(`import { ${n} } from '${spec}';`);
    else leftovers.notInlineable.push(`${rel(f)}: no import path for ${n}`);
  }
  if (add.length) {
    const last = [...lib.parse(f, text).statements].filter(ts.isImportDeclaration).pop();
    const at = last ? last.end : 0;
    text = text.slice(0, at) + (last ? '\n' : '') + add.join('\n') + (last ? '' : '\n') + text.slice(at);
    overlay.set(f, lib.mergeDuplicateImports(f, text));
  }
}

const rounds = flag('no-rewrite') ? 0 : Number(arg('rounds') ?? 3);
for (let r = 0; r <= rounds; r++) {
  leftovers.rewriter = [];
  const editsByFile = new Map();
  cur = measure((w, list, prog) => collectRewrites(prog, list, editsByFile));
  const s = summarize(cur);
  if (r === 0) { result.overlayOnly = s; console.log('OVERLAY ONLY', JSON.stringify(s)); }
  else console.log(`AFTER REWRITER round ${r}`, JSON.stringify(s));
  result.withRewriter = s;
  if (r === rounds) break;
  const n = applyRewrites(editsByFile);
  log(`rewrite round ${r + 1}: ${n} edits applied`);
  if (!n) break;
}
// the diagnostics still standing become leftovers
const standing = [];
for (const [pk, v] of cur) for (const it of v.items) standing.push({ pkg: pk, where: it.where, text: `TS${it.code} ${it.msg.slice(0, 200)}` });
const outDir = lib.outDir(__dirname);
fs.mkdirSync(outDir, { recursive: true });
const lf = arg('leftovers') ? path.resolve(ROOT, arg('leftovers')) : path.join(outDir, `${brandName}-leftovers.json`);
fs.writeFileSync(lf, JSON.stringify({ ...result, leftovers, standing }, null, 1));
console.log('RESULT', JSON.stringify(result));
console.log('leftovers file', rel(lf), fs.statSync(lf).size, 'bytes; standing diagnostics', standing.length, '; remaining refs', leftovers.remainingRefs.length, '; field-not-in-object', leftovers.fieldNotInObject.length);
const sampleOut = arg('sample-out');
if (sampleOut) for (const [f, t] of overlay) { if (t === null) continue; const d = path.join(ROOT, sampleOut, rel(f)); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.writeFileSync(d, t); }
if (process.argv.includes('apply')) {
  for (const [f, t] of overlay) {
    if (t !== null) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, t); continue; }
    const mv = path.join(lib.DELETIONS, 'W5', rel(f));
    fs.mkdirSync(path.dirname(mv), { recursive: true });
    if (fs.existsSync(f)) fs.renameSync(f, mv);
  }
  console.log(`applied ${overlay.size} files`);
}

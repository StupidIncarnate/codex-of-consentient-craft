// SD3, waves W3 and W4: a standalone id brand becomes its owner's field (`id`, or the persisted key for an owner-field row).
//
// Input is 4.0's decision tables in items/b15-brand-migration.md (2.2 owned ids, 2.4 ownerless ids); `--brand` names a row by
// brand (`QuestId`) or const (`questIdContract`). Every row with the same owner path and key is one group and retyped in one
// pass (same-name copies, and rows such as `QuestWorkItemId` and orchestrator `WorkItemId` that converge on one owner).
//
// On an in-memory overlay:
//   owner file      `id: guildIdContract` gets the standalone's schema inline, branded with the B3 text (owner const minus
//                   `Contract`, plus the key, PascalCase). An owner that already declares the key inline keeps its text. An
//                   owner that points at its own id elsewhere gets B2's local unexported const. A new owner (W4) is created
//                   with the key only, its stub and a contract test; its other fields are hand work.
//   every user      a value reference to the standalone contract becomes `ownerContract.shape.key` (`.parse`, `.optional()`,
//                   `z.array(...)`, `typeof` all keep working); a type reference becomes `Owner['key']`; inline
//                   `.brand<'SameText'>()` chains (table 2.3) become the same reuse. A stub keeps its name and is retargeted
//                   through the same replacement. Across an import cycle (the owner's module reaches the file) a property
//                   becomes an annotated getter.
//   removed         the standalone contract and its contract test, and the barrel lines that export them.
// Then SD4's typechecker-driven rewriter ("build through the root parse") runs on what the retype left.
//
// Nothing under packages/ is written unless `apply` is given, and then only under `--apply-to` (default the repo root).
// Removed files are MOVED to tmp/deletions/W3/<repo path>, never deleted.
//
// Usage (from the worktree root, `tmp/phase34/` copy):
//   node tmp/phase34/b15-id-brands/run.cjs --brand=QuestId [--pkg=shared] [--no-group] [--no-rewrite] [--rounds=3]
//     [--pkgs=a,b] [--sample-out=dir] [--leftovers=file] [--apply-to=dir apply]
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
const pascal = (s) => s.replace(/(^|[_\-\s]+)([a-zA-Z0-9])/gu, (_, __, c) => c.toUpperCase());
const lcfirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const sameFile = (a, b) => a && b && path.resolve(a) === path.resolve(b);
const PK = path.join(ROOT, 'packages');

// ---------- 4.0 tables ----------
const itemFile = path.join(ROOT, 'scrolls', 'brands-gateways-epic', 'items', 'b15-brand-migration.md');
const readTable = (startRe, endRe) => {
  const lines = fs.readFileSync(itemFile, 'utf8').split('\n');
  const a = lines.findIndex((l) => startRe.test(l));
  const b = lines.findIndex((l, i) => i > a && endRe.test(l));
  return lines.slice(a + 1, b).filter((l) => l.startsWith('|') && !/^\|[-| ]+\|$/u.test(l)).slice(1).map((l) => l.slice(1, -1).split('|').map((c) => c.trim()));
};
const rows = [];
for (const c of readTable(/^#### 2\.2 /u, /^#### 2\.3 /u)) rows.push({ table: '2.2', pkg: c[0], brand: c[1], file: c[2], ownerPath: c[3], key: c[5], decision: 'owner-id', note: c[13] });
for (const c of readTable(/^#### 2\.4 /u, /^#### 2\.5 /u)) {
  const m = /^(\S+)(?:\s*\((.*)\))?$/u.exec(c[4]);
  rows.push({ table: '2.4', pkg: c[0], brand: c[1], file: c[2], decision: c[3], ownerPath: m?.[1] ?? '-', ownerNote: m?.[2] ?? '', key: c[5], note: c[10] });
}
const want = arg('brand');
if (!want) throw new Error('--brand=<Brand or xContract> is required');
const wantBrand = pascal(want.replace(/Contract$/u, ''));
const pick = rows.filter((r) => r.brand === wantBrand && (!arg('pkg') || r.pkg === arg('pkg')));
if (pick.length !== 1) throw new Error(`brand ${wantBrand}: ${pick.length} table rows (${pick.map((r) => r.pkg).join(',')}); pass --pkg`);
const row0 = pick[0];
if (row0.decision === 'plain' || row0.ownerPath === '-') throw new Error(`${wantBrand} is decided plain: W1's codemod handles it`);
if (/rename of/u.test(row0.ownerNote ?? '')) throw new Error(`${wantBrand}: owner is a rename of another contract (${row0.ownerNote}); do the rename first`);
const group = flag('no-group') ? [row0] : rows.filter((r) => r.ownerPath === row0.ownerPath && r.key === row0.key && r.decision !== 'plain');
const ownerFile = path.join(PK, row0.ownerPath);
const key = row0.key;
const ownerConst = ownerFile.split('/').pop().replace(/-contract\.ts$/u, '').replace(/-(\w)/gu, (_, c) => c.toUpperCase()) + 'Contract';
const ownerBase = pascal(ownerConst.replace(/Contract$/u, ''));
const ownerPkg = lib.workspaceOf(ownerFile, ws);
const ownerIsNew = !fs.existsSync(ownerFile);

// ---------- the standalone definitions ----------
const loadDef = (r) => {
  const contractFile = path.join(PK, r.file);
  const csf = lib.parse(contractFile);
  let constName = null;
  let initText = null;
  let typeName = null;
  for (const st of csf.statements) {
    if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name) && d.initializer && /\.brand</u.test(d.initializer.getText(csf))) { constName = d.name.text; initText = d.initializer.getText(csf); }
  }
  for (const st of csf.statements) if (ts.isTypeAliasDeclaration(st) && constName && st.type.getText(csf).includes(`typeof ${constName}`)) typeName = st.name.text;
  if (!constName) throw new Error(`no branded const in ${r.file}`);
  const kind = /^z\s*\.\s*number/u.test(initText) ? 'number' : 'string';
  const baseSchema = initText.replace(/\s+/gu, ' ').replace(/\s*\.brand<[^>]*>\(\)\s*$/u, '').replace(/ (?=\.)/gu, '').replace(/\( /gu, '(').replace(/ \)/gu, ')').trim();
  const stubBase = path.basename(contractFile).replace(/-contract\.ts$/u, '');
  const stubFile = path.join(path.dirname(contractFile), `${stubBase}.stub.ts`);
  let stubDefault = null;
  if (fs.existsSync(stubFile)) {
    const m = /value(?:\s*=\s*|:\s*)('[^'\n]*'|"[^"\n]*"|-?\d+(?:\.\d+)?)/u.exec(fs.readFileSync(stubFile, 'utf8').replace(/value:\s*(string|number)/gu, ''));
    stubDefault = m ? m[1] : null;
  }
  const stripped = baseSchema.replace(/\/(?:[^/\\\n]|\\.)+\/[a-z]*/gu, '').replace(/'[^']*'|"[^"]*"/gu, '').replace(/`[^`]*`/gu, '');
  const baseIds = [...new Set([...stripped.matchAll(/(^|[^.\w$])([A-Za-z_$][\w$]*)/gu)].map((m) => m[2]).filter((n) => !['z', 'new', 'RegExp'].includes(n)))];
  const baseImportFiles = new Map();
  for (const id of baseIds) {
    for (const st of csf.statements) {
      if (!ts.isImportDeclaration(st) || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings)) continue;
      for (const e of st.importClause.namedBindings.elements) {
        if (e.name.text !== id) continue;
        const rr = resolver(st.moduleSpecifier.text, contractFile);
        const d = rr && lib.findDeclaringFile(rr, (e.propertyName ?? e.name).text, resolver);
        if (d) baseImportFiles.set(id, d.file);
      }
    }
  }
  return {
    row: r, contractFile, constName, typeName, stubName: `${typeName}Stub`, kind, baseSchema, stubBase, stubFile, stubDefault,
    testFile: contractFile.replace(/\.ts$/u, '.test.ts'), pkg: lib.workspaceOf(contractFile, ws), baseIds, baseImportFiles,
    inlineOk: baseIds.every((id) => baseImportFiles.has(id)), text: /\.brand<\s*['"]([^'"]+)['"]\s*>\(\)\s*$/u.exec(initText)?.[1],
  };
};
const defs = group.map(loadDef);
const brandFiles = new Set(defs.flatMap((d) => [d.contractFile, d.testFile]));
const notes = [];
const baseDef = defs.find((d) => d.pkg === ownerPkg && d.inlineOk) ?? defs.find((d) => d.inlineOk) ?? defs[0];
for (const d of defs) if (d.baseSchema !== baseDef.baseSchema) notes.push(`schema differs: ${d.text} (${d.baseSchema}) versus ${baseDef.text} (${baseDef.baseSchema}); every use now takes the owner's check`);

// ---------- the owner ----------
const ownerText0 = ownerIsNew ? '' : fs.readFileSync(ownerFile, 'utf8');
const rootObject = (e) => {
  let cur = e;
  for (;;) {
    if (ts.isCallExpression(cur)) {
      if (ts.isPropertyAccessExpression(cur.expression)) {
        if (cur.expression.name.text === 'object' && cur.expression.expression.getText() === 'z') return cur;
        cur = cur.expression.expression;
        continue;
      }
      return null;
    }
    if (ts.isPropertyAccessExpression(cur)) { cur = cur.expression; continue; }
    return null;
  }
};
let ownerKeyProp = null;
let ownerTypeName = ownerBase;
if (!ownerIsNew) {
  const osf = lib.parse(ownerFile, ownerText0);
  for (const st of osf.statements) {
    if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name) && d.name.text === ownerConst && d.initializer) {
      const o = rootObject(d.initializer);
      if (o?.arguments[0] && ts.isObjectLiteralExpression(o.arguments[0])) ownerKeyProp = o.arguments[0].properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText(osf).replace(/['"]/gu, '') === key) ?? null;
    }
    if (ts.isTypeAliasDeclaration(st) && st.type.getText(osf).includes(`typeof ${ownerConst}`) && !/\[/u.test(st.type.getText(osf))) ownerTypeName = st.name.text;
  }
  if (!ownerKeyProp) throw new Error(`owner ${rel(ownerFile)} has no key ${key} in ${ownerConst}`);
}
const existingInline = ownerKeyProp ? /\.brand<\s*['"]([^'"]+)['"]\s*>\(\)\s*$/u.exec(ownerKeyProp.initializer.getText())?.[1] : null;
const newText = existingInline ?? ownerBase + pascal(key);
const localName = `${lcfirst(ownerBase)}${pascal(key)}`;
const KIND = baseDef.kind;
const brandTypeText = (t) => `${KIND} & z.$brand<'${t}'>`;
log(JSON.stringify({ group: defs.map((d) => ({ file: rel(d.contractFile), const: d.constName, type: d.typeName, text: d.text, inlineOk: d.inlineOk })), owner: rel(ownerFile), ownerIsNew, ownerConst, key, newText, ownerTypeName, notes }));

// ---------- users ----------
const all = [];
for (const w of ws) if (!w.isGateway) for (const d of ['src', 'test', 'e2e']) for (const f of lib.walk(path.join(w.dir, d))) all.push(f);
for (const w of ws) if (!w.isGateway) for (const e of fs.readdirSync(w.dir)) if (/^[a-z-]+\.ts$/u.test(e) && !e.endsWith('.d.ts')) all.push(path.join(w.dir, e));
const names = defs.flatMap((d) => [d.constName, d.typeName, d.stubName]);
const wordRe = new RegExp(`\\b(${[...new Set(names)].join('|')})\\b|brand<\\s*['"](${[...new Set(defs.map((d) => d.text))].join('|')})['"]\\s*>`, 'u');
const users = all.filter((f) => !brandFiles.has(f) && wordRe.test(fs.readFileSync(f, 'utf8')));

const declaringFileOf = (f, sf, name) => {
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings)) continue;
    for (const e of st.importClause.namedBindings.elements) {
      if (e.name.text !== name) continue;
      const r = resolver(st.moduleSpecifier.text, f);
      if (!r) return null;
      return lib.findDeclaringFile(r, (e.propertyName ?? e.name).text, resolver)?.file ?? null;
    }
  }
  return null;
};

// import graph inside the owner's package (runtime edges only), to find files the owner reaches
const reach = new Set();
if (!ownerIsNew) {
  const stack = [ownerFile];
  while (stack.length) {
    const f = stack.pop();
    if (reach.has(f)) continue;
    reach.add(f);
    const sf = lib.parse(f);
    for (const st of sf.statements) {
      if (!ts.isImportDeclaration(st) || st.importClause?.isTypeOnly || !st.moduleSpecifier.text.startsWith('.')) continue;
      const r = resolver(st.moduleSpecifier.text, f);
      if (r && !/\.(stub|test)\.tsx?$/u.test(r) && lib.workspaceOf(r, ws) === ownerPkg) stack.push(r);
    }
  }
}

for (const f of (arg('treat-as-cyclic') ?? '').split(',').filter(Boolean)) reach.add(path.resolve(ROOT, f));

const specTo = (fromFile, targetFile, name) => {
  const wf = lib.workspaceOf(fromFile, ws);
  const wt = lib.workspaceOf(targetFile, ws);
  if (wf === wt) {
    let r = path.relative(path.dirname(fromFile), targetFile).replace(/\.tsx?$/u, '').split(path.sep).join('/');
    if (!r.startsWith('.')) r = `./${r}`;
    return r;
  }
  if (!Object.keys({ ...wf.packageJson.dependencies, ...wf.packageJson.devDependencies }).includes(wt.name)) return null;
  return `${wt.name}/contracts`;
};

const leftovers = { localOwnerName: [], cyclePlain: [], gettersSkipped: [], noImportPath: [], ownerSelf: [], remainingRefs: [], rewriter: [], notes };
const stats = { userFiles: users.length, valueRefs: 0, typeRefs: 0, inlineCopies: 0, getters: 0, localConst: 0 };
const importsNeeded = new Map(); // file -> Map(name -> { spec, type })
const need = (f, name, spec, type) => { const m = importsNeeded.get(f) ?? new Map(); if (!m.has(name) || m.get(name).type) m.set(name, { spec, type }); importsNeeded.set(f, m); };
const isObjLit = (n) => n && ts.isObjectLiteralExpression(n);
const needParen = (n) => ts.isBinaryExpression(n) || ts.isConditionalExpression(n) || ts.isArrowFunction(n) || ts.isAsExpression(n);

const collectFor = (f, text) => {
  const sf = lib.parse(f, text);
  const isOwnerFile = sameFile(f, ownerFile);
  const cyc = reach.has(f) && !isOwnerFile;
  const local = new Map();
  for (const d of defs) for (const nm of [d.constName, d.typeName]) local.set(`${d.constName}|${nm}`, declaringFileOf(f, sf, nm));
  const defOfName = (nm) => defs.find((d) => (d.constName === nm || d.typeName === nm) && sameFile(local.get(`${d.constName}|${nm}`), d.contractFile));
  const cands = [];
  const add = (start, end, t, k) => cands.push({ start, end, text: t, kindName: k });
  const replName = isOwnerFile ? localName : `${ownerConst}.shape.${key}`;
  const useOwner = () => { if (!isOwnerFile) { const spec = specTo(f, ownerFile, ownerConst); if (spec) need(f, ownerConst, spec, false); else leftovers.noImportPath.push(`${rel(f)}: ${ownerConst}`); } };
  const isRef = (n) => ts.isIdentifier(n) && defs.some((d) => d.constName === n.text) && defOfName(n.text) && !(n.parent && ((ts.isPropertyAssignment(n.parent) && n.parent.name === n) || (ts.isPropertyAccessExpression(n.parent) && n.parent.name === n) || ts.isImportSpecifier(n.parent) || ts.isExportSpecifier(n.parent)));
  const isInlineBrand = (n) => ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'brand' && n.typeArguments?.length === 1 && ts.isLiteralTypeNode(n.typeArguments[0]) && defs.some((d) => d.text === n.typeArguments[0].literal.text) && /-contract\.ts$/u.test(f) && inAnyObjectField(n) && /^z\b/u.test(n.getText(sf)) && !(n.parent && ts.isPropertyAccessExpression(n.parent) && n.parent.name.text === 'brand');
  const isTarget = (x) => isRef(x) || (isInlineBrand(x) && !(isOwnerFile && inOwnerKey(x)));
  const containsRef = (n) => { let hit = false; const v = (x) => { if (hit) return; if (isTarget(x)) hit = true; else ts.forEachChild(x, v); }; v(n); return hit; };
  // getter type for a property initializer built only from the reference and zod wrappers
  const getterType = (e, base) => {
    if (isTarget(e)) return base;
    if (ts.isCallExpression(e) && ts.isPropertyAccessExpression(e.expression)) {
      const nm = e.expression.name.text;
      const inner = e.expression.expression;
      if (nm === 'optional') { const t = getterType(inner, base); return t && `z.core.$ZodOptional<${t}>`; }
      if (nm === 'nullable') { const t = getterType(inner, base); return t && `z.core.$ZodNullable<${t}>`; }
      if (nm === 'nullish') { const t = getterType(inner, base); return t && `z.core.$ZodOptional<z.core.$ZodNullable<${t}>>`; }
      if (nm === 'default') { const t = getterType(inner, base); return t && `z.core.$ZodDefault<${t}>`; }
      if (nm === 'describe') return getterType(inner, base);
      if (nm === 'array' && e.expression.expression.getText(sf) === 'z' && e.arguments.length === 1) { const t = getterType(e.arguments[0], base); return t && `z.core.$ZodArray<${t}>`; }
    }
    return null;
  };
  const inAnyObjectField = (n) => {
    for (let p = n.parent; p; p = p.parent) if (ts.isPropertyAssignment(p) && ts.isObjectLiteralExpression(p.parent) && p.parent.parent && ts.isCallExpression(p.parent.parent) && /(^|\.)(object|strictObject|extend|merge)$/u.test(p.parent.parent.expression.getText(sf))) return true;
    return false;
  };
  const inOwnerKey = (n) => {
    for (let p = n; p; p = p.parent) if (isOwnerFile && ts.isVariableDeclaration(p) && ts.isIdentifier(p.name) && p.name.text === localName) return true;
    for (let p = n; p; p = p.parent) {
      if (ts.isPropertyAssignment(p) && p.name.getText(sf).replace(/['"]/gu, '') === key && ts.isObjectLiteralExpression(p.parent) && p.parent.parent && ts.isCallExpression(p.parent.parent) && p.parent.parent.expression.getText(sf) === 'z.object') return true;
    }
    return false;
  };
  const visit = (n) => {
    if (ts.isImportDeclaration(n)) return;
    if (ts.isTypeReferenceNode(n) && ts.isIdentifier(n.typeName) && defOfName(n.typeName.text)?.typeName === n.typeName.text) {
      add(n.getStart(sf), n.end, `${ownerTypeName}['${key}']`, 'type');
      if (!isOwnerFile) { const spec = specTo(f, ownerFile, ownerTypeName); if (spec) need(f, ownerTypeName, spec, true); else leftovers.noImportPath.push(`${rel(f)}: type ${ownerTypeName}`); }
      return;
    }
    if (cyc && ts.isPropertyAssignment(n) && ts.isObjectLiteralExpression(n.parent) && containsRef(n.initializer)) {
      const t = getterType(n.initializer, `z.core.$ZodType<${brandTypeText(newText)}>`);
      if (t && (ts.isIdentifier(n.name) || ts.isStringLiteral(n.name))) {
        const parts = [];
        let last = n.initializer.getStart(sf);
        const rs = [];
        const collect = (x) => { if (isTarget(x)) rs.push(x); else ts.forEachChild(x, collect); };
        collect(n.initializer);
        let body = '';
        for (const r of rs) { body += text.slice(last, r.getStart(sf)) + replName; last = r.end; }
        body += text.slice(last, n.initializer.end);
        add(n.getStart(sf), n.end, `get ${n.name.getText(sf)}(): ${t} {\n return ${body};\n }`, 'getter');
        useOwner();
        need(f, 'z', '#gateway/npm/zod', false);
        return;
      }
      leftovers.gettersSkipped.push(`${rel(f)}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1} ${n.getText(sf).slice(0, 70).replace(/\s+/gu, ' ')}`);
    }
    if (isRef(n)) {
      if (cyc) leftovers.cyclePlain.push(`${rel(f)}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`);
      if (n.parent && ts.isShorthandPropertyAssignment(n.parent)) add(n.parent.getStart(sf), n.parent.end, `${n.text}: ${replName}`, 'value');
      else add(n.getStart(sf), n.end, replName, 'value');
      useOwner();
      return;
    }
    if (isInlineBrand(n) && !(isOwnerFile && inOwnerKey(n))) {
      if (cyc) leftovers.cyclePlain.push(`${rel(f)}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1} (inline copy)`);
      add(n.getStart(sf), n.end, replName, 'inline');
      useOwner();
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  const flat = cands.filter((c) => !cands.some((o) => o !== c && o.start <= c.start && o.end >= c.end && !(o.start === c.start && o.end === c.end)));
  return flat;
};

const importDropEdits = (f, out) => {
  const sf2 = lib.parse(f, out);
  const used = (nm) => { let hit = false; const v = (n) => { if (hit || ts.isImportDeclaration(n)) return; if (ts.isIdentifier(n) && n.text === nm) hit = true; ts.forEachChild(n, v); }; sf2.statements.forEach(v); return hit; };
  const drop = [];
  for (const st of sf2.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings) || st.importClause.name) continue;
    const els = st.importClause.namedBindings.elements;
    const keep = els.filter((e) => used(e.name.text) || !names.includes((e.propertyName ?? e.name).text));
    if (keep.length === els.length) continue;
    if (!keep.length) { const le = out.indexOf('\n', st.end); drop.push({ start: st.getStart(sf2), end: le === -1 ? st.end : le + 1, text: '' }); }
    else drop.push({ start: st.getStart(sf2), end: st.end, text: `import${st.importClause.isTypeOnly ? ' type' : ''} { ${keep.map((e) => e.getText(sf2)).join(', ')} } from ${st.moduleSpecifier.getText(sf2)};` });
  }
  return lib.applyEdits(out, drop);
};
const addImports = (f, text) => {
  const m = importsNeeded.get(f);
  if (!m) return text;
  const sf = lib.parse(f, text);
  const have = new Set();
  for (const st of sf.statements) if (ts.isImportDeclaration(st) && st.importClause) { if (st.importClause.name) have.add(st.importClause.name.text); const nb = st.importClause.namedBindings; if (nb && ts.isNamedImports(nb)) for (const e of nb.elements) have.add(e.name.text); }
  const add = [];
  for (const [n, { spec, type }] of m) {
    if (have.has(n)) continue;
    const declaredHere = sf.statements.some((s) => (ts.isTypeAliasDeclaration(s) || ts.isInterfaceDeclaration(s) || ts.isClassDeclaration(s) || ts.isVariableStatement(s)) && (s.name?.text === n || (ts.isVariableStatement(s) && s.declarationList.declarations.some((d) => d.name.getText(sf) === n))));
    if (declaredHere) { leftovers.localOwnerName.push(`${rel(f)}: ${n} is declared locally`); continue; }
    if (!text.includes(n)) continue;
    add.push(`import ${type ? 'type ' : ''}{ ${n} } from '${spec}';`);
  }
  if (!add.length) return text;
  const last = [...sf.statements].filter(ts.isImportDeclaration).pop();
  const at = last ? last.end : 0;
  const t2 = text.slice(0, at) + (last ? '\n' : '') + add.join('\n') + (last ? '' : '\n') + text.slice(at);
  return lib.mergeDuplicateImports(f, t2);
};

const overlay = new Map();
const kindStat = { type: 'typeRefs', value: 'valueRefs', inline: 'inlineCopies', getter: 'getters' };
// owner file: key initializer, then self references
let ownerText = ownerText0;
if (ownerIsNew) {
  const stubDef = defs.find((d) => d.stubDefault) ?? baseDef;
  const dflt = stubDef.stubDefault ?? `'${key}-1'`;
  const needsImports = baseDef.baseIds.map((id) => [id, baseDef.baseImportFiles.get(id)]);
  const impLines = needsImports.map(([id, file]) => `import { ${id} } from '${specTo(ownerFile, file, id)}';`);
  ownerText = `/**
 * PURPOSE: Defines the ${ownerBase.replace(/([a-z])([A-Z])/gu, '$1 $2').toLowerCase()} object whose \`${key}\` every contract and function that holds one reuses
 *
 * USAGE:
 * ${ownerConst}.parse({ ${key}: ${dflt} });
 * // Returns: ${ownerTypeName} object
 */

import { z } from '#gateway/npm/zod';
${impLines.length ? `${impLines.join('\n')}\n` : ''}
export const ${ownerConst} = z
  .object({
    ${key}: ${baseDef.baseSchema}.brand<'${newText}'>(),
  })
  .brand<'${ownerBase}'>();

export type ${ownerTypeName} = z.infer<typeof ${ownerConst}>;
`;
  overlay.set(ownerFile, ownerText);
  const stubFile = ownerFile.replace(/-contract\.ts$/u, '.stub.ts');
  overlay.set(stubFile, `import type { StubArgument } from '../../@types/stub-argument.type';

import { ${ownerConst} } from './${path.basename(ownerFile, '.ts')}';
import type { ${ownerTypeName} } from './${path.basename(ownerFile, '.ts')}';

export const ${ownerTypeName}Stub = ({ ...props }: StubArgument<${ownerTypeName}> = {}): ${ownerTypeName} =>
  ${ownerConst}.parse({
    ${key}: ${dflt},
    ...props,
  });
`);
  const cb = path.basename(ownerFile, '.ts');
  overlay.set(ownerFile.replace(/\.ts$/u, '.test.ts'), `import { ${ownerConst} } from './${cb}';
import { ${ownerTypeName}Stub } from './${cb.replace(/-contract$/u, '')}.stub';

describe('${ownerConst}', () => {
  it('VALID: {default stub} => parses with the default ${key}', () => {
    const value = ${ownerTypeName}Stub();

    expect(value.${key}).toBe(${dflt});
  });

  it('INVALID: {${key}: ""} => is rejected', () => {
    const result = ${ownerConst}.safeParse({ ${key}: '' });

    expect(result.success).toBe(false);
  });
});
`);
  leftovers.notes.push(`new owner ${rel(ownerFile)} holds only \`${key}\`: table 2.4 names further fields for it, added by hand`);
}
// users (including the owner file when it exists)
const userSet = [...users];
if (!ownerIsNew && !userSet.includes(ownerFile)) userSet.push(ownerFile);
for (const f of userSet) {
  let text = f === ownerFile ? ownerText : fs.readFileSync(f, 'utf8');
  let any = false;
  const isOwner = f === ownerFile;
  if (isOwner) {
    const sf = lib.parse(f, text);
    const edits = [];
    const selfRefs = [];
    const v = (n) => {
      if (ts.isImportDeclaration(n)) return;
      if (ts.isIdentifier(n) && defs.some((d) => d.constName === n.text) && !(ts.isPropertyAssignment(n.parent) && n.parent.name === n) && !ts.isImportSpecifier(n.parent)) selfRefs.push(n);
      ts.forEachChild(n, v);
    };
    sf.statements.forEach(v);
    const keyInit = ownerKeyProp.initializer;
    const othersUse = selfRefs.filter((r) => !(r.getStart(sf) >= keyInit.getStart(sf) && r.end <= keyInit.end));
    const keyIsRef = ts.isIdentifier(keyInit) && defs.some((d) => d.constName === keyInit.text);
    const otherInline = [];
    const v2 = (n) => { if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'brand' && n.typeArguments?.length === 1 && ts.isLiteralTypeNode(n.typeArguments[0]) && defs.some((d) => d.text === n.typeArguments[0].literal.text) && !(n.getStart(sf) >= keyInit.getStart(sf) && n.end <= keyInit.end)) otherInline.push(n); ts.forEachChild(n, v2); };
    sf.statements.forEach(v2);
    if (keyIsRef || existingInline === null) {
      const inlineSchema = `${baseDef.baseSchema}.brand<'${newText}'>()`;
      if (othersUse.length || otherInline.length) {
        stats.localConst++;
        edits.push({ start: keyInit.getStart(sf), end: keyInit.end, text: localName });
        const decl = sf.statements.find((s) => ts.isVariableStatement(s) && s.declarationList.declarations.some((d) => d.name.getText(sf) === ownerConst));
        edits.push({ start: decl.getStart(sf), end: decl.getStart(sf), text: `const ${localName} = ${inlineSchema};\n\n` });
      } else edits.push({ start: keyInit.getStart(sf), end: keyInit.end, text: inlineSchema });
      if (baseDef.baseIds.length) for (const id of baseDef.baseIds) { const spec = specTo(f, baseDef.baseImportFiles.get(id), id); if (spec) need(f, id, spec, false); }
    }
    text = lib.applyEdits(text, edits);
    any = edits.length > 0;
  }
  for (let round = 0; round < 6; round++) {
    const cands = collectFor(f, text);
    if (!cands.length) break;
    for (const c of cands) stats[kindStat[c.kindName]]++;
    text = lib.applyEdits(text, cands);
    any = true;
  }
  if (any || isOwner) overlay.set(f, importDropEdits(f, addImports(f, text)));
}
for (const f of brandFiles) if (fs.existsSync(f)) overlay.set(f, null);
// barrels
const barrelPath = (w) => [path.join(w.dir, 'src/contracts/contracts.ts'), path.join(w.dir, 'contracts.ts')].find((p) => fs.existsSync(p));
const removedBases = defs.map((d) => path.basename(d.contractFile, '.ts'));
for (const f of all.concat(ws.filter((w) => !w.isGateway).map(barrelPath).filter(Boolean))) {
  if (overlay.get(f) === null) continue;
  const t = overlay.get(f) ?? fs.readFileSync(f, 'utf8');
  if (!removedBases.some((b) => t.includes(b))) continue;
  const lines = t.split('\n');
  const keep = lines.filter((l) => { const m = /^\s*export\s.*from\s+['"]([^'"]+)['"]/u.exec(l); return !(m && m[1].startsWith('.') && brandFiles.has(`${path.resolve(path.dirname(f), m[1])}.ts`)); });
  if (keep.length !== lines.length) overlay.set(f, keep.join('\n'));
}
if (ownerIsNew) {
  const b = barrelPath(ownerPkg);
  if (b) {
    const t = overlay.get(b) ?? fs.readFileSync(b, 'utf8');
    const relTo = (x) => `./${path.relative(path.dirname(b), x).replace(/\.ts$/u, '').split(path.sep).join('/')}`;
    overlay.set(b, `${t.replace(/\n*$/u, '')}\nexport * from '${relTo(ownerFile)}';\n`);
  } else leftovers.notes.push(`no contracts barrel found in ${ownerPkg.name}`);
}
// what still names the brand
for (const [f, t] of overlay) {
  if (t === null) continue;
  const sf = lib.parse(f, t);
  const v = (n) => {
    if (ts.isImportDeclaration(n)) return;
    if (ts.isIdentifier(n) && names.filter((x) => !x.endsWith('Stub')).includes(n.text) && !(ts.isPropertyAssignment(n.parent) && n.parent.name === n)) leftovers.remainingRefs.push(`${rel(f)}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1} ${n.text} ${n.parent.getText(sf).slice(0, 80).replace(/\s+/gu, ' ')}`);
    ts.forEachChild(n, v);
  };
  sf.statements.forEach(v);
}
log('retype', JSON.stringify(stats), 'files', overlay.size);

if (flag('stats-only')) {
  console.log('STATS', JSON.stringify({ brand: wantBrand, group: defs.length, stats, files: overlay.size, cyclePlain: leftovers.cyclePlain.length, gettersSkipped: leftovers.gettersSkipped.length, noImportPath: leftovers.noImportPath.length, localOwnerName: leftovers.localOwnerName.length, remainingRefs: leftovers.remainingRefs.length }));
  process.exit(0);
}

// ---------- typecheck ----------
const keyOf = (d) => `${d.code}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
const touchedPkgs = new Set([...overlay.keys()].map((f) => lib.workspaceOf(f, ws).name));
let target = ws.filter((w) => !w.isGateway && (touchedPkgs.has(w.name) || Object.keys({ ...w.packageJson.dependencies, ...w.packageJson.devDependencies }).some((d) => touchedPkgs.has(d))));
if (arg('pkgs')) target = target.filter((w) => arg('pkgs').split(',').includes(w.short));
const baseByPkg = new Map();
const filesOf = (w) => {
  const files = lib.walk(w.dir).filter((f) => !f.includes('/dist/') && overlay.get(f) !== null);
  for (const [f, t] of overlay) if (t !== null && f.startsWith(w.dir + path.sep) && !files.includes(f)) files.push(f);
  return files;
};
const baseOf = (w) => {
  if (!baseByPkg.has(w.name)) {
    const b = lib.diagnosticsWithOverlay(lib.walk(w.dir).filter((f) => !f.includes('/dist/')), new Map(), lib.packageCompilerOptions(w.dir)).diagnostics;
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
    const files = filesOf(w);
    const r = lib.diagnosticsWithOverlay(files, overlay, lib.packageCompilerOptions(w.dir));
    const list = [];
    for (const f of files) for (const d of r.diagnostics.get(f) ?? []) if (!(base.get(f) ?? new Set()).has(keyOf(d))) list.push({ f, d });
    handler?.(w, list, r.program);
    res.set(w.short, { count: list.length, items: list.map(({ f, d }) => ({ where: `${rel(f)}:${d.file ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : 0}`, code: d.code, msg: ts.flattenDiagnosticMessageText(d.messageText, ' ') })) });
    log('measured', w.short, list.length);
  }
  return res;
};
const summarize = (res) => {
  const per = {};
  const kinds = {};
  let total = 0;
  for (const [k, v] of res) {
    if (v.count) per[k] = v.count;
    total += v.count;
    for (const it of v.items) { const kk = `TS${it.code} ${it.msg.slice(0, 70).replace(/'[^']*'|"[^"]*"/gu, 'X')}`; kinds[kk] = (kinds[kk] ?? 0) + 1; }
  }
  return { total, per, kinds: Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 8) };
};

// ---------- the rewriter (SD4's "build through the root parse"), for values that now meet a branded field ----------
const owners = new Map([[newText, { text: newText, ownerConst, ownerFile, keys: [key] }]]);
const brandsIn = (msg) => [...msg.matchAll(/(?:BRAND|\$brand)<["']([^"']+)["']>/gu)].map((m) => m[1]);
const known = (b) => owners.has(b) || defs.some((d) => d.text === b);
const ownerTypeNameOf = () => ownerTypeName;
const collectRewrites = (prog, list0, editsByFile) => {
  const checker = prog.getTypeChecker();
  const skip = (f, d, why) => leftovers.rewriter.push({ where: `${rel(f)}:${d.file ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : 0}`, why, msg: ts.flattenDiagnosticMessageText(d.messageText, ' ').slice(0, 160) });
  let count = 0;
  for (const { f, d } of list0) {
    if (![2322, 2345, 2739, 2740, 2741, 2769].includes(d.code)) { skip(f, d, `code TS${d.code}`); continue; }
    const msg = ts.flattenDiagnosticMessageText(d.messageText, ' ');
    if (!brandsIn(msg).some(known)) { skip(f, d, 'not this brand'); continue; }
    const sf = prog.getSourceFile(f);
    let node = sf;
    const descend = (n) => { for (const c of n.getChildren(sf)) if (c.getStart(sf) <= d.start && d.start + d.length <= c.end) { node = c; descend(c); return; } };
    descend(sf);
    const support = lib.isTestSupport(f);
    const list = editsByFile.get(f) ?? { f, edits: [], imports: new Map() };
    editsByFile.set(f, list);
    let prop = node;
    while (prop && !(ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop) || ts.isBinaryExpression(prop) || ts.isCallExpression(prop) || ts.isReturnStatement(prop) || ts.isVariableDeclaration(prop))) prop = prop.parent;
    let valueNode = node;
    while (valueNode.parent && valueNode.parent.getStart(sf) === valueNode.getStart(sf) && valueNode.parent.end === valueNode.end) valueNode = valueNode.parent;
    const own = owners.get(newText);
    const stubPath = ownerFile.replace(/-contract\.ts$/u, '.stub.ts');
    const useStub = support && fs.existsSync(stubPath) && !ownerIsNew;
    const spec = specTo(f, ownerFile, ownerConst);
    if (!spec) { skip(f, d, `no import path for ${ownerConst}`); continue; }
    if (prop && (ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop)) && ts.isObjectLiteralExpression(prop.parent) && !support) {
      const v2 = ts.isShorthandPropertyAssignment(prop) ? prop.name.getText(sf) : prop.initializer.getText(sf);
      const w = `${ownerConst}.shape.${key}.parse(${v2})`;
      list.edits.push(ts.isShorthandPropertyAssignment(prop) ? { start: prop.getStart(sf), end: prop.end, text: `${prop.name.getText(sf)}: ${w}`, kindName: 'field-parse' } : { start: prop.initializer.getStart(sf), end: prop.initializer.end, text: w, kindName: 'field-parse' });
      list.imports.set(ownerConst, spec);
      count++;
      continue;
    }
    let tgt = null;
    if (prop && ts.isBinaryExpression(prop) && prop.operatorToken.kind === ts.SyntaxKind.EqualsToken && prop.left.getStart(sf) === d.start) tgt = prop.right;
    else if (ts.isCallExpression(valueNode.parent) || ts.isReturnStatement(valueNode.parent) || ts.isVariableDeclaration(valueNode.parent) || ts.isArrowFunction(valueNode.parent)) tgt = valueNode;
    if (tgt && !support) {
      list.edits.push({ start: tgt.getStart(sf), end: tgt.end, text: `${ownerConst}.shape.${key}.parse(${tgt.getText(sf)})`, kindName: 'field-parse' });
      list.imports.set(ownerConst, spec);
      count++;
    } else skip(f, d, support ? 'value in test support' : `unhandled shape (${ts.SyntaxKind[node.kind]})`);
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
    for (const [n, s] of imports) need(f, n, s, false);
    text = addImports(f, text);
    overlay.set(f, text);
    applied += flat.length;
  }
  return applied;
};

const result = { brand: wantBrand, owner: rel(ownerFile), key, newText, group: defs.map((d) => rel(d.contractFile)), stats };
let cur;
const rounds = flag('no-rewrite') ? 0 : Number(arg('rounds') ?? 3);
for (let r = 0; r <= rounds; r++) {
  leftovers.rewriter = [];
  const editsByFile = new Map();
  cur = measure((w, list, prog) => collectRewrites(prog, list, editsByFile));
  const s = summarize(cur);
  if (r === 0) { result.retypeOnly = s; console.log('RETYPE ONLY', JSON.stringify(s)); } else console.log(`AFTER REWRITER round ${r}`, JSON.stringify(s));
  result.withRewriter = s;
  if (r === rounds) break;
  const n = applyRewrites(editsByFile);
  log(`rewrite round ${r + 1}: ${n} edits applied`);
  if (!n) break;
}
const standing = [];
for (const [pk, v] of cur) for (const it of v.items) standing.push({ pkg: pk, where: it.where, text: `TS${it.code} ${it.msg.slice(0, 200)}` });
const outDir = path.join(ROOT, 'tmp', 'phase34', 'b15-id-brands', 'out');
fs.mkdirSync(outDir, { recursive: true });
const lf = arg('leftovers') ? path.resolve(ROOT, arg('leftovers')) : path.join(outDir, `${wantBrand}-leftovers.json`);
fs.writeFileSync(lf, JSON.stringify({ ...result, leftovers, standing }, null, 1));
console.log('RESULT', JSON.stringify(result));
console.log('leftovers file', rel(lf), fs.statSync(lf).size, 'bytes; standing diagnostics', standing.length, '; remaining refs', leftovers.remainingRefs.length, '; cycle-plain', leftovers.cyclePlain.length, '; getters skipped', leftovers.gettersSkipped.length);
const sampleOut = arg('sample-out');
if (sampleOut) for (const [f, t] of overlay) { if (t === null) continue; const d = path.join(ROOT, sampleOut, rel(f)); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.writeFileSync(d, t); }
if (flag('apply') || process.argv.includes('apply')) {
  const to = path.resolve(ROOT, arg('apply-to') ?? '.');
  for (const [f, t] of overlay) {
    const dest = path.join(to, rel(f));
    if (t === null) {
      const mv = path.join(to, 'tmp', 'deletions', process.env.CHUNK ?? 'W3', rel(f));
      fs.mkdirSync(path.dirname(mv), { recursive: true });
      if (fs.existsSync(dest)) fs.renameSync(dest, mv);
      else if (fs.existsSync(f)) fs.copyFileSync(f, mv);
    } else { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, t); }
  }
  console.log(`applied ${overlay.size} files under ${to}`);
}

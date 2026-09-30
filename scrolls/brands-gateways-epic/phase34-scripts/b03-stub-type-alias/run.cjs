// SD2 (B03 step 4 residue): a PRODUCTION file that imports a stub only to name its type,
//   import type { FlowStub } from '@dungeonmaster/shared/contracts';
//   type Flow = ReturnType<typeof FlowStub>;
// becomes
//   import type { Flow } from '@dungeonmaster/shared/contracts';
// so production imports no stub. Works on today's tree (barrel specifier) and after
// b03-per-file-imports has run (`.stub` specifier).
//
// Eligible only when EVERY use of the stub name is `ReturnType<typeof Stub>` as the whole initializer of
// a top-level `type <Alias> = ...`, and the stub's sibling `<x>-contract.ts` exports a type named
// exactly `<Alias>`. Anything else (a stub CALLED in production, an alias with another name, an alias
// whose name is already taken) goes to out/leftovers.json with its class.
//
// Writes nothing without `apply`. Never deletes: the alias line is removed from the file text only.
// Usage (from the repo root):
//   node scrolls/brands-gateways-epic/phase34-scripts/b03-stub-type-alias/run.cjs                       dry run, whole repo
//   node scrolls/brands-gateways-epic/phase34-scripts/b03-stub-type-alias/run.cjs --importers=orchestrator,web
//   node scrolls/brands-gateways-epic/phase34-scripts/b03-stub-type-alias/run.cjs --sample-out=<dir>    rewritten copies, repo-relative layout
//   node scrolls/brands-gateways-epic/phase34-scripts/b03-stub-type-alias/run.cjs ... apply
// Then: node scrolls/brands-gateways-epic/phase34-scripts/lib/verify-sample.cjs <dir>
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');

const { ts, ROOT, rel } = lib;
const args = process.argv.slice(2);
const flag = (n) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  return a ? a.slice(n.length + 3).split(',').filter(Boolean) : null;
};
const APPLY = args.includes('apply');
const importerFilter = flag('importers');
const sampleOut = flag('sample-out')?.[0] ?? null;
const OUT = lib.outDir(__dirname);
fs.mkdirSync(OUT, { recursive: true });

const ws = lib.workspaces();
const overlay = lib.plannedExportsOverlay(ws);
const resolveNow = lib.makeResolver();
const resolvePlanned = lib.makeResolver(overlay);

const isProduction = (f) => !lib.isTestSupport(f) && !/-contract\.tsx?$/u.test(f);

const specFor = (declFile, importer) => {
  const dw = lib.workspaceOf(declFile, ws);
  const iw = lib.workspaceOf(importer, ws);
  const noExt = declFile.replace(/\.tsx?$/u, '');
  if (dw === iw) {
    let r = path.relative(path.dirname(importer), noExt).split(path.sep).join('/');
    if (!r.startsWith('.')) r = './' + r;
    return r;
  }
  const src = path.join(dw.dir, 'src') + path.sep;
  return declFile.startsWith(src) ? `${dw.name}/${path.relative(src, noExt).split(path.sep).join('/')}` : null;
};

const contractExportsType = (contractFile, typeName) => {
  const sf = lib.parse(contractFile);
  return sf.statements.some(
    (st) =>
      ts.isTypeAliasDeclaration(st) &&
      st.name.text === typeName &&
      st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword),
  );
};

const classes = []; // { cls, file, name, detail }
const note = (cls, file, name, detail = {}) => classes.push({ cls, file: rel(file), name, ...detail });
const perPkg = {};
let diffText = '';
let filesChanged = 0;
let namesRemoved = 0;

const importerWs = ws.filter((w) => !w.isGateway && (!importerFilter || importerFilter.includes(w.short)));
for (const file of importerWs.flatMap((w) => lib.walk(w.dir))) {
  if (!isProduction(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  if (!/Stub\b/u.test(text)) continue;
  const sf = lib.parse(file, text);
  const decls = sf.statements.filter((st) => ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings));

  // Every stub import in this file: local name -> { st, el, stubFile }
  const stubs = [];
  for (const st of decls) {
    const spec = st.moduleSpecifier.text;
    const target = resolveNow(spec, file);
    if (!target) continue;
    for (const el of st.importClause.namedBindings.elements) {
      const imported = (el.propertyName ?? el.name).text;
      const found = lib.STUB_OR_PROXY_FILE.test(target) ? { file: target, kind: 'decl' } : lib.findDeclaringFile(target, imported, resolveNow);
      if (!found || found.kind !== 'decl' || !/\.stub\.tsx?$/u.test(found.file)) continue;
      stubs.push({ st, el, local: el.name.text, stubFile: found.file, spec });
    }
  }
  if (!stubs.length) continue;

  // Uses of each local name outside import declarations.
  const uses = new Map(stubs.map((s) => [s.local, []]));
  const visit = (n) => {
    if (ts.isImportDeclaration(n)) return;
    if (ts.isIdentifier(n) && uses.has(n.text)) uses.get(n.text).push(n);
    ts.forEachChild(n, visit);
  };
  visit(sf);
  const declaredNames = new Set();
  for (const st of sf.statements) {
    if ((ts.isTypeAliasDeclaration(st) || ts.isInterfaceDeclaration(st) || ts.isClassDeclaration(st) || ts.isFunctionDeclaration(st)) && st.name) declaredNames.add(st.name.text);
    if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name)) declaredNames.add(d.name.text);
  }

  const edits = [];
  const removeEls = new Map(); // st -> Set(el)
  const typeImports = new Map(); // spec -> { names:Set, anchor:st }
  const removedStatements = new Set();
  for (const s of stubs) {
    const ids = uses.get(s.local);
    if (!ids.length) {
      note('unused-stub-import', file, s.local);
      continue;
    }
    // Every use must be `ReturnType<typeof X>` that is the whole initializer of a top-level type alias.
    const aliases = [];
    let ok = true;
    for (const id of ids) {
      const q = id.parent; // TypeQuery
      const ref = q && ts.isTypeQueryNode(q) ? q.parent : null;
      const alias = ref && ts.isTypeReferenceNode(ref) && ref.typeName.getText(sf) === 'ReturnType' && ref.typeArguments?.length === 1 ? ref.parent : null;
      if (alias && ts.isTypeAliasDeclaration(alias) && alias.parent === sf && alias.type === ref) aliases.push(alias);
      else ok = false;
    }
    if (!ok) {
      note('stub-called-or-used-as-value', file, s.local, { uses: ids.length });
      continue;
    }
    if (aliases.length !== 1) {
      note('several-aliases', file, s.local);
      continue;
    }
    const alias = aliases[0];
    const typeName = alias.name.text;
    const contractFile = s.stubFile.replace(/\.stub\.tsx?$/u, '-contract.ts');
    if (!fs.existsSync(contractFile)) {
      note('no-sibling-contract', file, s.local);
      continue;
    }
    if (!contractExportsType(contractFile, typeName)) {
      note('alias-name-not-a-contract-type', file, s.local, { alias: typeName });
      continue;
    }
    // Where does `typeName` come from? Keep the current specifier when it already exports the type
    // from the contract; otherwise (a `.stub` specifier) use the contract's per-file specifier.
    let spec = s.spec;
    const viaSpec = resolveNow(spec, file);
    const declared = viaSpec && !lib.STUB_OR_PROXY_FILE.test(viaSpec) ? lib.findDeclaringFile(viaSpec, typeName, resolveNow) : null;
    if (!declared || declared.file !== contractFile) {
      spec = specFor(contractFile, file);
      const r = spec && (spec.startsWith('.') ? resolveNow : resolvePlanned)(spec, file);
      if (!spec || r !== contractFile) {
        note('type-specifier-unverified', file, s.local, { spec });
        continue;
      }
    }
    const takenByOther = declaredNames.has(typeName) && !aliases.includes(alias);
    const alreadyImported = decls.some((d) => d.importClause.namedBindings.elements.some((e) => e.name.text === typeName && !stubs.some((x) => x.el === e)));
    if (alreadyImported) {
      // The type is imported already; the alias and the stub import just go.
    } else if (takenByOther) {
      note('alias-name-taken', file, s.local, { alias: typeName });
      continue;
    } else {
      if (!typeImports.has(spec)) typeImports.set(spec, { names: new Set(), anchor: s.st });
      typeImports.get(spec).names.add(typeName);
    }
    // Remove the alias statement (its whole line) and the stub import element.
    const start = alias.getFullStart();
    const leading = text.slice(start, alias.getStart(sf));
    const jsdoc = /\/\*[\s\S]*?\*\//u.test(leading) || /\/\/.*$/mu.test(leading);
    edits.push({ start: jsdoc ? alias.getStart(sf) : start, end: alias.end, text: '' });
    if (!removeEls.has(s.st)) removeEls.set(s.st, new Set());
    removeEls.get(s.st).add(s.el);
    note('type-alias', file, s.local, { alias: typeName });
    namesRemoved++;
  }
  if (!removeEls.size) continue;

  // Rebuild each touched import statement; a type-only import for the new names goes at the anchor.
  const q = (st) => st.moduleSpecifier.getText(sf)[0];
  const mergedInto = new Set();
  for (const st of removeEls.keys()) {
    const gone = removeEls.get(st);
    const keep = st.importClause.namedBindings.elements.filter((e) => !gone.has(e));
    const parts = [];
    const sameSpec = typeImports.get(st.moduleSpecifier.text);
    const foldIn = sameSpec && sameSpec.anchor === st && st.importClause.isTypeOnly && !st.importClause.name ? [...sameSpec.names] : [];
    if (foldIn.length) mergedInto.add(st.moduleSpecifier.text);
    if (keep.length || foldIn.length || st.importClause.name) {
      const def = st.importClause.name?.text ?? null;
      const named = [...keep.map((e) => e.getText(sf)), ...foldIn];
      const body = [def, named.length ? `{ ${named.join(', ')} }` : null].filter(Boolean).join(', ');
      parts.push(`import${st.importClause.isTypeOnly ? ' type' : ''} ${body} from ${q(st)}${st.moduleSpecifier.text}${q(st)};`);
    }
    for (const [spec, t] of typeImports) {
      if (t.anchor !== st || mergedInto.has(spec)) continue;
      const existing = decls.find((d) => !removeEls.has(d) && d.moduleSpecifier.text === spec && d.importClause.isTypeOnly && !d.importClause.name);
      if (existing) continue;
      mergedInto.add(spec);
      parts.push(`import type { ${[...t.names].join(', ')} } from ${q(st)}${spec}${q(st)};`);
    }
    const dropLine = !parts.length && text[st.end] === '\n';
    edits.push({ start: st.getStart(sf), end: st.end + (dropLine ? 1 : 0), text: parts.join('\n') });
  }
  // Names whose specifier already has an untouched type-only import join it.
  for (const [spec, t] of typeImports) {
    if (mergedInto.has(spec)) continue;
    const existing = decls.find((d) => !removeEls.has(d) && d.moduleSpecifier.text === spec && d.importClause.isTypeOnly && !d.importClause.name);
    if (!existing) continue;
    const cur = existing.importClause.namedBindings.elements.map((e) => e.getText(sf));
    const els = [...cur, ...[...t.names].filter((n) => !cur.includes(n))];
    edits.push({ start: existing.getStart(sf), end: existing.end, text: `import type { ${els.join(', ')} } from ${q(existing)}${spec}${q(existing)};` });
  }
  const after = lib.applyEdits(text, edits).replace(/^[ \t]*\n(?=[ \t]*\n)/gmu, '').replace(/\n\n(?=\}|$)/gu, '\n');
  if (after === text) continue;
  filesChanged++;
  const pk = lib.workspaceOf(file, ws).short;
  perPkg[pk] = (perPkg[pk] ?? 0) + 1;
  diffText += lib.unifiedDiff(rel(file), text, after);
  if (sampleOut) {
    const dest = path.join(path.resolve(ROOT, sampleOut), rel(file));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, after);
  } else if (APPLY) fs.writeFileSync(file, after);
}

fs.writeFileSync(path.join(OUT, 'last-run.diff'), diffText);
const left = classes.filter((c) => c.cls !== 'type-alias');
fs.writeFileSync(path.join(OUT, 'leftovers.json'), JSON.stringify(left, null, 1));
fs.writeFileSync(path.join(OUT, 'classes.json'), JSON.stringify(classes, null, 1));
const by = {};
for (const c of classes) by[c.cls] = (by[c.cls] ?? 0) + 1;
console.log(APPLY ? 'APPLIED' : sampleOut ? `SAMPLE written to ${sampleOut}` : 'DRY RUN (pass "apply" to write)');
console.log({ filesChanged, stubNamesRemoved: namesRemoved });
console.log('files changed per package:', perPkg);
console.log('classification (names):', by);
console.log(`leftovers: ${rel(path.join(OUT, 'leftovers.json'))} (${left.length} names)`);

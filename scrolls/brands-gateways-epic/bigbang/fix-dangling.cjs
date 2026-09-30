// Finish the brand-migration rewrite in files that still import a moved brand contract / stub / type.
//
// Driven by TS2307 / TS2305 / TS2724 in a diag json (default tmp/bigbang/logs/diag-r2.json). For each such error whose
// missing file (or missing name) is a brand that was moved to tmp/deletions/<wave>/<repo path>, the importing file is
// rewritten:
//   type ref `T` / `z.infer<typeof c>` / `ReturnType<typeof TStub>`  -> string | number   (owner id: Owner['key'])
//   `TStub({ value: v })` -> v ;  `TStub()` -> the moved stub's default literal
//   `c.parse(v)` -> v                                               (owner id: ownerContract.shape.key.parse(v))
//   a field `key: c` (also c.optional(), z.array(c)) in an object contract -> base schema + .brand<'<Owner><Key>'>()
//                                                                    (owner id: ownerContract.shape.key)
//   the dead import (or the dead names of a multi-name import) is removed; a dead `export ... from` line is removed.
// A dead name with any reference left unrewritten keeps its import, and every such site goes to the leftovers file.
//
// Usage: node tmp/bigbang/fix-dangling.cjs [--diag=file] [apply]
const fs = require('fs');
const path = require('path');
const lib = require('../phase34/lib/repo.cjs');

const { ts, ROOT, rel } = lib;
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const APPLY = process.argv.includes('apply');
const diagFile = path.resolve(ROOT, arg('diag') ?? 'tmp/bigbang/logs/diag-r2.json');
const leftFile = path.join(ROOT, 'tmp/bigbang/logs/dangling-leftovers.txt');
const changedFile = path.join(ROOT, 'tmp/bigbang/logs/dangling-changed.txt');
const ws = lib.workspaces();
// Originals: the first apply copies each file it changes here; every later run rewrites from that copy, so a re-run with a
// longer hold list starts from the same text and the edit ids (kind@offset into the original) stay stable.
const ORIG = path.join(ROOT, 'tmp/bigbang/state/dangling-orig');
const manifestFile = path.join(ROOT, 'tmp/bigbang/logs/dangling-manifest.json');
const holdsFile = path.join(ROOT, 'tmp/bigbang/logs/dangling-holds.json');
const holds = new Map(); // `${file}|${id}` -> reason ; id '*' holds every edit in the file
if (fs.existsSync(holdsFile)) for (const h of JSON.parse(fs.readFileSync(holdsFile, 'utf8'))) holds.set(`${h.file}|${h.id}`, h.reason);
const manifest = [];
const resolver = lib.makeResolver();
const pascal = (s) => s.replace(/(^|[_\-\s]+)([a-zA-Z0-9])/gu, (_, __, c) => c.toUpperCase());

// ---------------------------------------------------------------- registry of moved files
const DEL = path.join(ROOT, 'tmp', 'deletions');
const WAVE_ORDER = ['W5', 'W4', 'W3', 'W1', 'W2'];
const waves = fs.readdirSync(DEL).sort((a, b) => (WAVE_ORDER.indexOf(b) - WAVE_ORDER.indexOf(a)));
const movedByOrig = new Map(); // original abs path -> moved abs path
for (const w of waves) {
  const base = path.join(DEL, w);
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.tsx?$/u.test(e.name)) {
        const orig = path.join(ROOT, path.relative(base, p));
        if (!movedByOrig.has(orig) || WAVE_ORDER.includes(w)) movedByOrig.set(orig, { moved: p, wave: w });
      }
    }
  };
  walk(base);
}

// owner-id brands (W3/W4): const -> { ownerConst, ownerFile, key, ownerTypeName }
const ownerIds = new Map();
for (const f of fs.readdirSync(path.join(ROOT, 'tmp/bigbang/logs'))) {
  if (!/^W[34]-.*\.log$/u.test(f)) continue;
  const first = fs.readFileSync(path.join(ROOT, 'tmp/bigbang/logs', f), 'utf8').split('\n')[0];
  const j = JSON.parse(first.replace(/^\[\d+s\]\s*/u, ''));
  for (const g of j.group) ownerIds.set(path.join(ROOT, g.file), { ownerConst: j.ownerConst, ownerFile: path.join(ROOT, j.owner), key: j.key, ownerTypeName: j.ownerTypeName, const: g.const, type: g.type });
}

// a brand definition from a moved contract file (keyed by ORIGINAL contract path)
// Base schema text: the initializer minus its trailing `.brand<'X'>()`, comments dropped, whitespace collapsed (scanner-based,
// so string and regex literals are untouched). Free identifiers of the base (not `z`, not bound inside it) are resolved
// through the moved file's own imports: a moved brand is replaced by its own base schema (recursively), an existing file
// becomes an import the user file needs; a constant local to the moved file makes the base not inlineable.
const flatText = (node, sf, subs) => {
  // subs: [{start,end,text}] absolute positions inside node, replaced before flattening
  const raw = lib.applyEdits(sf.text.slice(node.getStart(sf), node.end), subs.map((x) => ({ ...x, start: x.start - node.getStart(sf), end: x.end - node.getStart(sf) })));
  const sc = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, raw);
  const toks = [];
  const stack = [];
  for (let k = sc.scan(); k !== ts.SyntaxKind.EndOfFileToken; k = sc.scan()) {
    if (k === ts.SyntaxKind.SingleLineCommentTrivia || k === ts.SyntaxKind.MultiLineCommentTrivia) continue;
    if (k === ts.SyntaxKind.WhitespaceTrivia || k === ts.SyntaxKind.NewLineTrivia) { if (toks.at(-1) !== ' ') toks.push(' '); continue; }
    if (k === ts.SyntaxKind.SlashToken || k === ts.SyntaxKind.SlashEqualsToken) { const r = sc.reScanSlashToken(); if (r === ts.SyntaxKind.RegularExpressionLiteral) { toks.push(sc.getTokenText()); continue; } }
    if (k === ts.SyntaxKind.OpenBraceToken) stack.push('b');
    if (k === ts.SyntaxKind.TemplateHead) stack.push('t');
    if (k === ts.SyntaxKind.CloseBraceToken) {
      if (stack.at(-1) === 't') { const r = sc.reScanTemplateToken(false); if (r === ts.SyntaxKind.TemplateTail) stack.pop(); toks.push(sc.getTokenText()); continue; }
      stack.pop();
    }
    toks.push(sc.getTokenText());
  }
  let out = '';
  for (let x = 0; x < toks.length; x++) {
    const t = toks[x];
    if (t !== ' ') { out += t; continue; }
    const prev = out.at(-1);
    const next = toks[x + 1] ?? '';
    if (!out || !next || /^[.,)\]]/u.test(next) || prev === '(' || prev === '[') continue;
    out += ' ';
  }
  return out;
};
const freeIds = (node, sf) => {
  const bound = new Set();
  const found = [];
  const collectBind = (b) => { if (ts.isIdentifier(b)) bound.add(b.text); else if (b && (ts.isObjectBindingPattern(b) || ts.isArrayBindingPattern(b))) b.elements.forEach((e) => e.name && collectBind(e.name)); };
  const v1 = (n) => { if ((ts.isParameter(n) || ts.isVariableDeclaration(n)) && n.name) collectBind(n.name); ts.forEachChild(n, v1); };
  v1(node);
  const v2 = (n) => {
    if (ts.isIdentifier(n)) {
      const p = n.parent;
      const isName = (ts.isPropertyAccessExpression(p) && p.name === n) || (ts.isPropertyAssignment(p) && p.name === n) || ((ts.isParameter(p) || ts.isVariableDeclaration(p) || ts.isBindingElement(p)) && p.name === n) || (ts.isShorthandPropertyAssignment(p) && false);
      if (!isName && !bound.has(n.text) && n.text !== 'z' && !['undefined', 'String', 'Number', 'RegExp', 'Boolean', 'Array', 'Object', 'JSON', 'Math', 'Date', 'Error'].includes(n.text)) found.push(n);
    }
    ts.forEachChild(n, v2);
  };
  v2(node);
  return found;
};
const defCache = new Map();
const loadDef = (origContract, depth = 0) => {
  if (defCache.has(origContract)) return defCache.get(origContract);
  let def = null;
  const m = movedByOrig.get(origContract);
  if (m && depth < 5) {
    const csf = lib.parse(m.moved);
    let constName = null;
    let init = null;
    let typeName = null;
    for (const st of csf.statements) {
      if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name) && /Contract$/u.test(d.name.text) && d.initializer) { constName = d.name.text; init = d.initializer; }
    }
    for (const st of csf.statements) if (ts.isTypeAliasDeclaration(st) && constName && st.type.getText(csf).includes(`typeof ${constName}`)) typeName = st.name.text;
    const isBrand = !!init && ts.isCallExpression(init) && ts.isPropertyAccessExpression(init.expression) && init.expression.name.text === 'brand' && init.arguments.length === 0;
    if (constName && isBrand) {
      const baseNode = init.expression.expression;
      // free identifiers of the base
      const imports = new Map(); // name -> target file (existing)
      const subs = [];
      let why = null;
      let subKind = null;
      for (const id of freeIds(baseNode, csf)) {
        let spec = null;
        let imported = id.text;
        for (const st of csf.statements) if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) for (const e of st.importClause.namedBindings.elements) if (e.name.text === id.text) { spec = st.moduleSpecifier.text; imported = (e.propertyName ?? e.name).text; }
        if (!spec) {
          // a literal constant local to the moved contract is inlined as its literal
          let lit = null;
          for (const st of csf.statements) if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name) && d.name.text === id.text && d.initializer && !d.type && (ts.isNumericLiteral(d.initializer) || ts.isStringLiteral(d.initializer) || ts.isRegularExpressionLiteral(d.initializer) || ts.isNoSubstitutionTemplateLiteral(d.initializer))) lit = d.initializer.getText(csf);
          if (lit !== null) { subs.push({ start: id.getStart(csf), end: id.end, text: lit }); continue; }
          why = why ?? `base schema needs ${id.text}, a non-literal local of the moved contract`;
          continue;
        }
        const target = resolver(spec, origContract) ?? (spec.startsWith('.') ? path.resolve(path.dirname(origContract), `${spec}.ts`) : null);
        if (target && movedByOrig.has(target)) {
          const sub = loadDef(target, depth + 1);
          if (!sub || sub.notBrand || !sub.inline) { why = why ?? `base schema names moved ${id.text}, itself not inlineable`; continue; }
          subs.push({ start: id.getStart(csf), end: id.end, text: sub.inline.text });
          for (const [a, b] of sub.inline.imports) imports.set(a, b);
          subKind = subKind ?? sub.kind;
          continue;
        }
        if (!target || !fs.existsSync(target)) { why = why ?? `base schema import ${spec} does not resolve`; continue; }
        const decl = lib.findDeclaringFile(target, imported, resolver);
        if (imported !== id.text || !decl) { why = why ?? `base schema import ${id.text} not re-importable`; continue; }
        imports.set(id.text, decl.file);
      }
      const baseText = flatText(baseNode, csf, subs);
      if (/\.(transform|pipe)\(/u.test(baseText)) why = why ?? 'base schema transforms its value (output is not a plain string/number)';
      let kind = 'string';
      if (/^z\.(number|int|coerce\.number)\b/u.test(baseText)) kind = 'number';
      else if (/^z\.union\(\[z\.number\(\), z\.string\(\)\]\)$/u.test(baseText)) kind = 'number | string';
      else if (/^z\.union\(\[z\.string\(\), z\.number\(\)\]\)$/u.test(baseText)) kind = 'string | number';
      else if (subKind && !/^z\./u.test(sf_text(baseNode, csf))) kind = subKind;
      const stubOrig = path.join(path.dirname(origContract), `${path.basename(origContract).replace(/-contract\.ts$/u, '')}.stub.ts`);
      let stubDefault = null;
      let stubName = typeName ? `${typeName}Stub` : null;
      const sm = movedByOrig.get(stubOrig);
      if (sm) {
        const st = fs.readFileSync(sm.moved, 'utf8');
        const nm = /export const (\w+Stub)\b/u.exec(st);
        if (nm) stubName = nm[1];
        const LIT = `('[^'\\n]*'|"[^"\\n]*"|\`[^\`\\n$]*\`|-?\\d+(?:\\.\\d+)?|[A-Z_][A-Z0-9_]*)`;
        const dm = new RegExp(`value\\s*\\?\\?\\s*${LIT}`, 'u').exec(st) ?? new RegExp(`value(?:\\s*=\\s*|:\\s*)${LIT}`, 'u').exec(st.replace(/value\??:\s*(string|number)/gu, ''));
        stubDefault = dm ? dm[1] : null;
        if (stubDefault && /^[A-Z_]/u.test(stubDefault)) {
          const cm = new RegExp(`const ${stubDefault}\\s*=\\s*('[^'\\n]*'|"[^"\\n]*"|-?\\d+(?:\\.\\d+)?)\\s*;`, 'u').exec(st);
          stubDefault = cm ? cm[1] : null;
        }
      }
      def = { origContract, wave: m.wave, constName, typeName, stubName, kind, stubDefault, owner: ownerIds.get(origContract) ?? null, inline: why ? null : { text: baseText, imports }, why };
    } else def = { origContract, notBrand: true, constName, wave: m.wave };
  }
  defCache.set(origContract, def);
  return def;
};
const sf_text = (n, sf) => n.getText(sf);
// every moved contract, by the names it exported
const byName = new Map();
for (const orig of movedByOrig.keys()) {
  if (!/-contract\.ts$/u.test(orig)) continue;
  const d = loadDef(orig);
  if (!d || d.notBrand) continue;
  for (const [n, role] of [[d.constName, 'contract'], [d.typeName, 'type'], [d.stubName, 'stub']]) {
    if (!n) continue;
    if (!byName.has(n)) byName.set(n, []);
    byName.get(n).push({ def: d, role });
  }
}
const pkgDirOf = (abs) => ws.find((w) => abs.startsWith(w.dir + path.sep))?.dir ?? null;
const contractOfFile = (orig) => {
  if (/-contract\.ts$/u.test(orig)) return orig;
  if (/\.stub\.ts$/u.test(orig)) return orig.replace(/\.stub\.ts$/u, '-contract.ts');
  return null;
};
// the original path a module specifier named, when that file is gone
const origOfSpec = (spec, fromFile) => {
  if (spec.startsWith('.')) return path.resolve(path.dirname(fromFile), `${spec}.ts`);
  const w = ws.filter((x) => spec === x.name || spec.startsWith(`${x.name}/`)).sort((a, b) => b.name.length - a.name.length)[0];
  if (!w) return null;
  const restPart = spec.slice(w.name.length + 1);
  for (const c of [path.join(w.dir, 'src', `${restPart}.ts`), path.join(w.dir, `${restPart}.ts`)]) if (movedByOrig.has(c)) return c;
  return path.join(w.dir, 'src', `${restPart}.ts`);
};
const specPkgDir = (spec, fromFile) => {
  const r = resolver(spec, fromFile);
  if (r) return pkgDirOf(r);
  const w = ws.find((x) => spec === x.name || spec.startsWith(`${x.name}/`));
  return w?.dir ?? null;
};

// ---------------------------------------------------------------- per-file rewrite
const diags = JSON.parse(fs.readFileSync(diagFile, 'utf8')).filter((e) => [2307, 2305, 2724].includes(e.code));
const byFile = new Map();
for (const e of diags) { if (!byFile.has(e.file)) byFile.set(e.file, []); byFile.get(e.file).push(e); }

const stats = {};
const bump = (k, n = 1) => { stats[k] = (stats[k] ?? 0) + n; };
const leftovers = [];
const samples = [];
const changed = [];
const needParen = (n) => ts.isBinaryExpression(n) || ts.isConditionalExpression(n) || ts.isArrowFunction(n) || ts.isAsExpression(n) || ts.isAwaitExpression(n) || ts.isSatisfiesExpression(n);
const isObjectCtor = (call) => /(^|\.)(object|strictObject|looseObject|extend|merge|safeExtend)$/u.test(call.expression.getText()) && !/^Object\./u.test(call.expression.getText());
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
  let ownerType = null;
  for (const st of sf.statements) if (ts.isTypeAliasDeclaration(st) && new RegExp(`^z\\.(infer|output)<\\s*typeof ${ownerConst}\\s*>$`, 'u').test(st.type.getText(sf))) ownerType = st.name.text;
  const k = keys.reverse();
  return { text: (ownerType ?? pascal(ownerConst.replace(/Contract$/u, ''))) + k.map(pascal).join(''), ownerConst };
};
const specFor = (fromFile, targetFile, name) => {
  const wf = pkgDirOf(fromFile);
  const wt = ws.find((w) => w.dir === pkgDirOf(targetFile));
  if (wf === wt.dir) {
    let r = path.relative(path.dirname(fromFile), targetFile).replace(/\.tsx?$/u, '').split(path.sep).join('/');
    if (!r.startsWith('.')) r = `./${r}`;
    return r;
  }
  for (const s of [`${wt.name}/contracts`, `${wt.name}/${path.relative(path.join(wt.dir, 'src'), targetFile).replace(/\.tsx?$/u, '').split(path.sep).join('/')}`]) {
    const r = resolver(s, fromFile);
    const d = r && lib.findDeclaringFile(r, name, resolver);
    if (d && path.resolve(d.file) === path.resolve(targetFile)) return s;
  }
  return null;
};

for (const [relFile, errs] of byFile) {
  const f = path.join(ROOT, relFile);
  const origCopy = path.join(ORIG, relFile);
  if (!fs.existsSync(f) && !fs.existsSync(origCopy)) continue;
  const text = fs.readFileSync(fs.existsSync(origCopy) ? origCopy : f, 'utf8');
  // a file this script already rewrote goes back to its original first; the edits below are re-derived from it
  if (APPLY && fs.existsSync(origCopy) && fs.readFileSync(f, 'utf8') !== text) fs.writeFileSync(f, text);
  const sf = lib.parse(f, text);
  const lineOf = (pos) => sf.getLineAndCharacterOfPosition(pos).line + 1;
  const errLines = new Set(errs.map((e) => e.line));
  const edits = [];
  const addImports = new Map(); // name -> { spec, typeOnly }
  // dead bindings: local name -> { def, role, el, st }
  const dead = new Map();
  const deadStatements = [];
  for (const st of sf.statements) {
    const isImp = ts.isImportDeclaration(st);
    const isExp = ts.isExportDeclaration(st) && st.moduleSpecifier;
    if (!isImp && !isExp) continue;
    const l0 = lineOf(st.getStart(sf));
    const l1 = lineOf(st.end);
    const hit = errs.filter((e) => e.line >= l0 && e.line <= l1);
    if (!hit.length) continue;
    const spec = st.moduleSpecifier.text;
    const whole = hit.find((e) => e.code === 2307);
    const els = isImp ? (st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings) ? [...st.importClause.namedBindings.elements] : []) : (st.exportClause && ts.isNamedExports(st.exportClause) ? [...st.exportClause.elements] : []);
    if (whole) {
      const orig = origOfSpec(spec, f);
      if (!orig || !movedByOrig.has(orig)) { leftovers.push(`${relFile}:${l0} | TS2307 ${spec}: not a moved file`); bump('skip-not-moved'); continue; }
      const cf = contractOfFile(orig);
      const def = cf && loadDef(cf);
      if (!def || def.notBrand) { leftovers.push(`${relFile}:${l0} | TS2307 ${spec}: moved file is not a standalone brand contract/stub`); bump('skip-not-brand'); continue; }
      if (isExp) { deadStatements.push({ st, kind: 'dead-reexport' }); continue; }
      if (st.importClause?.name || (st.importClause?.namedBindings && !ts.isNamedImports(st.importClause.namedBindings))) { leftovers.push(`${relFile}:${l0} | default/namespace import of moved ${spec}`); continue; }
      for (const el of els) {
        const imported = (el.propertyName ?? el.name).text;
        const role = imported === def.constName ? 'contract' : imported === def.typeName ? 'type' : imported === def.stubName ? 'stub' : null;
        if (!role) { leftovers.push(`${relFile}:${lineOf(el.getStart(sf))} | ${imported} is not an export of moved ${spec}`); continue; }
        dead.set(el.name.text, { def, role, el, st });
      }
      continue;
    }
    for (const e of hit) {
      const nm = /exported member (?:named )?'([^']+)'/u.exec(e.message)?.[1];
      const el = els.find((x) => (x.propertyName ?? x.name).text === nm);
      if (!nm || !el) { leftovers.push(`${relFile}:${e.line} | TS${e.code} name not located in import`); continue; }
      const pdir = specPkgDir(spec, f);
      let cands = (byName.get(nm) ?? []).filter((c) => pdir && c.def.origContract.startsWith(pdir + path.sep));
      if (!cands.length) cands = byName.get(nm) ?? [];
      const uniq = [...new Map(cands.map((c) => [`${c.def.kind}|${c.def.inline?.text}|${c.role}|${c.def.owner?.ownerConst}`, c])).values()];
      if (!uniq.length) { leftovers.push(`${relFile}:${e.line} | TS${e.code} ${nm}: not a moved brand`); bump('skip-not-moved'); continue; }
      const pick = uniq.length === 1 ? uniq[0] : (uniq.every((c) => c.role === uniq[0].role && c.def.kind === uniq[0].def.kind && !c.def.owner && c.role !== 'contract' && c.role !== 'stub') ? uniq[0] : null);
      if (!pick) { leftovers.push(`${relFile}:${e.line} | TS${e.code} ${nm}: ambiguous — ${uniq.length} moved brands carry this name`); continue; }
      if (isExp) { deadStatements.push({ st, el, kind: 'dead-reexport' }); continue; }
      dead.set(el.name.text, { def: pick.def, role: pick.role, el, st });
    }
  }
  if (!dead.size && !deadStatements.length) continue;

  // ---- references
  const unresolved = new Map(); // local name -> count
  const cands = [];
  const HOLDABLE = /^(type-ref|parse-|stub-|field-)/u;
  const add = (start, end, t, kind, brandText) => {
    const id = `${kind}@${start}`;
    const why = HOLDABLE.test(kind) && (holds.get(`${relFile}|${id}`) ?? holds.get(`${relFile}|*`));
    if (why) {
      const src = text.slice(start, end);
      for (const nm of dead.keys()) if (new RegExp(`\\b${nm}\\b`, 'u').test(src)) unresolved.set(nm, (unresolved.get(nm) ?? 0) + 1);
      leftovers.push(`${relFile}:${lineOf(start)} | held: ${why} — ${src.replace(/\s+/gu, ' ').slice(0, 90)}`);
      bump('held');
      return;
    }
    cands.push({ start, end, text: t, kind, id, brandText });
  };
  // parentheses only where the replaced call's position binds tighter than the value it becomes
  const wrap = (callNode, valueNode, t) => {
    if (!needParen(valueNode)) return t;
    const p = callNode.parent;
    const loose = (ts.isVariableDeclaration(p) && p.initializer === callNode) || (ts.isPropertyAssignment(p) && p.initializer === callNode) || (ts.isCallExpression(p) && p.arguments.includes(callNode)) || ts.isReturnStatement(p) || ts.isArrayLiteralExpression(p) || ts.isParenthesizedExpression(p) || ts.isJsxExpression(p) || ts.isTemplateSpan(p) || (ts.isArrowFunction(p) && p.body === callNode && !ts.isObjectLiteralExpression(valueNode));
    return loose ? t : `(${t})`;
  };
  const ownerImport = (def, typeOnly) => {
    const o = def.owner;
    const name = typeOnly ? o.ownerTypeName : o.ownerConst;
    const spec = specFor(f, o.ownerFile, name);
    if (!spec) return false;
    addImports.set(name, { spec, typeOnly });
    return true;
  };
  const localNames = new Set();
  for (const st of sf.statements) if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) for (const e of st.importClause.namedBindings.elements) localNames.add(e.name.text);
  const kindText = (d) => (d.owner ? `${d.owner.ownerTypeName}['${d.owner.key}']` : d.kind);
  const miss = (n, name, why) => { unresolved.set(name, (unresolved.get(name) ?? 0) + 1); leftovers.push(`${relFile}:${lineOf(n.getStart(sf))} | ${name}: ${why} — ${n.parent.getText(sf).slice(0, 90).replace(/\s+/gu, ' ')}`); };
  const deadOf = (id, role) => { const d = ts.isIdentifier(id) && dead.get(id.text); return d && (!role || d.role === role) ? d : null; };
  const visit = (n) => {
    if (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) return;
    // type positions
    if (ts.isTypeReferenceNode(n) && ts.isIdentifier(n.typeName) && deadOf(n.typeName, 'type')) {
      const d = deadOf(n.typeName).def;
      if (d.owner && !ownerImport(d, true)) { miss(n, n.typeName.text, 'no import path for owner type'); return; }
      add(n.getStart(sf), n.end, kindText(d), 'type-ref'); return;
    }
    if (ts.isTypeReferenceNode(n) && n.typeArguments?.length === 1 && ts.isTypeQueryNode(n.typeArguments[0]) && ts.isIdentifier(n.typeArguments[0].exprName)) {
      const tn = n.typeName.getText(sf);
      const id = n.typeArguments[0].exprName;
      const d = (tn === 'ReturnType' && deadOf(id, 'stub')) || (/^z\.(infer|output|input)$/u.test(tn) && deadOf(id, 'contract'));
      if (d) {
        if (d.def.owner && !ownerImport(d.def, true)) { miss(n, id.text, 'no import path for owner type'); return; }
        add(n.getStart(sf), n.end, kindText(d.def), 'type-ref'); return;
      }
    }
    if (ts.isTypeReferenceNode(n) && n.typeName.getText(sf) === 'ReturnType' && n.typeArguments?.length === 1 && ts.isTypeQueryNode(n.typeArguments[0]) && ts.isQualifiedName(n.typeArguments[0].exprName) && n.typeArguments[0].exprName.right.text === 'parse' && ts.isIdentifier(n.typeArguments[0].exprName.left) && deadOf(n.typeArguments[0].exprName.left, 'contract')) {
      const d = deadOf(n.typeArguments[0].exprName.left).def;
      if (d.owner && !ownerImport(d, true)) { miss(n, n.typeArguments[0].exprName.left.text, 'no import path for owner type'); return; }
      add(n.getStart(sf), n.end, kindText(d), 'type-ref'); return;
    }
    // c.parse(v)
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && deadOf(n.expression.expression, 'contract') && n.expression.name.text === 'parse' && n.arguments.length === 1) {
      const d = deadOf(n.expression.expression).def;
      const a = n.arguments[0];
      const inner = cands.length; ts.forEachChild(a, visit); const innerEdits = cands.splice(inner);
      const aText = lib.applyEdits(a.getText(sf), innerEdits.map((e) => ({ ...e, start: e.start - a.getStart(sf), end: e.end - a.getStart(sf) })));
      if (d.owner) {
        if (!ownerImport(d, false)) { miss(n, n.expression.expression.text, 'no import path for owner contract'); return; }
        add(n.getStart(sf), n.end, `${d.owner.ownerConst}.shape.${d.owner.key}.parse(${aText})`, 'parse-owner');
      } else add(n.getStart(sf), n.end, wrap(n, a, aText), 'parse-plain');
      return;
    }
    // TStub(...)
    if (ts.isCallExpression(n) && deadOf(n.expression, 'stub')) {
      const d = deadOf(n.expression).def;
      const a = n.arguments[0];
      if (!a) {
        if (d.owner) { miss(n, n.expression.text, 'owner-id stub default'); return; }
        if (!d.stubDefault) { miss(n, n.expression.text, 'stub default not found in moved stub'); return; }
        add(n.getStart(sf), n.end, d.stubDefault, 'stub-default'); return;
      }
      if (n.arguments.length === 1 && ts.isObjectLiteralExpression(a) && a.properties.length === 1 && a.properties[0].name?.getText(sf) === 'value' && (ts.isPropertyAssignment(a.properties[0]) || ts.isShorthandPropertyAssignment(a.properties[0]))) {
        const p = a.properties[0];
        const v = ts.isPropertyAssignment(p) ? p.initializer : p.name;
        const inner = cands.length; ts.forEachChild(v, visit); const innerEdits = cands.splice(inner);
        const vText = lib.applyEdits(v.getText(sf), innerEdits.map((e) => ({ ...e, start: e.start - v.getStart(sf), end: e.end - v.getStart(sf) })));
        if (d.owner) {
          if (!ownerImport(d, false)) { miss(n, n.expression.text, 'no import path for owner contract'); return; }
          add(n.getStart(sf), n.end, `${d.owner.ownerConst}.shape.${d.owner.key}.parse(${vText})`, 'stub-owner');
        } else add(n.getStart(sf), n.end, wrap(n, v, vText), 'stub-value');
        return;
      }
      miss(n, n.expression.text, 'stub called with an argument other than { value }'); return;
    }
    if (ts.isIdentifier(n) && dead.has(n.text) && !(ts.isPropertyAccessExpression(n.parent) && n.parent.name === n) && !(ts.isPropertyAssignment(n.parent) && n.parent.name === n) && !(ts.isQualifiedName(n.parent) && n.parent.right === n) && !(ts.isImportSpecifier(n.parent) || ts.isExportSpecifier(n.parent))) {
      const { def: d, role } = dead.get(n.text);
      if (role === 'contract') {
        const info = describeField(n, sf);
        if (!info) { miss(n, n.text, 'contract used outside an object contract field'); return; }
        if (d.owner) {
          if (!ownerImport(d, false)) { miss(n, n.text, 'no import path for owner contract'); return; }
          add(n.getStart(sf), n.end, `${d.owner.ownerConst}.shape.${d.owner.key}`, 'field-owner'); return;
        }
        if (!d.inline) { miss(n, n.text, d.why); return; }
        for (const [nm, file] of d.inline.imports) {
          if (localNames.has(nm) && !dead.has(nm)) continue;
          const spec = specFor(f, file, nm);
          if (!spec) { miss(n, n.text, `no import path for ${nm} (base schema)`); return; }
          addImports.set(nm, { spec, typeOnly: false });
        }
        add(n.getStart(sf), n.end, `${d.inline.text}.brand<'${info.text}'>()`, 'field-inline', info.text); return;
      }
      miss(n, n.text, `unhandled ${role} reference (${ts.SyntaxKind[n.parent.kind]})`); return;
    }
    ts.forEachChild(n, visit);
  };
  sf.statements.forEach(visit);

  // ---- import / export removals
  const removeEls = new Map(); // statement -> elements to drop
  for (const [local, d] of dead) {
    if (unresolved.has(local)) continue;
    if (!removeEls.has(d.st)) removeEls.set(d.st, []);
    removeEls.get(d.st).push(d.el);
  }
  for (const ds of deadStatements) {
    if (!ds.el) { removeEls.set(ds.st, 'all'); continue; }
    if (removeEls.get(ds.st) === 'all') continue;
    if (!removeEls.has(ds.st)) removeEls.set(ds.st, []);
    removeEls.get(ds.st).push(ds.el);
  }
  const pending = [...addImports];
  for (const [st, drop] of removeEls) {
    const all = ts.isImportDeclaration(st) ? st.importClause?.namedBindings?.elements ?? [] : st.exportClause?.elements ?? [];
    const kind = ts.isImportDeclaration(st) ? 'import-drop' : 'reexport-drop';
    if (drop === 'all' || (drop.length === all.length && !st.importClause?.name)) {
      const le = text.indexOf('\n', st.end);
      add(st.getStart(sf), le === -1 ? st.end : le + 1, '', kind);
      continue;
    }
    for (const el of drop) {
      const i = all.indexOf(el);
      if (i < all.length - 1) add(el.getStart(sf), all[i + 1].getStart(sf), '', kind);
      else add(all[i - 1].end, el.end, '', kind);
    }
  }
  if (!cands.length) continue;
  // owner imports: join an existing named import of the same specifier, else a new line after the last import
  const imps = sf.statements.filter(ts.isImportDeclaration);
  for (const [name, { spec, typeOnly }] of pending) {
    const have = imps.some((st) => st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings) && st.importClause.namedBindings.elements.some((e) => e.name.text === name) && !removeEls.has(st));
    if (have) continue;
    const same = imps.find((st) => st.moduleSpecifier.text === spec && !removeEls.has(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings) && !!st.importClause.isTypeOnly === typeOnly && st.importClause.namedBindings.elements.length);
    if (same) { const last = same.importClause.namedBindings.elements.at(-1); add(last.end, last.end, `, ${name}`, 'import-add'); continue; }
    const last = imps.at(-1);
    add(last ? last.end : 0, last ? last.end : 0, `${last ? '\n' : ''}import${typeOnly ? ' type' : ''} { ${name} } from '${spec}';${last ? '' : '\n'}`, 'import-add');
  }
  // keep inner edits out (outer wins), merge same-point inserts
  const flat = cands.filter((c) => !cands.some((o) => o !== c && o.start <= c.start && o.end >= c.end && (o.start !== c.start || o.end !== c.end) && o.end > o.start));
  const out = lib.applyEdits(text, flat);
  if (out === text) continue;
  for (const c of flat) {
    bump(c.kind);
    samples.push({ file: relFile, line: lineOf(c.start), kind: c.kind, before: text.slice(c.start, c.end).replace(/\s+/gu, ' ').slice(0, 100), after: c.text.replace(/\s+/gu, ' ').slice(0, 120) });
  }
  // sanity: the result still parses
  const sf2 = lib.parse(f, out);
  if (sf2.parseDiagnostics?.length) { leftovers.push(`${relFile}:1 | rewrite produced a syntax error; file not written`); bump('syntax-reject'); continue; }
  changed.push(relFile);
  // where each edit landed in the output, for the hold derivation
  let delta = 0;
  const outSf = lib.parse(f, out);
  for (const c of [...flat].sort((x, y) => x.start - y.start)) {
    const ns = c.start + delta;
    const ne = ns + c.text.length;
    delta += c.text.length - (c.end - c.start);
    if (!HOLDABLE.test(c.kind)) continue;
    manifest.push({ file: relFile, id: c.id, kind: c.kind, brandText: c.brandText ?? null, line0: outSf.getLineAndCharacterOfPosition(ns).line + 1, line1: outSf.getLineAndCharacterOfPosition(ne).line + 1 });
  }
  if (APPLY) {
    if (!fs.existsSync(origCopy)) { fs.mkdirSync(path.dirname(origCopy), { recursive: true }); fs.writeFileSync(origCopy, text); }
    fs.writeFileSync(f, out);
  }
  if (arg('sample-out')) { const d = path.join(arg('sample-out'), relFile); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.writeFileSync(d, out); }
}

fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 1));
fs.writeFileSync(leftFile, `${leftovers.join('\n')}\n`);
fs.writeFileSync(changedFile, `${changed.join('\n')}\n`);
fs.writeFileSync(path.join(ROOT, 'tmp/bigbang/logs/dangling-samples.json'), JSON.stringify(samples, null, 1));
console.log(APPLY ? 'APPLIED' : 'DRY RUN', JSON.stringify(stats, null, 1));
console.log('files changed', changed.length, '| leftovers', leftovers.length);
const reasons = {};
for (const l of leftovers) { const r = l.split(' | ')[1].replace(/^[\w$]+: /u, '').replace(/ — .*$/u, '').replace(/TS\d+ \S+: /u, '').replace(/'[^']*'|\S+\/\S+/gu, 'X'); reasons[r] = (reasons[r] ?? 0) + 1; }
console.log(JSON.stringify(Object.entries(reasons).sort((a, b) => b[1] - a[1]), null, 1));

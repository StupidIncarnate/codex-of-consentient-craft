// B17 C4 rewrite (SD9): every JSON.parse(..) / <expr>.json() in production code outside the gateway that does not go
// straight into a contract's parse, classified by where the raw value goes next; the classes a script can rewrite
// without a decision are rewritten, the rest go to a leftovers file with the reason.
//
//   single-use     const raw: unknown = JSON.parse(x);  ...  fooContract.parse(raw)
//                  -> fooContract.parse(JSON.parse(x))            (decl removed, the `as unknown` / annotation goes with it)
//   multi-parse    every use of the var is a contract parse/safeParse, two or more of them, and the parse argument is
//                  a plain identifier/member chain: each use gets its own JSON.parse(x) (a reparse, on purpose: it is
//                  the only shape the C4 rule reads as straight-in)
//   cast-contract  JSON.parse(x) as FooType  ->  fooContract.parse(JSON.parse(x)) when FooType is a `z.infer` alias
//                  (resolved through the file's own import, or the checker for an alias reached by a helper type)
//
// Usage (from the worktree root, on the tmp/phase34 copy):
//   node tmp/phase34/b17-json-parse/run.cjs [pkg ...] [--sample-out=dir] [--no-gate] [apply]
// Default is a dry run: counts per package and the leftovers file. `--sample-out` writes the rewritten files under
// <dir>/<repo path> for lib/verify-sample.cjs. `apply` writes packages/ (do not, until the operator says so).
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');
const { collect, buildTypeIndex, isParseCall } = require('./sites.cjs');

const { ts, ROOT, rel } = lib;
const args = process.argv.slice(2);
const flag = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const doApply = args.includes('apply');
const noGate = args.includes('--no-gate');
const sampleOut = flag('sample-out');
const pkgFilter = args.filter((a) => !a.startsWith('--') && a !== 'apply');
const outDir = path.join(__dirname, 'out');

const ws = lib.workspaces();
const typeIndex = buildTypeIndex(ws);
let sites = collect(ws);
if (pkgFilter.length) sites = sites.filter((s) => pkgFilter.includes(s.w.short) || pkgFilter.includes(s.w.name));

const isFnLike = (n) => ts.isFunctionLike(n);
const isLoop = (n) => ts.isForStatement(n) || ts.isForInStatement(n) || ts.isForOfStatement(n) || ts.isWhileStatement(n) || ts.isDoStatement(n);
const hasAwait = (n) => {
  let hit = false;
  const v = (x) => {
    if (hit) return;
    if (ts.isAwaitExpression(x)) hit = true;
    else if (!isFnLike(x)) ts.forEachChild(x, v);
  };
  v(n);
  return hit;
};
const hasCall = (n) => {
  let hit = false;
  const v = (x) => {
    if (hit) return;
    if (ts.isCallExpression(x) || ts.isNewExpression(x) || ts.isAwaitExpression(x)) hit = true;
    else ts.forEachChild(x, v);
  };
  v(n);
  return hit;
};
const isPlainRef = (n) => ts.isIdentifier(n) || (ts.isPropertyAccessExpression(n) && isPlainRef(n.expression)) || (ts.isCallExpression(n) === false && ts.isStringLiteral(n));

// The argument of the JSON.parse call, when the site is a JSON.parse (not .json()).
const parseArg = (s) => (s.isJsonParse ? s.node.arguments[0] : null);

const enclosingBlock = (n) => {
  let x = n.parent;
  while (x && !ts.isBlock(x) && !ts.isSourceFile(x) && !ts.isModuleBlock(x) && !ts.isCaseClause(x)) x = x.parent;
  return x;
};
const statementIn = (block, n) => {
  let x = n;
  while (x.parent && x.parent !== block) x = x.parent;
  return x.parent === block ? x : null;
};
// Walking from the use up to the decl's block must cross no function or loop: inlining there would move the parse
// into a closure (an await could become illegal) or run it once per iteration.
const crossesFnOrLoop = (use, block) => {
  let x = use.parent;
  while (x && x !== block) {
    if (isFnLike(x) || isLoop(x)) return true;
    x = x.parent;
  }
  return false;
};

const leftovers = [];
const edits = new Map(); // file -> [{ start, end, text, site }]
const addEdit = (s, e) => {
  if (!edits.has(s.f)) edits.set(s.f, []);
  edits.get(s.f).push({ ...e, site: s });
};
const extraImports = new Map(); // file -> Set('Name\0spec')
const scripted = new Map(); // site -> rewrite class
const lineOf = (s) => s.sf.getLineAndCharacterOfPosition(s.node.getStart(s.sf)).line + 1;
const leave = (s, reason) => leftovers.push({ site: s, reason });

const deleteStatementEdit = (s, stmt) => {
  const { sf, text } = s;
  let start = text.lastIndexOf('\n', stmt.getStart(sf)) + 1;
  // `//` lines directly above the statement that talk about the parse go with it; any other comment stays
  for (;;) {
    const prevStart = text.lastIndexOf('\n', start - 2) + 1;
    const prev = text.slice(prevStart, start - 1);
    if (start === 0 || !/^\s*\/\/.*(json|pars)/iu.test(prev)) break;
    start = prevStart;
  }
  let end = text.indexOf('\n', stmt.end);
  end = end === -1 ? text.length : end + 1;
  // a statement standing between two blank lines takes one of them
  const before = text.slice(text.lastIndexOf('\n', start - 2) + 1, start);
  const after = text.slice(end, text.indexOf('\n', end) === -1 ? text.length : text.indexOf('\n', end));
  if (before.trim() === '' && after.trim() === '' && start > 0 && end < text.length) end = text.indexOf('\n', end) + 1;
  return { start, end, text: '' };
};

const rewriteSingleUse = (s) => {
  const d = s.decl;
  const stmt = d.parent?.parent;
  if (!stmt || !ts.isVariableStatement(stmt) || stmt.declarationList.declarations.length !== 1) return leave(s, 'decl is one of several in a statement');
  if (!(stmt.declarationList.flags & ts.NodeFlags.Const)) return leave(s, 'declared with let/var');
  const use = s.uses[0];
  const block = stmt.parent;
  const useStmt = statementIn(block, use);
  if (!useStmt) return leave(s, 'use is not in the declaration block');
  const idxA = block.statements.indexOf(stmt);
  const idxB = block.statements.indexOf(useStmt);
  if (idxB < idxA) return leave(s, 'use precedes the declaration');
  if (crossesFnOrLoop(use, block)) return leave(s, 'use sits inside a nested function or loop');
  const between = block.statements.slice(idxA + 1, idxB);
  const arg = parseArg(s);
  const argHasCall = arg ? hasCall(arg) : true;
  if (hasAwait(s.cur) && between.length) return leave(s, 'await in the raw value, statements between decl and use');
  if (argHasCall && between.length) return leave(s, 'parse argument has a call and statements sit between decl and use');
  if (between.some((b) => hasAwait(b))) return leave(s, 'an await sits between decl and use');
  if (arg && !argHasCall) {
    // identifiers in the argument must not be reassigned between decl and use
    const ids = new Set();
    const v = (x) => {
      if (ts.isIdentifier(x)) ids.add(x.text);
      ts.forEachChild(x, v);
    };
    v(arg);
    let written = false;
    const w = (x) => {
      if (ts.isBinaryExpression(x) && x.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && x.operatorToken.kind <= ts.SyntaxKind.LastAssignment && ts.isIdentifier(x.left) && ids.has(x.left.text)) written = true;
      if ((ts.isPrefixUnaryExpression(x) || ts.isPostfixUnaryExpression(x)) && ts.isIdentifier(x.operand) && ids.has(x.operand.text)) written = true;
      ts.forEachChild(x, w);
    };
    between.forEach(w);
    if (written) return leave(s, 'a name in the parse argument is reassigned between decl and use');
  }
  addEdit(s, { start: use.getStart(s.sf), end: use.end, text: s.cur.getText(s.sf) });
  addEdit(s, deleteStatementEdit(s, stmt));
  scripted.set(s, 'single-use');
};

const rewriteMultiParse = (s) => {
  const parseUses = s.uses.filter((u) => u.parent && ts.isCallExpression(u.parent) && u.parent.arguments[0] === u && isParseCall(u.parent));
  if (parseUses.length !== s.uses.length || parseUses.length < 2) return leave(s, 'variable has non-parse uses');
  const d = s.decl;
  const stmt = d.parent?.parent;
  if (!stmt || !ts.isVariableStatement(stmt) || stmt.declarationList.declarations.length !== 1) return leave(s, 'decl is one of several in a statement');
  const arg = parseArg(s);
  if (!arg || !isPlainRef(arg)) return leave(s, 'multi-parse: argument is not a plain reference, a second parse would repeat its calls');
  const block = stmt.parent;
  if (parseUses.some((u) => crossesFnOrLoop(u, block) || !statementIn(block, u))) return leave(s, 'a use sits inside a nested function or loop');
  const idxA = block.statements.indexOf(stmt);
  if (parseUses.some((u) => block.statements.indexOf(statementIn(block, u)) < idxA)) return leave(s, 'use precedes the declaration');
  for (const u of parseUses) addEdit(s, { start: u.getStart(s.sf), end: u.end, text: s.cur.getText(s.sf) });
  addEdit(s, deleteStatementEdit(s, stmt));
  scripted.set(s, 'multi-parse');
};

// Type behind a cast, resolved to a contract const: through the file's own import first (same specifier gets the
// value import), else null.
const contractFor = (s, typeName) => {
  const cands = typeIndex.get(typeName);
  if (!cands) return null;
  return cands.find((x) => x.pkg === s.w.name) ?? (cands.length === 1 ? cands[0] : null);
};

const rewriteCast = (s) => {
  const tn = s.castNode.type;
  if (!ts.isTypeReferenceNode(tn) || tn.typeArguments) return leave(s, `cast to ${s.castType}: not a contract type`);
  const name = tn.typeName.getText(s.sf);
  const imp = s.fileImports.get(name);
  if (!imp) return leave(s, `cast to ${name}: not imported, not a contract type`);
  const c = contractFor(s, name);
  if (!c) return leave(s, `cast to ${name}: no z.infer contract found`);
  if (s.castNode.parent && ts.isVariableDeclaration(s.castNode.parent) && !ts.isIdentifier(s.castNode.parent.name)) return leave(s, 'destructured');
  addEdit(s, { start: s.castNode.getStart(s.sf), end: s.castNode.end, text: `${c.contractConst}.parse(${s.cur.getText(s.sf)})` });
  if (!extraImports.has(s.f)) extraImports.set(s.f, new Map());
  extraImports.get(s.f).set(c.contractConst, imp.spec);
  scripted.set(s, 'cast-contract');
};

const classNote = {
  'direct-parse': null,
  'var-other': 'raw value stored and used other than through a contract parse (typeof/in narrowing, cast, handed to an unknown parameter, spread): the contract is a decision',
  'var-parse-plus-other-uses': 'raw value used by a contract parse AND by other code',
  assigned: 'raw value assigned to an outer variable (try/catch fallback shape)',
  other: 'raw value has no consumer the script can name (object property, argument, expression statement)',
  'read-first': 'property read directly off the raw value or its promise (`.catch`, `.field`)',
  return: 'raw value returned to a caller',
  'var-unused': 'raw value stored and never read',
  'var-destructured': 'raw value destructured',
  'passed-to-call': 'raw value handed to a function',
};

for (const s of sites) {
  if (s.klass === 'direct-parse') continue;
  if (s.klass === 'var-single-use-parse') rewriteSingleUse(s);
  else if (s.klass === 'var-parse-plus-other-uses') rewriteMultiParse(s);
  else if (s.klass === 'cast-type') rewriteCast(s);
  else leave(s, classNote[s.klass] ?? s.klass);
}

// ---- render ----
const dropUnusedImports = (abs, text) => {
  const sf = lib.parse(abs, text);
  const drop = [];
  const used = (nm) => {
    let hit = false;
    const v = (n) => {
      if (hit || ts.isImportDeclaration(n)) return;
      if (ts.isIdentifier(n) && n.text === nm) hit = true;
      ts.forEachChild(n, v);
    };
    sf.statements.forEach(v);
    return hit;
  };
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings) || st.importClause.name) continue;
    const els = st.importClause.namedBindings.elements;
    const keep = els.filter((e) => used(e.name.text));
    if (keep.length === els.length) continue;
    if (!keep.length) {
      const le = text.indexOf('\n', st.end);
      drop.push({ start: st.getStart(sf), end: le === -1 ? st.end : le + 1, text: '' });
    } else drop.push({ start: st.getStart(sf), end: st.end, text: `import${st.importClause.isTypeOnly ? ' type' : ''} { ${keep.map((e) => e.getText(sf)).join(', ')} } from ${st.moduleSpecifier.getText(sf)};` });
  }
  return lib.applyEdits(text, drop);
};

const renderFile = (f, list) => {
  const text = fs.readFileSync(f, 'utf8');
  const sf = lib.parse(f, text);
  const e = list.map(({ start, end, text: t }) => ({ start, end, text: t }));
  const extra = extraImports.get(f);
  if (extra && list.some((x) => scripted.get(x.site) === 'cast-contract')) {
    const anchor = [...sf.statements].reverse().find((x) => ts.isImportDeclaration(x));
    const nl = anchor ? text.indexOf('\n', anchor.end) : -1;
    const at = anchor ? (nl === -1 ? text.length : nl + 1) : 0;
    const bySpec = new Map();
    for (const [n, sp] of extra) (bySpec.get(sp) ?? bySpec.set(sp, []).get(sp)).push(n);
    e.push({ start: at, end: at, text: [...bySpec].map(([sp, ns]) => `import { ${ns.join(', ')} } from '${sp}';\n`).join('') });
  }
  let out = lib.applyEdits(text, e);
  out = lib.mergeDuplicateImports(f, out);
  return dropUnusedImports(f, out);
};

const keyOf = (d) => `${d.code}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
const overlay = new Map();
const gateRejected = [];
const bySiteGroup = (list) => {
  const m = new Map();
  for (const e of list) (m.get(e.site) ?? m.set(e.site, []).get(e.site)).push(e);
  return [...m.values()];
};
for (const [f, list] of edits) overlay.set(f, renderFile(f, list));

if (!noGate) {
  const byPkg = new Map();
  for (const f of overlay.keys()) {
    const w = lib.workspaceOf(f, ws);
    if (!byPkg.has(w)) byPkg.set(w, []);
    byPkg.get(w).push(f);
  }
  const newDiags = (w, files, ov) => {
    const options = lib.packageCompilerOptions(w.dir);
    const base = lib.diagnosticsWithOverlay(files, new Map(), options).diagnostics;
    const aft = lib.diagnosticsWithOverlay(files, ov, options).diagnostics;
    const bad = new Map();
    for (const f of files) {
      const bk = new Set((base.get(f) ?? []).map(keyOf));
      const add = (aft.get(f) ?? []).filter((d) => !bk.has(keyOf(d)));
      if (add.length) bad.set(f, add);
    }
    return bad;
  };
  for (const [w, files] of byPkg) {
    const bad = newDiags(w, files, overlay);
    for (const f of bad.keys()) {
      // retry each site alone; keep the ones that stay clean together
      const groups = bySiteGroup(edits.get(f));
      const good = [];
      for (const g of groups) {
        const single = new Map([[f, renderFile(f, g)]]);
        if (!newDiags(w, [f], single).size) good.push(...g);
        else gateRejected.push({ site: g[0].site, why: lib.formatDiagnostic(bad.get(f)[0]).slice(0, 200) });
      }
      if (good.length) {
        const ov = new Map([[f, renderFile(f, good)]]);
        if (newDiags(w, [f], ov).size) {
          gateRejected.push(...good.map((e) => ({ site: e.site, why: 'sites clean alone, dirty together' })));
          overlay.delete(f);
          edits.delete(f);
          continue;
        }
        overlay.set(f, ov.get(f));
        edits.set(f, good);
      } else {
        overlay.delete(f);
        edits.delete(f);
      }
    }
  }
  for (const r of gateRejected) {
    scripted.delete(r.site);
    leave(r.site, `typecheck gate: ${r.why}`);
  }
}

// ---- report ----
const perPkg = {};
const bump = (pkg, k) => {
  perPkg[pkg] ??= { direct: 0, scripted: 0, 'single-use': 0, 'multi-parse': 0, 'cast-contract': 0, hand: 0 };
  perPkg[pkg][k]++;
};
const leftSet = new Set(leftovers.map((l) => l.site));
for (const s of sites) {
  if (s.klass === 'direct-parse') bump(s.w.short, 'direct');
  else if (scripted.has(s) && !leftSet.has(s)) {
    bump(s.w.short, 'scripted');
    bump(s.w.short, scripted.get(s));
  } else bump(s.w.short, 'hand');
}
const total = { direct: 0, scripted: 0, 'single-use': 0, 'multi-parse': 0, 'cast-contract': 0, hand: 0 };
for (const p of Object.values(perPkg)) for (const k of Object.keys(total)) total[k] += p[k];
console.log(JSON.stringify({ sites: sites.length, files: new Set(sites.map((s) => s.f)).size, filesRewritten: overlay.size, ...total }));
console.table(perPkg);

fs.mkdirSync(outDir, { recursive: true });
const lines = leftovers
  .filter((l) => !scripted.has(l.site) || leftSet.has(l.site))
  .map((l) => `${rel(l.site.f)}:${lineOf(l.site)}\t${l.site.klass}\t${l.reason}\t${l.site.top.parent.getText(l.site.sf).replace(/\s+/g, ' ').slice(0, 100)}`)
  .sort();
fs.writeFileSync(path.join(outDir, 'leftovers.txt'), `# path:line\tclass\treason\tcode\n${lines.join('\n')}\n`);
const byReason = {};
for (const l of leftovers) byReason[l.reason.replace(/cast to \S+/u, 'cast to <T>').slice(0, 90)] = (byReason[l.reason.replace(/cast to \S+/u, 'cast to <T>').slice(0, 90)] ?? 0) + 1;
console.log('leftovers by reason', JSON.stringify(byReason, null, 1));
console.log(`leftovers file: ${path.relative(ROOT, path.join(outDir, 'leftovers.txt'))} (${lines.length} sites)`);

if (sampleOut) {
  for (const [f, t] of overlay) {
    const d = path.join(ROOT, sampleOut, rel(f));
    fs.mkdirSync(path.dirname(d), { recursive: true });
    fs.writeFileSync(d, t);
  }
  console.log(`sample written under ${sampleOut} (${overlay.size} files)`);
}
if (doApply) {
  for (const [f, t] of overlay) fs.writeFileSync(f, t);
  console.log(`applied to ${overlay.size} files`);
}

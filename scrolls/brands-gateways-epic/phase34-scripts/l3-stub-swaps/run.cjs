// L3 (wave 3.5): every MAP-class stub swap outside eslint-plugin's L2 retype, plus the type references
// of the same copies (libcopy-census/stub-map.json and its `_typeMap`; gateway paths from
// items/b05-other-library-type-copies.md "Stub paths (from L0)").
//
//   node tmp/phase34/l3-stub-swaps/run.cjs [pkg ...] [--sample-out=<dir>] [--no-dependents] [--keep-blocked] [apply]
//   node tmp/phase34/l3-stub-swaps/run.cjs --list-dead            (read-only; dead copies on the tree as it stands)
//
// Re-censuses on every run. Per package: every call of a copy stub becomes the gateway stub (or the real
// value: the three `ts.*` stubs and EslintRulesStub unwrap), every reference to a copy's type becomes the
// real type, and imports left unused are dropped. Nothing is guessed: a call using a field the gateway stub
// lacks, or whose argument is not a literal it can read, goes to `out/leftovers.txt`.
//
// The gate (per package, then per dependent package):
//   1. retypes land first, then every call swap is gated per file, per statement (a site that adds a
//      diagnostic is restored and listed);
//   2. the whole package is typechecked; a diagnostic the edits added anywhere (a test calling a function
//      whose parameter was retyped, say) makes the script revert retype files one at a time until none is
//      added; a reverted file's sites go to leftovers, and the swaps are gated again;
//   3. dependents (packages whose package.json lists this one) are typechecked with the edited non-test files
//      overlaid; a file that adds a diagnostic there is reverted the same way.
// `--keep-blocked` skips step 2's reverts and dependents: it lands every retype and swap the per-file gate
// accepts and lists the diagnostics that leaves at the hand sites (out/blockers-*.txt), so a package can be
// put into a known-red state for a hand queue. Never use it as a final state.
// A diagnostic counts as added when its code+message occurs more often in its file than before (lines shift).
//
// Never deletes: `out/dead-copies-<pkgs>.txt` lists the copy contracts nothing imports after the swap; L4 (or
// later) moves them out under rule 20.
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');

const { ts, ROOT, rel } = lib;
const args = process.argv.slice(2);
const opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? null;
const APPLY = args.includes('apply');
const LIST_DEAD = args.includes('--list-dead');
const NO_DEPENDENTS = args.includes('--no-dependents');
const KEEP_BLOCKED = args.includes('--keep-blocked');
const sampleOut = opt('sample-out') ? path.resolve(ROOT, opt('sample-out')) : null;
const pkgArgs = args.filter((a) => !a.startsWith('--') && a !== 'apply');
const WS = lib.workspaces();
const OUT = path.join(__dirname, 'out');
const log = (m) => process.stderr.write(`${m}\n`);

const GW = {
  timeout: '#gateway/node/setTimeout/timeout/timeout.stub',
  flat: '#gateway/npm/typescript-eslint__utils/flat-config/flat-config.stub',
  ws: '#gateway/npm/hono__ws/ws-context/ws-context.stub',
  rpc: '#gateway/npm/modelcontextprotocol__sdk__types/json-rpc-request/json-rpc-request.stub',
  ts: '#gateway/npm/typescript',
  utils: '#gateway/npm/typescript-eslint__utils',
  honoWs: '#gateway/npm/hono__ws',
  sdk: '#gateway/npm/modelcontextprotocol__sdk__types',
};
const IMP = {
  timeoutStub: { spec: GW.timeout, name: 'TimeoutStub' },
  flatStub: { spec: GW.flat, name: 'FlatConfigStub' },
  wsStub: { spec: GW.ws, name: 'WsContextStub' },
  tsNs: { spec: GW.ts, name: 'ts', ns: true, typeOnly: true },
  tseslint: { spec: GW.utils, name: 'TSESLint', typeOnly: true },
  wsType: { spec: GW.honoWs, name: 'WSContext', typeOnly: true },
  rpcType: { spec: GW.sdk, name: 'JSONRPCRequest', typeOnly: true },
};
// One row per copy. `dir` is the copy's own folder: files inside it (contract, stub, test) die with it and
// are neither swapped nor counted as users.
const FAMILIES = [
  { stub: 'TimerHandleStub', type: 'TimerHandle', contract: 'timerHandleContract', dir: 'packages/testing/src/contracts/timer-handle', realType: '(NodeJS.Timeout | NodeJS.Immediate)', typeNeed: null },
  { stub: 'TypescriptSourceFileStub', type: 'TypescriptSourceFile', contract: 'typescriptSourceFileContract', dir: 'packages/testing/src/contracts/typescript-source-file', realType: 'ts.SourceFile', typeNeed: IMP.tsNs },
  { stub: 'TypescriptNodeFactoryStub', type: 'TypescriptNodeFactory', contract: 'typescriptNodeFactoryContract', dir: 'packages/testing/src/contracts/typescript-node-factory', realType: 'ts.NodeFactory', typeNeed: IMP.tsNs },
  { stub: 'TypescriptStatementStub', type: 'TypescriptStatement', contract: 'typescriptStatementContract', dir: 'packages/testing/src/contracts/typescript-statement', realType: 'ts.Statement', typeNeed: IMP.tsNs },
  { stub: 'EslintConfigStub', type: 'EslintConfig', contract: 'eslintConfigContract', dir: 'packages/eslint-plugin/src/contracts/eslint-config', realType: 'TSESLint.FlatConfig.Config', typeNeed: IMP.tseslint },
  { stub: 'LinterConfigStub', type: 'LinterConfig', contract: 'linterConfigContract', dir: 'packages/hooks/src/contracts/linter-config', realType: 'TSESLint.FlatConfig.Config', typeNeed: IMP.tseslint },
  { stub: 'EslintRulesStub', type: 'EslintRules', contract: 'eslintRulesContract', dir: 'packages/eslint-plugin/src/contracts/eslint-rules', realType: 'TSESLint.SharedConfig.RulesRecord', typeNeed: IMP.tseslint },
  { stub: 'WsClientStub', type: 'WsClient', contract: 'wsClientContract', dir: 'packages/server/src/contracts/ws-client', realType: 'WSContext', typeNeed: IMP.wsType },
  { stub: 'JsonRpcRequestStub', type: 'JsonRpcRequest', contract: 'jsonRpcRequestContract', dir: 'packages/mcp/src/contracts/json-rpc-request', realType: 'JSONRPCRequest', typeNeed: IMP.rpcType },
];
const BY_STUB = new Map(FAMILIES.map((f) => [f.stub, f]));
const BY_TYPE = new Map(FAMILIES.map((f) => [f.type, f]));
const ALL_NAMES = FAMILIES.flatMap((f) => [f.stub, f.type, f.contract]);
const isOwn = (relFile) => FAMILIES.some((f) => relFile.startsWith(`${f.dir}/`));
const ownFamily = (relFile) => FAMILIES.find((f) => relFile.startsWith(`${f.dir}/`));
const isGatewaySpec = (s) => s.startsWith('#gateway/') && s !== GW.rpc;
const TEST_FILE = /\.(test|integration\.test|e2e|spec)\.tsx?$/u;
const NON_TEST = (f) => !TEST_FILE.test(f);

// ---------------------------------------------------------------- census of one file

// Returns { cands, leftovers, own, noncall, needs } for `text`. Candidates are independent edits on `text`.
const plan = (file, text) => {
  const sf = lib.parse(file, text);
  const r = rel(file);
  const out = { cands: [], leftovers: [], noncall: 0, needs: [], rewrites: [] };
  const localStub = new Map(); // local name -> family
  const localType = new Map();
  const importDecls = new Map(); // local name -> import declaration
  const bound = new Set();
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause) continue;
    const spec = st.moduleSpecifier.text;
    const ic = st.importClause;
    if (ic.name) bound.add(ic.name.text);
    if (ic.namedBindings && ts.isNamespaceImport(ic.namedBindings)) bound.add(ic.namedBindings.name.text);
    if (ic.namedBindings && ts.isNamedImports(ic.namedBindings)) {
      for (const e of ic.namedBindings.elements) {
        bound.add(e.name.text);
        const imported = (e.propertyName ?? e.name).text;
        if (isGatewaySpec(spec)) continue;
        if (BY_STUB.has(imported)) { localStub.set(e.name.text, BY_STUB.get(imported)); importDecls.set(e.name.text, st); }
        if (BY_TYPE.has(imported)) { localType.set(e.name.text, BY_TYPE.get(imported)); importDecls.set(e.name.text, st); }
      }
    }
  }
  if (!localStub.size && !localType.size) return { ...out, sf };
  const hasTs = bound.has('ts');
  const need = (imp) => { if (imp && !(imp.name === 'ts' && hasTs) && !bound.has(imp.name)) out.needs.push(imp); };
  const lineOf = (n) => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
  const T = (n) => n.getText(sf);
  const left = (n, name, reason) => out.leftovers.push({ line: lineOf(n), what: name, reason });
  const simple = (e) => ts.isIdentifier(e) || ts.isPropertyAccessExpression(e) || ts.isCallExpression(e) || ts.isElementAccessExpression(e) || ts.isParenthesizedExpression(e) || ts.isNewExpression(e) || ts.isNonNullExpression(e) || ts.isStringLiteral(e) || ts.isNumericLiteral(e);
  const needsParens = (call, x) => {
    if (simple(x)) return false;
    const p = call.parent;
    return (ts.isPropertyAccessExpression(p) || ts.isElementAccessExpression(p) || ts.isNonNullExpression(p) || ts.isAsExpression(p) || ts.isBinaryExpression(p) || ts.isConditionalExpression(p) || ts.isPrefixUnaryExpression(p) || ts.isTypeOfExpression(p) || ts.isAwaitExpression(p) || (ts.isCallExpression(p) && p.expression === call));
  };
  const objKeys = (o) => {
    const keys = [];
    for (const p of o.properties) {
      if (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) keys.push({ name: p.name.getText(sf).replace(/^['"]|['"]$/gu, ''), prop: p });
      else return null;
    }
    return keys;
  };
  const callEdit = (n, fam, text, imps, alt) => ({ kind: 'call', stub: fam.stub, start: n.getStart(sf), end: n.end, text, alt: alt?.text, altNeed: alt?.need, need: imps, line: lineOf(n), ...lib.enclosingStatement(n, sf) });
  // Locals still referenced somewhere other than a call/type position keep their import.
  const callNodes = new Set();
  const rpcCalls = [];

  const visit = (n) => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && localStub.has(n.expression.text)) {
      callNodes.add(n.expression);
      const fam = localStub.get(n.expression.text);
      const a = n.arguments;
      const arg = a[0];
      const objArg = arg && ts.isObjectLiteralExpression(arg) ? arg : null;
      const keys = objArg ? objKeys(objArg) : null;
      const nm = fam.stub;
      if (a.length > 1) left(n, nm, 'more than one argument');
      else if (nm === 'TimerHandleStub') {
        if (!arg) out.cands.push(callEdit(n, fam, 'TimeoutStub()', [IMP.timeoutStub]));
        else if (keys && keys.length === 1 && keys[0].name === 'hasRef') {
          const p = keys[0].prop;
          let body = ts.isPropertyAssignment(p) ? p.initializer : null;
          const fn = body && (ts.isArrowFunction(body) ? body : null);
          const lit = fn && (fn.body.kind === ts.SyntaxKind.TrueKeyword || fn.body.kind === ts.SyntaxKind.FalseKeyword) ? fn.body.kind === ts.SyntaxKind.TrueKeyword : null;
          if (lit === null) left(n, nm, 'hasRef is not `() => true` / `() => false`');
          else out.cands.push(callEdit(n, fam, lit ? 'TimeoutStub()' : 'TimeoutStub({ unref: true })', [IMP.timeoutStub]));
        } else left(n, nm, 'argument is not `{ hasRef }`');
      } else if (nm === 'TypescriptSourceFileStub' || nm === 'TypescriptNodeFactoryStub' || nm === 'TypescriptStatementStub') {
        const p = keys && keys.length === 1 && keys[0].name === 'value' ? keys[0].prop : null;
        const x = p ? (ts.isShorthandPropertyAssignment(p) ? p.name : p.initializer) : null;
        const inner = x && ts.isAsExpression(x) ? x.expression : x;
        if (!x) left(n, nm, 'argument is not `{ value }`');
        else if (ts.isObjectLiteralExpression(inner) || inner.kind === ts.SyntaxKind.UndefinedKeyword || (ts.isIdentifier(inner) && inner.text === 'undefined') || inner.kind === ts.SyntaxKind.NullKeyword) left(n, nm, 'hand-built partial or empty value, not a real ts node');
        else out.cands.push(callEdit(n, fam, needsParens(n, x) ? `(${T(x)})` : T(x), []));
      } else if (nm === 'EslintConfigStub' || nm === 'LinterConfigStub') {
        const isEslint = nm === 'EslintConfigStub';
        // Defaults the copy stub carried, kept explicit: FlatConfigStub's own differ (`ignores` most).
        const defaults = isEslint ? [['ignores', "['node_modules']"], ['rules', '{}']] : [];
        if (arg && !objArg) left(n, nm, 'argument is not an object literal');
        else if (arg && !keys) left(n, nm, 'spread in argument');
        else {
          const bad = keys ? keys.filter((k) => !['files', 'ignores', 'rules'].includes(k.name)).map((k) => k.name) : [];
          if (bad.length) left(n, nm, `key(s) FlatConfigStub does not take: ${bad.join(',')}`);
          else {
            const have = new Set((keys ?? []).map((k) => k.name));
            const inject = defaults.filter(([k]) => !have.has(k)).map(([k, v]) => `${k}: ${v}`);
            let text;
            if (!arg) text = inject.length ? `FlatConfigStub({ ${inject.join(', ')} })` : 'FlatConfigStub()';
            else if (!inject.length) text = `FlatConfigStub(${T(arg)})`;
            else {
              const body = T(arg);
              text = `FlatConfigStub({ ${inject.join(', ')},${body.slice(1)})`;
            }
            out.cands.push(callEdit(n, fam, text, [IMP.flatStub]));
          }
        }
      } else if (nm === 'EslintRulesStub') {
        const txt = !arg ? '{}' : objArg ? T(arg) : null;
        if (arg && !objArg) left(n, nm, 'argument is not an object literal');
        else {
          // `satisfies` is the retry when the plain literal widens ('error' to string).
          const alt = { text: `(${txt} satisfies TSESLint.SharedConfig.RulesRecord)`, need: [IMP.tseslint] };
          const wrap = (ts.isArrowFunction(n.parent) && n.parent.body === n) || ts.isExpressionStatement(n.parent) || needsParens(n, arg ?? n);
          out.cands.push(callEdit(n, fam, wrap ? `(${txt})` : txt, [], alt));
        }
      } else if (nm === 'WsClientStub') {
        const ok = keys && keys.length === 1 && keys[0].name === 'send';
        if (!arg) left(n, nm, 'no `send`: the copy defaulted it to jest.fn(), WsContextStub to a no-op, so a read-back of client.send would silently change');
        else if (!ok) left(n, nm, 'argument is not `{ send }`');
        else out.cands.push(callEdit(n, fam, `WsContextStub(${T(arg)})`, [IMP.wsStub]));
      } else if (nm === 'JsonRpcRequestStub') {
        rpcCalls.push({ n, fam, arg, objArg, keys });
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);

  // JsonRpcRequestStub keeps its name: the import specifier moves, so every call in the file must map.
  if (rpcCalls.length) {
    const reasons = [];
    const staged = [];
    for (const c of rpcCalls) {
      const { n, fam, arg, objArg, keys } = c;
      if (n.arguments.length > 1) reasons.push([n, 'more than one argument']);
      else if (arg && !objArg) reasons.push([n, 'argument is not an object literal']);
      else if (arg && !keys) reasons.push([n, 'spread in argument']);
      else if (keys && keys.some((k) => !['id', 'method', 'params'].includes(k.name))) reasons.push([n, `key(s) the gateway stub does not take: ${keys.filter((k) => !['id', 'method', 'params'].includes(k.name)).map((k) => k.name).join(',')}`]);
      else {
        const hasMethod = (keys ?? []).some((k) => k.name === 'method');
        // The copy defaulted method to 'initialize'; the gateway stub to 'tools/list'.
        let text;
        if (!arg) text = "JsonRpcRequestStub({ method: 'initialize' })";
        else if (hasMethod) text = T(n);
        else text = `JsonRpcRequestStub({ method: 'initialize',${T(arg).slice(1)})`;
        staged.push(callEdit(n, fam, text, []));
      }
    }
    const decl = [...importDecls.entries()].find(([k]) => k === 'JsonRpcRequestStub')?.[1];
    let fileReason = null;
    if (!decl) fileReason = 'JsonRpcRequestStub not imported by name';
    else if (decl.importClause.name || decl.importClause.namedBindings.elements.length !== 1 || decl.importClause.namedBindings.elements[0].propertyName) fileReason = 'import shares its statement with other names or an alias';
    else if (reasons.length) fileReason = 'another call in this file cannot map';
    if (fileReason) {
      for (const c of rpcCalls) left(c.n, 'JsonRpcRequestStub', reasons.find(([m]) => m === c.n)?.[1] ?? fileReason);
    } else {
      out.cands.push(...staged);
      out.rewrites.push({ start: decl.moduleSpecifier.getStart(sf) + 1, end: decl.moduleSpecifier.end - 1, text: GW.rpc, stmtStart: decl.getStart(sf), stmtEnd: decl.end });
    }
  }

  // Type references, and non-call uses that keep an import alive.
  const typeIds = new Set();
  const visitTypes = (n) => {
    if (ts.isTypeReferenceNode(n) && ts.isIdentifier(n.typeName) && localType.has(n.typeName.text)) {
      const fam = localType.get(n.typeName.text);
      typeIds.add(n.typeName);
      if (n.typeArguments) left(n, fam.type, 'type reference with type arguments');
      else {
        need(fam.typeNeed);
        out.cands.push({ kind: 'type', stub: fam.type, start: n.getStart(sf), end: n.end, text: fam.realType, need: fam.typeNeed ? [fam.typeNeed] : [], line: lineOf(n), stmtStart: n.getStart(sf), stmtEnd: n.end });
      }
    }
    ts.forEachChild(n, visitTypes);
  };
  visitTypes(sf);
  const visitOther = (n) => {
    const nameSlot = n.parent && ((ts.isPropertyAccessExpression(n.parent) && n.parent.name === n) || ((ts.isPropertyAssignment(n.parent) || ts.isPropertySignature(n.parent) || ts.isMethodDeclaration(n.parent) || ts.isPropertyDeclaration(n.parent)) && n.parent.name === n));
    if (ts.isIdentifier(n) && !nameSlot && (localStub.has(n.text) || localType.has(n.text)) && !callNodes.has(n) && !typeIds.has(n) && !ts.isImportSpecifier(n.parent) && !ts.isImportClause(n.parent)) {
      out.noncall++;
      left(n, n.text, 'referenced other than as a call or a type (typeof, value, re-export)');
    }
    ts.forEachChild(n, visitOther);
  };
  visitOther(sf);

  // Nested candidates (a stub call inside another's argument) cannot both be edited: keep the outer.
  out.cands.sort((x, y) => x.start - y.start || y.end - x.end);
  const kept = [];
  for (const c of out.cands) {
    const last = kept[kept.length - 1];
    if (last && c.start < last.end) { out.leftovers.push({ line: c.line, what: c.stub, reason: 'nested inside another swapped call' }); continue; }
    kept.push(c);
  }
  out.cands = kept;
  for (const c of out.cands) for (const i of [...c.need, ...(c.altNeed ?? [])]) need(i);
  out.needs = [...new Map(out.needs.map((i) => [`${i.spec}|${i.name}`, i])).values()];
  out.sf = sf;
  return out;
};

// text0: the original plus every import the candidates could need (and JsonRpc's moved specifier).
// Candidate positions are in text0's coordinates.
const buildText0 = (file, orig, p0) => {
  const edits = [];
  const sf = p0.sf;
  const lastImport = [...sf.statements].filter(ts.isImportDeclaration).pop();
  const at = lastImport ? lastImport.end : sf.statements.length ? sf.statements[0].getStart(sf) : 0;
  const lines = p0.needs.map((i) => (i.ns ? `import type * as ${i.name} from '${i.spec}';` : `import ${i.typeOnly ? 'type ' : ''}{ ${i.name} } from '${i.spec}';`));
  if (lines.length) edits.push({ start: at, end: at, text: lastImport ? `\n${lines.join('\n')}` : `${lines.join('\n')}\n` });
  for (const rw of p0.rewrites) edits.push({ start: rw.start, end: rw.end, text: rw.text });
  return { text0: lib.applyEdits(orig, edits), added: new Set(p0.needs.map((i) => i.name)) };
};

// ---------------------------------------------------------------- import cleanup

const dropUnused = (file, text, droppable) => {
  const sf = lib.parse(file, text);
  const used = new Set();
  const v = (n) => {
    if (ts.isIdentifier(n) && droppable.has(n.text) && !(n.parent && (ts.isImportSpecifier(n.parent) || ts.isNamespaceImport(n.parent) || ts.isImportClause(n.parent)))) used.add(n.text);
    ts.forEachChild(n, v);
  };
  v(sf);
  const edits = [];
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause) continue;
    const ic = st.importClause;
    const nb = ic.namedBindings;
    const dead = (nm) => droppable.has(nm) && !used.has(nm);
    const lineEnd = text.indexOf('\n', st.end);
    const whole = { start: st.getStart(sf), end: lineEnd === -1 ? st.end : lineEnd + 1, text: '' };
    if (nb && ts.isNamespaceImport(nb)) { if (!ic.name && dead(nb.name.text)) edits.push(whole); continue; }
    if (!nb || !ts.isNamedImports(nb)) continue;
    const keep = nb.elements.filter((e) => !dead(e.name.text));
    if (keep.length === nb.elements.length) continue;
    if (!keep.length && !ic.name) { edits.push(whole); continue; }
    const q = st.moduleSpecifier.getText(sf)[0];
    edits.push({ start: st.getStart(sf), end: st.end, text: `import${ic.isTypeOnly ? ' type' : ''} ${ic.name ? `${ic.name.text}, ` : ''}{ ${keep.map((e) => e.getText(sf)).join(', ')} } from ${q}${st.moduleSpecifier.text}${q};` });
  }
  return lib.applyEdits(text, edits);
};

// ---------------------------------------------------------------- gate

const UNUSED = new Set([6133, 6192, 6196, 6198, 6199, 6205]);
const flat = (d) => ts.flattenDiagnosticMessageText(d.messageText, ' ');
const fileDiags = (service, file) => [...service.getSyntacticDiagnostics(file), ...service.getSemanticDiagnostics(file)];
const countKeys = (ds) => ds.reduce((m, d) => m.set(`${d.code}:${flat(d)}`, (m.get(`${d.code}:${flat(d)}`) ?? 0) + 1), new Map());
const freshOf = (ds, baseCount) => {
  const seen = new Map();
  return ds.filter((d) => {
    const k = `${d.code}:${flat(d)}`;
    const n = seen.get(k) ?? 0;
    seen.set(k, n + 1);
    return n >= (baseCount.get(k) ?? 0);
  });
};

// Copy of lib.gateEdits with a baseline taken on the ORIGINAL text (candidates live on text0, which carries
// the added imports) and line-insensitive diagnostic keys.
const gateFile = ({ service, live, file, orig, text0, cands, droppable }) => {
  const setText = (t) => live.set(file, { v: (live.get(file)?.v ?? 0) + 1, text: t });
  setText(orig);
  const baseCount = countKeys(fileDiags(service, file));
  let rendered = text0;
  const isIgnored = (d) => UNUSED.has(d.code) && [...droppable].some((nm) => rendered.slice(d.start ?? 0, (d.start ?? 0) + (d.length ?? 0)).includes(nm));
  const addedNow = () => freshOf(fileDiags(service, file), baseCount).filter((d) => !isIgnored(d));
  const render = (acc) => lib.applyEdits(text0, acc);
  let accepted = [...cands];
  for (let guard = 0; guard < 80 && accepted.length; guard++) {
    rendered = render(accepted);
    setText(rendered);
    const added = addedNow();
    if (!added.length) break;
    const sorted = [...accepted].sort((a, b) => a.start - b.start);
    const back = (pos) => {
      let delta = 0;
      for (const c of sorted) {
        if (c.start + delta >= pos) break;
        delta += c.text.length - (c.end - c.start);
      }
      return pos - delta;
    };
    const restore = new Set();
    for (const d of added) {
      const s = back(d.start ?? 0);
      const e = back((d.start ?? 0) + (d.length ?? 0));
      const hits = accepted.filter((c) => c.stmtStart <= s && e <= c.stmtEnd);
      (hits.length ? hits : accepted).forEach((c) => restore.add(c));
    }
    accepted = accepted.filter((c) => !restore.has(c));
  }
  if (accepted.length) {
    rendered = render(accepted);
    setText(rendered);
    if (addedNow().length) accepted = [];
  }
  const firstDiag = () => {
    rendered = render(cands);
    setText(rendered);
    const d = addedNow()[0];
    return d ? `${flat(d).slice(0, 160)} (TS${d.code})` : 'no diagnostic reproduced';
  };
  const explain = accepted.length === cands.length ? null : firstDiag;
  const why = explain ? explain() : null;
  setText(orig);
  return { accepted, why };
};

// ---------------------------------------------------------------- one package

const existingSpecs = (sf) => new Set(sf.statements.filter(ts.isImportDeclaration).map((s) => s.moduleSpecifier.text));

const scanPackage = (service, fileNames) => {
  const by = new Map();
  const diags = new Map();
  for (const f of fileNames) {
    const ds = fileDiags(service, f);
    by.set(f, countKeys(ds));
    if (ds.length) diags.set(f, ds);
  }
  by.diags = diags;
  return by;
};
// `sites` lists every added diagnostic as file:line, for the blockers report.
const newDiagCount = (scan, baseScan) => {
  let n = 0;
  const samples = [];
  const sites = [];
  for (const [f, c] of scan) {
    const b = baseScan.get(f) ?? new Map();
    for (const [k, v] of c) {
      const d = v - (b.get(k) ?? 0);
      if (d > 0) {
        n += d;
        if (samples.length < 4) samples.push(`${rel(f)}: ${k.slice(0, 150)}`);
        const hits = (scan.diags.get(f) ?? []).filter((x) => `${x.code}:${flat(x)}` === k).slice(-d);
        for (const x of hits) sites.push(`${rel(f)}:${x.file ? x.file.getLineAndCharacterOfPosition(x.start ?? 0).line + 1 : 0}\tTS${x.code}: ${flat(x).slice(0, 200)}`);
      }
    }
  }
  return { n, samples, sites };
};

const collectFiles = (w) => {
  const files = [];
  for (const f of lib.walk(w.dir)) {
    const r = rel(f);
    if (isOwn(r)) continue;
    const t = fs.readFileSync(f, 'utf8');
    if (!ALL_NAMES.some((nm) => t.includes(nm))) continue;
    files.push({ file: f, r, orig: t });
  }
  return files;
};

const dependentsOf = (w) => WS.filter((x) => x !== w && !x.isGateway && [x.packageJson.dependencies, x.packageJson.devDependencies, x.packageJson.peerDependencies].some((d) => d && d[w.name]));

const setLive = (live, real, text) => {
  live.set(real, { v: (live.get(real)?.v ?? 0) + 1, text });
  const owner = lib.workspaceOf(real, WS);
  if (owner) live.set(path.join(ROOT, 'node_modules', owner.name, path.relative(owner.dir, real)), { v: (live.get(path.join(ROOT, 'node_modules', owner.name, path.relative(owner.dir, real)))?.v ?? 0) + 1, text });
};

const finalize = (i, acc) => {
  const t = dropUnused(i.file, lib.applyEdits(i.text0, acc), new Set([...ALL_NAMES, ...i.added]));
  return i.mergeNeeded ? lib.mergeDuplicateImports(i.file, t) : t;
};

const processPackage = (w) => {
  const t0 = Date.now();
  const infos = [];
  for (const f of collectFiles(w)) {
    const p0 = plan(f.file, f.orig);
    if (!p0.cands.length && !p0.leftovers.length) continue;
    const { text0, added } = p0.cands.length ? buildText0(f.file, f.orig, p0) : { text0: f.orig, added: new Set() };
    const p1 = p0.cands.length ? plan(f.file, text0) : p0;
    // text0's imports may now name the family type/stub as bound: plan() is deterministic on the sites.
    const cands = p1.cands.map((c, k) => ({ ...c, line: p0.cands[k]?.line ?? c.line }));
    infos.push({ ...f, text0, added, cands, leftovers: [...p0.leftovers], allOrNothing: p0.rewrites.length > 0, mergeNeeded: p0.needs.some((n) => existingSpecs(p0.sf).has(n.spec)) });
  }
  log(`${w.short}: ${infos.length} files with sites, planning done ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  const live = new Map();
  const { service, fileNames } = lib.makeLanguageService(w.dir, live);
  const baseScan = scanPackage(service, fileNames);
  log(`${w.short}: baseline scanned ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  const droppableOf = (info) => new Set([...ALL_NAMES, ...info.added]);
  const dropFiles = new Map(); // file -> reason
  const dropCand = new Map(); // retype candidate -> reason
  const candsOf = (i) => i.cands.filter((c) => !dropCand.has(c));

  const runRound = () => {
    for (const info of infos) { setLive(live, info.file, info.orig); info.accepted = []; info.why = null; info.dropped = dropFiles.get(info.file) ?? null; }
    for (const i of infos) i.cur = candsOf(i);
    const active = infos.filter((i) => i.cur.length && !i.dropped);
    // Retypes first, for files that hold only type candidates.
    const typeOnly = active.filter((i) => i.cur.every((c) => c.kind === 'type'));
    for (const i of typeOnly) setLive(live, i.file, finalize(i, i.cur));
    for (const i of active.filter((x) => !typeOnly.includes(x))) {
      const res = gateFile({ service, live, file: i.file, orig: i.orig, text0: i.text0, cands: i.cur, droppable: droppableOf(i) });
      i.accepted = i.allOrNothing && res.accepted.length !== i.cur.length ? [] : res.accepted;
      i.why = res.why;
      if (i.accepted.length) setLive(live, i.file, finalize(i, i.accepted));
      else setLive(live, i.file, i.orig);
    }
    // A second attempt for candidates that carry an alternative text, where the first was rejected.
    for (const i of active.filter((x) => !typeOnly.includes(x))) {
      const rejected = i.cur.filter((c) => c.alt && !i.accepted.includes(c));
      if (!rejected.length) continue;
      const alts = rejected.map((c) => ({ ...c, text: c.alt, need: c.altNeed ?? [] }));
      const all = [...i.accepted, ...alts];
      const res = gateFile({ service, live, file: i.file, orig: i.orig, text0: i.text0, cands: all, droppable: droppableOf(i) });
      const winners = res.accepted.filter((c) => alts.includes(c));
      if (winners.length) {
        for (const wn of winners) rejected[alts.indexOf(wn)].text = rejected[alts.indexOf(wn)].alt;
        i.accepted = res.accepted.map((c) => (alts.includes(c) ? rejected[alts.indexOf(c)] : c));
        setLive(live, i.file, finalize(i, i.accepted));
        i.usedAlt = true;
      }
    }
    for (const i of typeOnly) i.accepted = i.cur;
  };
  const inPlayTypeCands = () => infos.filter((i) => !i.dropped).flatMap((i) => (i.accepted ?? []).filter((c) => c.kind === 'type'));
  let residual = { n: 0, samples: [], sites: [] };
  const blockers = [];
  // mode 'family' reverts a whole type family's retypes at once; 'file' also tries one file's. Files that
  // depend on each other through a type need the coarse cut, files that do not need the fine one, so both run
  // and the outcome that lands more edits wins.
  const solve = (mode) => {
    dropCand.clear();
    let res = residual;
    for (let round = 0; round < 10; round++) {
      runRound();
      res = newDiagCount(scanPackage(service, fileNames), baseScan);
      log(`${w.short}: [${mode}] round ${round + 1}: ${res.n} added diagnostics ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      if (!blockers.length && round === 0) blockers.push(...res.sites);
      if (!res.n || KEEP_BLOCKED) break;
      const tcs = inPlayTypeCands();
      const fileOf = (c) => infos.find((i) => i.cands.includes(c)).file;
      const units = [
        ...(mode === 'file' ? [...new Set(tcs.map(fileOf))].map((file) => ({ label: rel(file), cands: tcs.filter((c) => fileOf(c) === file) })) : []),
        ...[...new Set(tcs.map((c) => c.stub))].map((fam) => ({ label: `family ${fam}`, cands: tcs.filter((c) => c.stub === fam) })),
      ];
      let best = null;
      for (const u of units) {
        const saved = new Map();
        for (const i of infos) if (i.accepted?.some((c) => u.cands.includes(c))) { saved.set(i, live.get(i.file).text); setLive(live, i.file, i.orig); }
        const n = newDiagCount(scanPackage(service, fileNames), baseScan).n;
        for (const [i, text] of saved) setLive(live, i.file, text);
        if (n < res.n && (!best || n < best.n || (n === best.n && u.cands.length < best.u.cands.length))) best = { u, n };
      }
      const why = (lbl) => `retype (${lbl}) adds diagnostics elsewhere; see blockers-<pkg>.txt (e.g. ${res.samples[0] ?? ''})`;
      if (!best) for (const c of tcs) dropCand.set(c, why('all retypes'));
      else for (const c of best.u.cands) dropCand.set(c, why(best.u.label));
    }
    const landed = infos.reduce((s, i) => s + (i.dropped ? 0 : (i.accepted ?? []).length), 0);
    return { res, landed, snapshot: new Map(dropCand) };
  };
  let chosen = solve('family');
  if (chosen.snapshot.size) {
    const fine = solve('file');
    log(`${w.short}: family cut lands ${chosen.landed} (residual ${chosen.res.n}); file cut lands ${fine.landed} (residual ${fine.res.n})`);
    if (chosen.res.n > 0 || (fine.res.n === 0 && fine.landed > chosen.landed)) chosen = fine;
    dropCand.clear();
    for (const [c, r] of chosen.snapshot) dropCand.set(c, r);
    runRound();
    residual = newDiagCount(scanPackage(service, fileNames), baseScan);
    log(`${w.short}: final residual ${residual.n}`);
  } else residual = chosen.res;
  if (residual.n && !KEEP_BLOCKED) for (const i of infos) if (i.accepted?.length) dropFiles.set(i.file, 'package still adds diagnostics; whole package left');

  // Dependents.
  const deps = NO_DEPENDENTS || KEEP_BLOCKED ? [] : dependentsOf(w);
  const nonTestEdited = () => infos.filter((i) => !i.dropped && i.accepted?.length && NON_TEST(i.file));
  if (deps.length && nonTestEdited().length) {
    for (const d of deps) {
      const dLive = new Map();
      const dsvc = lib.makeLanguageService(d.dir, dLive);
      const dBase = scanPackage(dsvc.service, dsvc.fileNames);
      const apply = (list) => { for (const i of infos) setLive(dLive, i.file, list.includes(i) ? finalize(i, i.accepted) : i.orig); };
      let inPlay = nonTestEdited();
      apply(inPlay);
      let res = newDiagCount(scanPackage(dsvc.service, dsvc.fileNames), dBase);
      log(`${w.short} -> dependent ${d.short}: ${res.n} added diagnostics ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      let guard = 0;
      while (res.n && inPlay.length && guard++ < 12) {
        let best = null;
        for (const i of inPlay) {
          apply(inPlay.filter((x) => x !== i));
          const n = newDiagCount(scanPackage(dsvc.service, dsvc.fileNames), dBase).n;
          if (n < res.n && (!best || n < best.n)) best = { i, n };
        }
        const victims = best ? [best.i] : inPlay;
        for (const v of victims) dropFiles.set(v.file, `breaks dependent ${d.short}: ${res.samples[0] ?? ''}`);
        inPlay = inPlay.filter((x) => !victims.includes(x));
        apply(inPlay);
        res = newDiagCount(scanPackage(dsvc.service, dsvc.fileNames), dBase);
      }
    }
    if ([...dropFiles.keys()].some((f) => infos.find((i) => i.file === f && !i.dropped))) {
      // A dependent forced a revert: gate the swaps again against the reduced retype set.
      for (let round = 0; round < 3; round++) {
        runRound();
        residual = newDiagCount(scanPackage(service, fileNames), baseScan);
        if (!residual.n) break;
        for (const c of inPlayTypeCands()) dropCand.set(c, 'retype adds diagnostics after a dependent forced a revert');
      }
    }
  }
  for (const i of infos) i.dropped = dropFiles.get(i.file) ?? null;
  log(`${w.short}: done ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  infos.blockers = blockers;
  infos.dropCand = dropCand;
  return infos;
};

// ---------------------------------------------------------------- reporting and dead copies

const finalTextOf = (i) => {
  if (!i.accepted?.length || i.dropped) return null;
  return finalize(i, i.accepted);
};

const deadAnalysis = (finals) => {
  // users: files outside a copy's own folder that still import one of its names (or re-export it).
  const users = new Map(FAMILIES.map((f) => [f.stub, []]));
  for (const w of WS) {
    if (w.isGateway) continue;
    for (const file of lib.walk(w.dir)) {
      const r = rel(file);
      if (isOwn(r)) continue;
      const text = finals.get(file) ?? fs.readFileSync(file, 'utf8');
      if (!ALL_NAMES.some((nm) => text.includes(nm))) continue;
      const sf = lib.parse(file, text);
      for (const st of sf.statements) {
        const specs = [];
        if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings) && !isGatewaySpec(st.moduleSpecifier.text)) for (const e of st.importClause.namedBindings.elements) specs.push((e.propertyName ?? e.name).text);
        if (ts.isExportDeclaration(st) && st.moduleSpecifier && st.exportClause && ts.isNamedExports(st.exportClause)) for (const e of st.exportClause.elements) specs.push((e.propertyName ?? e.name).text);
        for (const nm of specs) {
          const fam = BY_STUB.get(nm) ?? BY_TYPE.get(nm) ?? FAMILIES.find((f) => f.contract === nm);
          if (fam) users.get(fam.stub).push(`${r}${ts.isExportDeclaration(st) ? ' (re-export)' : ''}`);
        }
      }
    }
  }
  return users;
};

const cascade = (deadFamilies, finals) => {
  // Contract folders a dead copy's contract imports from siblings; dead when nothing outside dead folders imports them.
  const resolve = lib.makeResolver();
  const deadDirs = new Set(deadFamilies.map((f) => f.dir));
  const cand = new Map();
  for (const f of deadFamilies) {
    const cf = path.join(ROOT, f.dir, path.basename(f.dir) + '-contract.ts');
    if (!fs.existsSync(cf)) continue;
    const sf = lib.parse(cf, fs.readFileSync(cf, 'utf8'));
    for (const st of sf.statements) {
      if (!ts.isImportDeclaration(st)) continue;
      const m = /^\.\.\/([^/]+)\/\1-contract$/u.exec(st.moduleSpecifier.text);
      if (m) cand.set(path.join(path.dirname(f.dir), m[1]), f.dir);
    }
  }
  const out = [];
  for (const [dir, via] of cand) {
    const rdir = dir.split(path.sep).join('/');
    const w = lib.workspaceOf(path.join(ROOT, rdir), WS);
    const importers = [];
    for (const wk of WS) {
      if (wk.isGateway) continue;
      for (const file of lib.walk(wk.dir)) {
        const r = rel(file);
        if (r.startsWith(`${rdir}/`) || [...deadDirs].some((d) => r.startsWith(`${d}/`))) continue;
        const text = finals.get(file) ?? fs.readFileSync(file, 'utf8');
        if (!text.includes(path.basename(rdir))) continue;
        const sf = lib.parse(file, text);
        for (const st of sf.statements) {
          if ((ts.isImportDeclaration(st) || ts.isExportDeclaration(st)) && st.moduleSpecifier) {
            const res = resolve(st.moduleSpecifier.text, file);
            if (res && rel(res).startsWith(`${rdir}/`)) importers.push(r);
          }
        }
      }
    }
    out.push({ dir: rdir, via, importers: [...new Set(importers)], dead: !importers.length, pkg: w?.short });
  }
  return out;
};

const writeDead = (finals, header) => {
  const users = deadAnalysis(finals);
  const lines = [header];
  const deadFams = [];
  for (const f of FAMILIES) {
    const u = [...new Set(users.get(f.stub))];
    const barrel = u.filter((x) => x.endsWith('(re-export)'));
    const real = u.filter((x) => !x.endsWith('(re-export)'));
    const status = real.length ? 'ALIVE' : 'DEAD';
    if (!real.length) deadFams.push(f);
    lines.push(`${status}  ${f.dir}  (${f.contract}, ${f.stub}, ${f.type})  users outside the folder: ${real.length}${barrel.length ? `; barrel re-export lines to remove: ${barrel.join(', ')}` : ''}`);
    for (const x of real.slice(0, 8)) lines.push(`        ${x}`);
    if (real.length > 8) lines.push(`        ... ${real.length - 8} more`);
  }
  const cas = cascade(deadFams, finals);
  if (cas.length) lines.push('', 'Contracts a dead copy imports, and whether anything else does (candidates to move out with it):');
  for (const c of cas) lines.push(`${c.dead ? 'DEAD ' : 'ALIVE'} ${c.dir}  via ${c.via}${c.dead ? '' : `  importers: ${c.importers.slice(0, 5).join(', ')}${c.importers.length > 5 ? ` ... ${c.importers.length}` : ''}`}`);
  return lines.join('\n') + '\n';
};

// ---------------------------------------------------------------- main

fs.mkdirSync(OUT, { recursive: true });
if (LIST_DEAD) {
  const txt = writeDead(new Map(), `dead copies on the tree as it stands (${new Date().toISOString().slice(0, 10)}); nothing deleted`);
  fs.writeFileSync(path.join(OUT, 'dead-copies-now.txt'), txt);
  process.stdout.write(txt);
  process.exit(0);
}

const targets = WS.filter((w) => !w.isGateway && (pkgArgs.length ? pkgArgs.includes(w.short) : collectFiles(w).some((f) => { const p = plan(f.file, f.orig); return p.cands.length || p.leftovers.length; })));
const stats = {};
const bump = (pkg, key, field, n = 1) => { ((stats[pkg] ??= {})[key] ??= { swapped: 0, leftover: 0 })[field] += n; };
const leftoverLines = [];
const blockerLines = [];
const finals = new Map();
let diffText = '';
const t0 = Date.now();
for (const w of targets) {
  const infos = processPackage(w);
  for (const b of infos.blockers) blockerLines.push(`${w.short}\t${b}`);
  for (const i of infos) {
    const acceptedSet = new Set(i.accepted ?? []);
    for (const c of i.cands) {
      if (!i.dropped && acceptedSet.has(c)) bump(w.short, c.stub, 'swapped');
      else {
        bump(w.short, c.stub, 'leftover');
        leftoverLines.push(`${i.r}:${c.line}\t${c.stub}\t${infos.dropCand.get(c) || i.dropped || i.why || 'gate: adds a diagnostic'}`);
      }
    }
    for (const l of i.leftovers) {
      if (!l.reason.startsWith('referenced')) bump(w.short, l.what, 'leftover');
      leftoverLines.push(`${i.r}:${l.line}\t${l.what}\t${l.reason}`);
    }
    const fin = finalTextOf(i);
    if (fin !== null && fin !== i.orig) {
      finals.set(i.file, fin);
      diffText += lib.unifiedDiff(i.r, i.orig, fin);
      if (sampleOut) {
        const dest = path.join(sampleOut, i.r);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, fin);
      } else if (APPLY) fs.writeFileSync(i.file, fin);
    }
  }
}
const mode = APPLY ? 'APPLIED' : sampleOut ? 'SAMPLE' : 'DRY RUN';
const tag = targets.map((w) => w.short).join('+') || 'none';
fs.writeFileSync(path.join(OUT, `${tag}.diff`), diffText);
fs.writeFileSync(path.join(OUT, `leftovers-${tag}.txt`), leftoverLines.sort().join('\n') + '\n');
fs.writeFileSync(path.join(OUT, `blockers-${tag}.txt`), blockerLines.join('\n') + '\n');
fs.writeFileSync(path.join(OUT, `dead-copies-${tag}.txt`), writeDead(finals, `dead copies after the swap of ${tag} (${mode}); nothing deleted`));
fs.writeFileSync(path.join(OUT, `stats-${tag}.json`), JSON.stringify(stats, null, 2));
console.log(`${mode} ${tag} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
for (const [pkg, byStub] of Object.entries(stats)) for (const [k, v] of Object.entries(byStub)) console.log(`  ${pkg.padEnd(13)} ${k.padEnd(28)} swapped ${String(v.swapped).padStart(3)}  leftover ${String(v.leftover).padStart(3)}`);
console.log(`blockers (sites a retype breaks, round 1): ${rel(path.join(OUT, `blockers-${tag}.txt`))} (${blockerLines.length} lines)`);
console.log(`leftovers: ${rel(path.join(OUT, `leftovers-${tag}.txt`))} (${leftoverLines.length} lines); diff: ${rel(path.join(OUT, `${tag}.diff`))}; dead: ${rel(path.join(OUT, `dead-copies-${tag}.txt`))}`);

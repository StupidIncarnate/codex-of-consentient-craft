// B04 (a) refinement: narrow helper params typed `TSESTree.Node` to the union of node types their
// PRODUCTION call sites pass. Runs over the retyped overlay (sample-all), LanguageService per package.
// Usage: node .../narrow.cjs [--sample=tmp/phase34-feasibility/b04/sample-all] [--out=dir]
const fs = require('fs');
const path = require('path');
const lib = require('../../phase34/lib/repo.cjs');
const { NODE_NAMES } = require('./retype.cjs');
const { ts, ROOT, rel } = lib;
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const SAMPLE = path.join(ROOT, arg('sample') ?? 'tmp/phase34-feasibility/b04/sample-all');
const out = arg('out');
const w = lib.workspaces().find((x) => x.short === 'eslint-plugin');

const live = new Map();
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : live.set(path.join(ROOT, path.relative(SAMPLE, path.join(d, e.name))), { v: 1, text: fs.readFileSync(path.join(d, e.name), 'utf8') })));
walk(SAMPLE);
const prodFiles = [...live.keys()].filter((f) => f.startsWith(w.dir) && !lib.isTestSupport(f));
const svc = lib.makeLanguageService(w.dir, live);
const setText = (f, t) => live.set(f, { v: live.get(f).v + 1, text: t });

const errorsIn = (files) => files.reduce((a, f) => a + svc.service.getSemanticDiagnostics(f).length + svc.service.getSyntacticDiagnostics(f).length, 0);
const before = errorsIn(prodFiles);

let aliasSets = null;
const buildAliases = (checker, program) => {
  const sf = program.getSourceFile(prodFiles[0]);
  const treeSym = checker.resolveName('TSESTree', undefined, ts.SymbolFlags.Namespace, false);
  aliasSets = [];
  // find the TSESTree namespace through any file that imports it
  for (const f of prodFiles) {
    const s = program.getSourceFile(f);
    const imp = s.statements.find((x) => ts.isImportDeclaration(x) && x.importClause?.namedBindings && ts.isNamedImports(x.importClause.namedBindings) && x.importClause.namedBindings.elements.some((e) => e.name.text === 'TSESTree'));
    if (!imp) continue;
    const spec = imp.importClause.namedBindings.elements.find((e) => e.name.text === 'TSESTree');
    let sym = checker.getSymbolAtLocation(spec.name);
    if (sym && sym.flags & ts.SymbolFlags.Alias) sym = checker.getAliasedSymbol(sym);
    for (const ex of checker.getExportsOfModule(sym)) {
      if (!(ex.flags & ts.SymbolFlags.TypeAlias)) continue;
      const t = checker.getDeclaredTypeOfSymbol(ex);
      const names = [...new Set((t.isUnion() ? t.types : [t]).map((m) => nodeNameOf(checker, m)))];
      if (names.length > 3 && names.every((n) => n)) aliasSets.push({ name: ex.name, names: new Set(names) });
    }
    break;
  }
  aliasSets.sort((a, b) => a.names.size - b.names.size);
};

const printUnion = (names) => {
  const set = new Set(names);
  if (set.size > 6) {
    const alias = aliasSets.find((a) => a.names.size === set.size && [...set].every((n) => a.names.has(n)));
    if (alias) return `TSESTree.${alias.name}`;
    // cover with the smallest alias superset only if it is not the whole Node union
    const sup = aliasSets.filter((a) => [...set].every((n) => a.names.has(n)) && a.name !== 'Node');
    if (sup.length && sup[0].names.size <= set.size + 6) return `TSESTree.${sup[0].name}`;
    return null;
  }
  return [...set].sort().map((n) => `TSESTree.${n}`).join(' | ');
};

const nodeNameOf = (checker, p) => {
  const tp = p.getProperty('type');
  if (!tp) return null;
  const tt = checker.getTypeOfSymbol(tp);
  const n = tt.symbol?.name;
  return n && NODE_NAMES.has(n) ? n : null;
};
const argTypeNames = (checker, expr) => {
  const t = checker.getTypeAtLocation(expr);
  const parts = t.isUnion() ? t.types : [t];
  const names = [];
  for (const p of parts) {
    const n = nodeNameOf(checker, p);
    if (!n) return null;
    names.push(n);
  }
  return names;
};

const dbg = { sites: 0, noCalls: 0, nonCallRef: 0, callable: 0 };
let narrowed = 0;
let considered = 0;
for (let round = 0; round < 4; round++) {
  let changed = false;
  const program = svc.service.getProgram();
  const checker = program.getTypeChecker();
  if (!aliasSets) buildAliases(checker, program);
  for (const f of prodFiles) {
    if (/rule-[^/]*-broker\.ts$/u.test(f) && false) continue;
    const sf = program.getSourceFile(f);
    const edits = [];
    const visitFn = (n) => {
      // function-like bound to a name: const x = (...) => ..., or function x(...)
      let nameNode = null;
      let fn = null;
      if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer && (ts.isArrowFunction(n.initializer) || ts.isFunctionExpression(n.initializer))) {
        nameNode = n.name;
        fn = n.initializer;
      } else if (ts.isFunctionDeclaration(n) && n.name) {
        nameNode = n.name;
        fn = n;
      }
      if (fn) {
        // sites: param typed exactly TSESTree.Node, or a property `p: TSESTree.Node` in a destructured param type literal
        const sites = [];
        fn.parameters.forEach((param, idx) => {
          if (param.type && ts.isTypeReferenceNode(param.type) && param.type.typeName.getText(sf) === 'TSESTree.Node') sites.push({ typeNode: param.type, idx, prop: null });
          if (param.type && ts.isTypeLiteralNode(param.type)) {
            for (const m of param.type.members) {
              if (ts.isPropertySignature(m) && m.type && ts.isTypeReferenceNode(m.type) && m.type.typeName.getText(sf) === 'TSESTree.Node') sites.push({ typeNode: m.type, idx, prop: m.name.getText(sf) });
            }
          }
        });
        if (sites.length) {
          considered += sites.length;
          const refs = svc.service.findReferences(f, nameNode.getStart(sf)) ?? [];
          const calls = [];
          for (const r of refs) for (const ref of r.references) {
            if (ref.isDefinition) continue;
            const rf = path.resolve(ref.fileName);
            const rsf = program.getSourceFile(rf);
            if (!rsf) continue;
            if (lib.isTestSupport(rf)) continue; // production callers only
            const tok = (function find(n) { if (ref.textSpan.start >= n.getStart(rsf) && ref.textSpan.start + ref.textSpan.length <= n.end) { return ts.forEachChild(n, find) ?? n; } })(rsf);
            let call = tok?.parent;
            if (call && (ts.isImportSpecifier(call) || ts.isExportSpecifier(call))) continue;
            if (call && ts.isCallExpression(call) && call.expression === tok) calls.push({ call, rsf });
            else calls.push({ call: null });
          }
          dbg.sites++; if (!calls.length) dbg.noCalls++; else if (!calls.every((c) => c.call)) dbg.nonCallRef++; else dbg.callable++;
          if (calls.length && calls.every((c) => c.call)) {
            for (const s of sites) {
              const names = [];
              let ok = true;
              for (const { call } of calls) {
                const a = call.arguments[s.idx];
                let expr = a;
                if (s.prop) {
                  if (!a || !ts.isObjectLiteralExpression(a)) { ok = false; break; }
                  const pa = a.properties.find((p) => p.name && p.name.getText() === s.prop);
                  if (!pa) { ok = false; break; }
                  expr = ts.isShorthandPropertyAssignment(pa) ? pa.name : pa.initializer;
                }
                if (!expr) { ok = false; break; }
                const nm = argTypeNames(checker, expr);
                if (!nm) { ok = false; dbg.badArg = (dbg.badArg ?? []); if (dbg.badArg.length < 6) dbg.badArg.push(checker.typeToString(checker.getTypeAtLocation(expr))); break; }
                names.push(...nm);
              }
              if (!ok || !names.length) continue;
              const txt = printUnion(names);
              if (!txt || txt === 'TSESTree.Node') continue;
              edits.push({ start: s.typeNode.getStart(sf), end: s.typeNode.end, text: txt });
            }
          }
        }
      }
      ts.forEachChild(n, visitFn);
    };
    visitFn(sf);
    if (edits.length) {
      narrowed += edits.length;
      setText(f, lib.applyEdits(live.get(f).text, edits));
      changed = true;
      break; // program is stale after an edit; restart the round
    }
  }
  if (!changed) break;
  round = -1 + (round > 60 ? 100 : 0) + round + 1 - 1; // keep looping until stable (bounded below)
  if (narrowed > 400) break;
}
const after = errorsIn(prodFiles);
console.log(JSON.stringify(dbg));
console.log(JSON.stringify({ sitesConsidered: considered, narrowed, prodErrorsBefore: before, prodErrorsAfter: after }));
if (out) {
  for (const [f, t] of live) {
    const dest = path.join(ROOT, out, rel(f));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, t.text);
  }
}

// SD1 (a2): retype a helper's `TSESTree.Node` parameter to the union of node types its PRODUCTION callers pass,
// one edit at a time, kept only when the errors in the helper's file and its callers' files do not rise.
const path = require('path');
const lib = require('../lib/repo.cjs');
const { NODE_NAMES } = require('./retype.cjs');
const { ts } = lib;

let aliasSets = null;
const buildAliases = (checker, program, prodFiles) => {
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


const narrowGated = (svc, live, prodFiles) => {
  const errs = (files) => files.reduce((a, f) => a + svc.service.getSemanticDiagnostics(f).length + svc.service.getSyntacticDiagnostics(f).length, 0);
  const setText = (f, t) => live.set(f, { v: live.get(f).v + 1, text: t });
  const banned = new Set();
  const accepted = [];
  for (let round = 0; round < 400; round++) {
    const program = svc.service.getProgram();
    const checker = program.getTypeChecker();
    if (!aliasSets) buildAliases(checker, program, prodFiles);
    let cand = null;
    for (const f of prodFiles) {
      const sf = program.getSourceFile(f);
      const visitFn = (n) => {
        if (cand) return;
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
          const sites = [];
          fn.parameters.forEach((param, idx) => {
            if (param.type && ts.isTypeReferenceNode(param.type) && param.type.typeName.getText(sf) === 'TSESTree.Node') sites.push({ typeNode: param.type, idx, prop: null });
            if (param.type && ts.isTypeLiteralNode(param.type)) {
              for (const m of param.type.members) if (ts.isPropertySignature(m) && m.type && ts.isTypeReferenceNode(m.type) && m.type.typeName.getText(sf) === 'TSESTree.Node') sites.push({ typeNode: m.type, idx, prop: m.name.getText(sf) });
            }
          });
          if (sites.length) {
            const refs = svc.service.findReferences(f, nameNode.getStart(sf)) ?? [];
            const calls = [];
            const watch = new Set([f]);
            for (const r of refs) for (const ref of r.references) {
              if (ref.isDefinition) continue;
              const rf = path.resolve(ref.fileName);
              const rsf = program.getSourceFile(rf);
              if (!rsf || lib.isTestSupport(rf)) continue;
              watch.add(rf);
              const tok = (function find(x) { if (ref.textSpan.start >= x.getStart(rsf) && ref.textSpan.start + ref.textSpan.length <= x.end) return ts.forEachChild(x, find) ?? x; })(rsf);
              const call = tok?.parent;
              if (call && (ts.isImportSpecifier(call) || ts.isExportSpecifier(call))) continue;
              calls.push(call && ts.isCallExpression(call) && call.expression === tok ? { call } : { call: null });
            }
            if (calls.length && calls.every((c) => c.call)) {
              for (const s of sites) {
                const key = `${f}:${nameNode.text}:${s.idx}:${s.prop}`;
                if (banned.has(key)) continue;
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
                  const nm = expr && argTypeNames(checker, expr);
                  if (!nm) { ok = false; break; }
                  names.push(...nm);
                }
                if (!ok || !names.length) { banned.add(key); continue; }
                const txt = printUnion(names);
                if (!txt || txt === 'TSESTree.Node') { banned.add(key); continue; }
                cand = { key, f, watch: [...watch], edit: { start: s.typeNode.getStart(sf), end: s.typeNode.end, text: txt }, name: nameNode.text };
                return;
              }
            }
          }
        }
        ts.forEachChild(n, visitFn);
      };
      visitFn(sf);
      if (cand) break;
    }
    if (!cand) break;
    const before = errs(cand.watch);
    const text0 = live.get(cand.f).text;
    setText(cand.f, lib.applyEdits(text0, [cand.edit]));
    const after = errs(cand.watch);
    if (after <= before) banned.clear();
    if (after <= before) accepted.push({ file: lib.rel(cand.f), name: cand.name, to: cand.edit.text, delta: after - before });
    else setText(cand.f, text0);
    banned.add(cand.key);
  }
  return accepted;
};

module.exports = { narrowGated };

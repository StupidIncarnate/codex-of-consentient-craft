// B18 split (b), full script. Every function whose declared return is AdapterResult (or a one-value `{ success: true }`)
// becomes void, and everything that follows it moves with it: constant returns (also through a `const ok = ...` alias, a
// `Promise.resolve(...)`, a never-typed `exit()`), callers that discard it, forwarders (`return other()`, `.then/.catch`
// chains, `Promise.all(items.map(...))`), function TYPES it flows into (Map generics, contract types, object properties),
// generic wrappers whose result is their callback's (`questWithModifyLockBroker`), and aliases typed by
// `Awaited<ReturnType<typeof X>>`. Entities in different packages are linked by id and rounds repeat until the set of
// functions that cannot convert stops growing. Then tests and proxies are rewritten from the TYPECHECKER's view of the
// converted tree: `expect(x).toStrictEqual({ success: true })` becomes `.toBeUndefined()` only where x is void now; a
// constant the checker rejects (`mockResolvedValue({ success: true })` against a void function) becomes `undefined`, and
// only where the edit clears a diagnostic the conversion caused.
//
// Usage (from the repo root, or pass --root=DIR; settings in lib/port-config.cjs):
//   node scrolls/brands-gateways-epic/phase34-scripts/b18-adapter-result/run.cjs [--pkgs=a,b] [--sample-out=dir] [--leftovers=file] [--no-verify]
// It is a dry run. It writes nothing under packages/ and deletes nothing; --sample-out writes the changed files as copies
// at their repo paths (prove them with lib/verify-sample.cjs --check=...). Verification typechecks every touched package and
// every package that depends on one, before and after, and prints only the diagnostics the conversion added.
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');
const { ts, ROOT, rel } = lib;

const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const flag = (n) => process.argv.includes(`--${n}`);
const onlyPkgs = arg('pkgs')?.split(',');
const ws = lib.workspaces();
const K = ts.SyntaxKind;

// ------------------------------------------------------------------ syntax helpers
const unwrap = (e) => {
  while (
    ts.isParenthesizedExpression(e) ||
    ts.isAwaitExpression(e) ||
    ts.isAsExpression(e) ||
    ts.isNonNullExpression(e) ||
    ts.isSatisfiesExpression?.(e)
  )
    e = e.expression;
  return e;
};
const isTrue = (e) => unwrap(e).kind === K.TrueKeyword;
const isSuccessLiteral = (e) => {
  e = unwrap(e);
  return (
    ts.isObjectLiteralExpression(e) &&
    e.properties.length === 1 &&
    ts.isPropertyAssignment(e.properties[0]) &&
    e.properties[0].name.getText() === 'success' &&
    isTrue(e.properties[0].initializer)
  );
};
// Returns 'const' when the expression can only be the constant success value, else null.
const constKind = (e) => {
  e = unwrap(e);
  if (isSuccessLiteral(e)) return 'const';
  if (ts.isCallExpression(e)) {
    const t = e.expression.getText();
    if (t === 'adapterResultContract.parse' && e.arguments.length === 1) return constKind(e.arguments[0]);
    if (t === 'AdapterResultStub' && e.arguments.length === 0) return 'const';
    if (t === 'Promise.resolve' && e.arguments.length === 1) return constKind(e.arguments[0]);
  }
  return null;
};
// The AdapterResult (or one-value) node inside a return type: { node, promise } or null.
const constType = (t, sf) => {
  if (!t || t.kind === K.VoidKeyword) return null;
  let x = t;
  if (ts.isTypeReferenceNode(x) && x.typeName.getText(sf) === 'Promise' && x.typeArguments?.length === 1) x = x.typeArguments[0];
  if (ts.isTypeReferenceNode(x) && x.typeName.getText(sf) === 'AdapterResult') return { node: x, promise: x !== t };
  if (
    ts.isTypeLiteralNode(x) &&
    x.members.length === 1 &&
    ts.isPropertySignature(x.members[0]) &&
    x.members[0].name.getText(sf) === 'success' &&
    x.members[0].type?.getText(sf) === 'true'
  )
    return { node: x, promise: x !== t };
  return null;
};
const enclosingFn = (n) => {
  let c = n.parent;
  while (c && !ts.isFunctionLike(c)) c = c.parent;
  return c;
};
const keyOf = (n) => `${n.getSourceFile().fileName}:${n.getStart()}`;

// ------------------------------------------------------------------ per-package analysis
// Runs in rounds. A round analyses every package; an entity whose forward target, caller or value slot lives in ANOTHER
// package is linked to it by id, and the ids that died in one round (plus their cross-package neighbours) are fed to the
// next, until the dead set stops growing.
let editsByFile;
let report;
let converted;
let pkgLive;
const addEdit = (f, e) => (editsByFile.get(f) ?? editsByFile.set(f, []).get(f)).push(e);
const textOf = new Map();
const getText = (f) => textOf.get(f) ?? textOf.set(f, fs.readFileSync(f, 'utf8')).get(f);
const idOfDecl = (fn, nameNode) => `${rel(fn.getSourceFile().fileName)}#${nameNode ? nameNode.text : fn.getStart()}`;

const analyse = (globalDead, knownIds) => {
  editsByFile = new Map();
  report = { perPkg: {}, blocked: [], slots: [], testLeft: [], editedFiles: new Set(), deadIds: new Set(), candIds: new Set(), adj: new Map(), extOther: new Set() };
  converted = [];
  pkgLive = new Map();
  const link = (a, b) => {
    (report.adj.get(a) ?? report.adj.set(a, new Set()).get(a)).add(b);
    (report.adj.get(b) ?? report.adj.set(b, new Set()).get(b)).add(a);
  };
  const knownNames = new Set([...knownIds].map((i) => i.split('#')[1]));

  for (const w of ws) {
    if (w.isGateway) continue;
    if (onlyPkgs && !onlyPkgs.includes(w.short)) continue;
    const files = lib.walk(w.dir);
    const prod = files.filter((f) => !lib.isTestSupport(f));
    const withAr = prod.filter((f) => /AdapterResult|success: true|ReturnType<typeof/u.test(getText(f)));
    if (!withAr.length) continue;
    const svc = lib.makeLanguageService(w.dir, new Map());
    const program = svc.service.getProgram();
    const checker = program.getTypeChecker();

    const ents = new Map(); // function-like node (or slot type node) -> entity
    const slots = new Map();
    const cands = [];
    const isOneValue = (ty) => {
      const s = checker.typeToString(ty);
      return s === '{ success: true; }' || s === 'Promise<{ success: true; }>';
    };
    for (const f of withAr) {
      const sf = program.getSourceFile(f);
      if (!sf) continue;
      const visit = (n) => {
        if (ts.isFunctionLike(n) && n.body && n.type) {
          let nameNode = null;
          if (ts.isFunctionDeclaration(n) && n.name) nameNode = n.name;
          else if ((ts.isArrowFunction(n) || ts.isFunctionExpression(n)) && ts.isVariableDeclaration(n.parent) && ts.isIdentifier(n.parent.name)) nameNode = n.parent.name;
          let ct = constType(n.type, sf);
          let derived = false;
          if (!ct && ts.isTypeReferenceNode(n.type) && isOneValue(checker.getTypeFromTypeNode(n.type))) {
            derived = true;
            ct = { node: n.type, promise: false };
          }
          if (ct) {
            const id = nameNode ? idOfDecl(n, nameNode) : `anon:${rel(f)}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`;
            const e = { kind: 'fn', id, pkg: w.short, file: f, sf, fn: n, nameNode, name: nameNode?.text ?? id, ct, derived, deps: new Set(), extDeps: new Set(), callers: 0, forwards: 0, members: [], anon: !nameNode };
            cands.push(e);
            ents.set(n, e);
            report.candIds.add(id);
          }
        }
        ts.forEachChild(n, visit);
      };
      visit(sf);
    }
    if (!cands.length && !knownNames.size) continue;
    const byName = new Map();
    for (const c of cands) if (c.nameNode) (byName.get(c.name) ?? byName.set(c.name, []).get(c.name)).push(c);

    const declOfCall = (call) => {
      const callee = ts.isPropertyAccessExpression(call.expression) ? call.expression.name : call.expression;
      let sym = checker.getSymbolAtLocation(callee);
      if (sym && sym.flags & ts.SymbolFlags.Alias) sym = checker.getAliasedSymbol(sym);
      const d = sym?.declarations?.[0];
      if (!d) return null;
      return ts.isVariableDeclaration(d) || ts.isPropertyAssignment(d) ? d.initializer : d;
    };
    const isNever = (e) => (checker.getTypeAtLocation(e).flags & ts.TypeFlags.Never) !== 0;
    const slotFromSig = (sig) => {
      const d = sig?.declaration;
      if (!d || !d.type) return null;
      const dsf = d.getSourceFile();
      if (dsf.fileName.includes('node_modules')) return null;
      const ct = constType(d.type, dsf);
      if (!ct) return null;
      const k = keyOf(d.type);
      if (!slots.has(k)) slots.set(k, { kind: 'slot', id: `slot:${k}`, pkg: w.short, file: dsf.fileName, sf: dsf, typeNode: d.type, ct, deps: new Set(), extDeps: new Set(), members: [], key: k, name: `<slot ${rel(dsf.fileName)}:${dsf.getLineAndCharacterOfPosition(d.type.getStart()).line + 1}>` });
      return slots.get(k);
    };
    const slotOf = (node) => slotFromSig(checker.getContextualType(node)?.getCallSignatures?.()[0]);
    const extEntityAt = (declNode) => {
      // a candidate-shaped function in another package
      const f = declNode.getSourceFile().fileName;
      if (f.startsWith(w.dir + path.sep) || f.includes('node_modules')) return null;
      const nm = ts.isFunctionDeclaration(declNode) ? declNode.name : ts.isVariableDeclaration(declNode.parent) ? declNode.parent.name : null;
      if (!nm) return null;
      const id = idOfDecl(declNode, nm);
      return knownIds.has(id) ? id : null;
    };

    // ---- reference index: own candidates and other packages' candidates ----
    const refsOf = new Map(cands.map((c) => [c, []]));
    const extRefs = []; // { id, node }
    const re = byName.size || knownNames.size ? new RegExp(`\\b(${[...new Set([...byName.keys(), ...knownNames])].join('|')})\\b`, 'u') : null;
    for (const f of prod) {
      if (!re || !re.test(getText(f))) continue;
      const sf = program.getSourceFile(f);
      if (!sf) continue;
      const visit = (n) => {
        if (ts.isIdentifier(n) && (byName.has(n.text) || knownNames.has(n.text))) {
          let sym = checker.getSymbolAtLocation(n);
          if (sym && sym.flags & ts.SymbolFlags.Alias) sym = checker.getAliasedSymbol(sym);
          for (const d of sym?.declarations ?? []) {
            const fnNode = ts.isVariableDeclaration(d) ? d.initializer : d;
            const e = fnNode && ents.get(fnNode);
            if (e) {
              if (n !== e.nameNode) refsOf.get(e).push(n);
            } else if (fnNode && (ts.isFunctionDeclaration(fnNode) || ts.isArrowFunction(fnNode) || ts.isFunctionExpression(fnNode))) {
              const id = extEntityAt(fnNode);
              if (id && !ts.isImportSpecifier(n.parent) && !ts.isExportSpecifier(n.parent)) extRefs.push({ id, node: n });
            }
          }
        }
        ts.forEachChild(n, visit);
      };
      visit(sf);
    }

    // ---- what a call's value does ----
    const chainMethods = new Set(['catch', 'finally', 'then']);
    const collectors = new Set(['Promise.all', 'Promise.allSettled', 'Promise.race']);
    const classifyCall = (call, entity) => {
      let cur = call;
      for (let guard = 0; guard < 24; guard++) {
        const p = cur.parent;
        if (!p) return { ok: false, why: 'no parent' };
        if (ts.isParenthesizedExpression(p) || ts.isAwaitExpression(p) || ts.isAsExpression(p) || ts.isNonNullExpression(p)) {
          cur = p;
          continue;
        }
        if (ts.isExpressionStatement(p) || ts.isVoidExpression(p)) return { ok: true, kind: 'discard' };
        if (ts.isPropertyAccessExpression(p) && p.expression === cur && chainMethods.has(p.name.text) && ts.isCallExpression(p.parent) && p.parent.expression === p) {
          cur = p.parent;
          continue;
        }
        // Promise.all([... , X()]) and Promise.all(items.map(async () => X()))
        if (ts.isArrayLiteralExpression(p) && ts.isCallExpression(p.parent) && collectors.has(p.parent.expression.getText())) {
          cur = p.parent;
          continue;
        }
        if (ts.isCallExpression(p) && p.arguments.includes(cur) && collectors.has(p.expression.getText())) {
          cur = p;
          continue;
        }
        if (ts.isReturnStatement(p) || (ts.isArrowFunction(p) && p.body === cur)) {
          const fnUp = ts.isArrowFunction(p) ? p : enclosingFn(p);
          if (fnUp && ents.has(fnUp)) return { ok: true, kind: 'forward', to: ents.get(fnUp) };
          if (fnUp && (ts.isArrowFunction(fnUp) || ts.isFunctionExpression(fnUp)) && !fnUp.type) {
            const par = fnUp.parent;
            if (ts.isCallExpression(par) && ts.isPropertyAccessExpression(par.expression) && par.arguments.includes(fnUp)) {
              const m = par.expression.name.text;
              if (chainMethods.has(m) || m === 'map' || m === 'forEach') {
                cur = par;
                continue;
              }
            }
            const slot = slotOf(fnUp);
            if (slot) {
              slot.members.push({ fn: fnUp, ent: entity?.deps ? entity : undefined });
              return { ok: true, kind: 'forward', to: slot };
            }
          }
          // a function whose declared type is an alias that follows this one's result
          if (fnUp && fnUp.type && !ents.has(fnUp)) {
            const fsf = fnUp.getSourceFile();
            const rt = checker.getTypeFromTypeNode(fnUp.type);
            if (isOneValue(rt)) {
              const nameNode = ts.isFunctionDeclaration(fnUp) ? fnUp.name : ts.isVariableDeclaration(fnUp.parent) ? fnUp.parent.name : null;
              const id = nameNode ? idOfDecl(fnUp, nameNode) : `anon:${rel(fsf.fileName)}:${fsf.getLineAndCharacterOfPosition(fnUp.getStart(fsf)).line + 1}`;
              const e = { kind: 'fn', id, pkg: w.short, file: fsf.fileName, sf: fsf, fn: fnUp, nameNode, name: nameNode?.text ?? id, ct: { node: fnUp.type, promise: false }, derived: true, deps: new Set(), extDeps: new Set(), callers: 0, forwards: 0, members: [], anon: !nameNode, late: true };
              ents.set(fnUp, e);
              cands.push(e);
              report.candIds.add(id);
              if (nameNode) (byName.get(e.name) ?? byName.set(e.name, []).get(e.name)).push(e);
              refsOf.set(e, []);
              return { ok: true, kind: 'forward', to: e };
            }
          }
          return { ok: false, why: `return into ${fnUp ? (fnUp.name?.getText?.() ?? 'anonymous fn') : '?'}` };
        }
        return { ok: false, why: p.getText().replace(/\s+/g, ' ').slice(0, 60) };
      }
      return { ok: false, why: 'deep' };
    };

    const reason = new Map();
    const noteExt = (from, id) => link(from.id, id);
    const handleRef = (c, r) => {
      const p = r.parent;
      if (ts.isImportSpecifier(p) || ts.isExportSpecifier(p) || ts.isTypeQueryNode(p)) return;
      if (ts.isQualifiedName(p) && ts.isTypeQueryNode(p.parent)) return;
      if (ts.isCallExpression(p) && p.expression === r) {
        const cl = classifyCall(p, c);
        if (cl.ok && cl.kind === 'discard') c.callers++;
        else if (cl.ok) {
          c.forwards++;
          c.deps.add(cl.to);
          cl.to.deps.add(c);
        } else if (!reason.has(c)) reason.set(c, `caller uses the value: ${cl.why}`);
        return;
      }
      const slot = slotOf(r);
      if (slot) {
        slot.members.push({ ref: r, ent: c });
        c.deps.add(slot);
        return;
      }
      if (!reason.has(c)) reason.set(c, `non-call reference: ${p.getText().replace(/\s+/g, ' ').slice(0, 50)}`);
    };
    for (const c of [...cands]) for (const r of refsOf.get(c) ?? []) handleRef(c, r);
    // late candidates found while classifying still need their own references
    for (let i = 0; i < 5; i++) {
      const pending = cands.filter((c) => c.late && !c.scanned);
      if (!pending.length) break;
      for (const c of pending) {
        c.scanned = true;
        for (const f of prod) {
          if (!new RegExp(`\\b${c.name}\\b`, 'u').test(getText(f))) continue;
          const sf = program.getSourceFile(f);
          const visit = (n) => {
            if (ts.isIdentifier(n) && n.text === c.name && n !== c.nameNode) {
              let sym = checker.getSymbolAtLocation(n);
              if (sym && sym.flags & ts.SymbolFlags.Alias) sym = checker.getAliasedSymbol(sym);
              for (const d of sym?.declarations ?? []) if (ents.get(ts.isVariableDeclaration(d) ? d.initializer : d) === c) handleRef(c, n);
            }
            ts.forEachChild(n, visit);
          };
          if (sf) visit(sf);
        }
      }
    }
    // uses from other packages
    for (const x of extRefs) {
      const p = x.node.parent;
      if (ts.isTypeQueryNode(p) || (ts.isQualifiedName(p) && ts.isTypeQueryNode(p.parent))) continue;
      if (ts.isCallExpression(p) && p.expression === x.node) {
        const cl = classifyCall(p, null);
        if (cl.ok && cl.kind === 'discard') continue;
        if (cl.ok) {
          link(x.id, cl.to.id);
          cl.to.extDeps.add(x.id);
          continue;
        }
      }
      report.extOther.add(x.id);
    }

    // ---- own returns ----
    const varAliasDecls = new Map();
    const cbs = [];
    const ownReturnExprs = (fn) => {
      const out = [];
      if (!fn.body) return out;
      if (!ts.isBlock(fn.body)) return [fn.body];
      const v = (n) => {
        if (n !== fn && ts.isFunctionLike(n)) return;
        if (ts.isReturnStatement(n)) out.push(n.expression ?? null);
        ts.forEachChild(n, v);
      };
      ts.forEachChild(fn.body, v);
      return out;
    };
    const aliasDecl = (id, fn) => {
      if (!ts.isIdentifier(id)) return null;
      const d = checker.getSymbolAtLocation(id)?.declarations?.[0];
      if (!d || !ts.isVariableDeclaration(d) || !d.initializer || d.getSourceFile() !== fn.getSourceFile()) return null;
      if (!(d.parent.flags & ts.NodeFlags.Const)) return null;
      return constKind(d.initializer) ? d : null;
    };
    const analyseOwn = (fn, e) => {
      const forwardsTo = [];
      for (const r of ownReturnExprs(fn)) {
        if (r === null || constKind(r)) continue;
        const u = unwrap(r);
        const ad = aliasDecl(u, fn);
        if (ad) {
          (varAliasDecls.get(e) ?? varAliasDecls.set(e, new Set()).get(e)).add(ad);
          continue;
        }
        if (ts.isCallExpression(u)) {
          if (isNever(u)) continue;
          const target = declOfCall(u);
          if (target && ents.has(target)) {
            forwardsTo.push(ents.get(target));
            continue;
          }
          if (target && target.getSourceFile) {
            const id = extEntityAt(target);
            if (id) {
              e.extDeps.add(id);
              link(e.id, id);
              continue;
            }
          }
          const s = slotFromSig(checker.getResolvedSignature(u));
          if (s) {
            forwardsTo.push(s);
            continue;
          }
          // a generic wrapper (a lock, a retry) whose result type is what its callback returns
          if (isOneValue(checker.getTypeAtLocation(u))) {
            const fnsIn = [];
            for (const a of u.arguments) {
              if (ts.isArrowFunction(a) || ts.isFunctionExpression(a)) fnsIn.push(a);
              else if (ts.isObjectLiteralExpression(a)) for (const pr of a.properties) if (ts.isPropertyAssignment(pr) && (ts.isArrowFunction(pr.initializer) || ts.isFunctionExpression(pr.initializer))) fnsIn.push(pr.initializer);
            }
            const okCbs = [];
            for (const cbFn of fnsIn) {
              let cb = ents.get(cbFn);
              if (!cb) {
                const csf = cbFn.getSourceFile();
                cb = { kind: 'cb', id: `cb:${rel(csf.fileName)}:${csf.getLineAndCharacterOfPosition(cbFn.getStart(csf)).line + 1}`, pkg: w.short, file: csf.fileName, sf: csf, fn: cbFn, name: '<callback>', deps: new Set(), extDeps: new Set(), members: [], callers: 0, forwards: 0 };
                ents.set(cbFn, cb);
                cbs.push(cb);
                const r2 = analyseOwn(cbFn, cb);
                if (!r2.ok) reason.set(cb, `callback ${r2.why}`);
                else for (const x of r2.forwardsTo) { cb.deps.add(x); x.deps.add(cb); }
              }
              okCbs.push(cb);
            }
            if (okCbs.length) {
              for (const cb of okCbs) { forwardsTo.push(cb); }
              continue;
            }
          }
        }
        return { ok: false, why: `return ${r.getText().replace(/\s+/g, ' ').slice(0, 50)}` };
      }
      return { ok: true, forwardsTo };
    };
    const aliasUsesOk = (e) => {
      for (const d of varAliasDecls.get(e) ?? []) {
        let bad = null;
        const v = (n) => {
          if (bad) return;
          if (ts.isIdentifier(n) && n.text === d.name.getText() && n !== d.name) {
            const par = n.parent;
            if (!(ts.isReturnStatement(par) && par.expression === n)) bad = par.getText().replace(/\s+/g, ' ').slice(0, 50);
          }
          ts.forEachChild(n, v);
        };
        v(enclosingFn(d));
        if (bad) return `alias used: ${bad}`;
      }
      return null;
    };
    for (const c of cands) {
      const r = analyseOwn(c.fn, c);
      if (!r.ok) {
        reason.set(c, r.why);
        continue;
      }
      for (const t of r.forwardsTo) {
        c.deps.add(t);
        t.deps.add(c);
      }
      const bad = aliasUsesOk(c);
      if (bad) reason.set(c, bad);
    }
    // an annotated anonymous function is a member of the slot it is contextually typed by
    for (const c of cands) {
      if (!c.anon) continue;
      const s = slotOf(c.fn);
      if (s) {
        s.members.push({ ent: c });
        c.deps.add(s);
        s.deps.add(c);
      }
    }
    for (const s of slots.values()) {
      for (const m of s.members) {
        if (!m.fn) continue;
        const r = analyseOwn(m.fn, s);
        if (!r.ok) {
          reason.set(s, `member ${r.why}`);
          continue;
        }
        for (const t of r.forwardsTo) {
          s.deps.add(t);
          t.deps.add(s);
        }
      }
      for (const m of s.members) if (m.ent && m.ent !== s) {
        s.deps.add(m.ent);
        m.ent.deps.add(s);
      }
      ents.set(s.typeNode, s);
    }

    // ---- fixpoint (function nodes keep their own sets; every dep edge is symmetric) ----
    const all = [...cands, ...slots.values(), ...cbs];
    for (const e of all) for (const id of e.extDeps) if (globalDead.has(id)) reason.set(e, `linked to ${id} which cannot convert`);
    for (const e of all) if (globalDead.has(e.id)) reason.set(e, reason.get(e) ?? 'linked to another package that cannot convert');
    const alive = new Set(all.filter((e) => !reason.has(e)));
    for (let round = 0; round < 60; round++) {
      let changed = false;
      for (const e of [...alive]) {
        for (const d of e.deps) {
          if (!alive.has(d)) {
            reason.set(e, `linked to ${d.name}: ${reason.get(d) ?? 'blocked'}`.slice(0, 130));
            alive.delete(e);
            changed = true;
            break;
          }
        }
      }
      if (!changed) break;
    }
    for (const e of all) if (!alive.has(e)) report.deadIds.add(e.id);

    const convFns = cands.filter((c) => alive.has(c));
    const convSlots = [...slots.values()].filter((s) => alive.has(s));
    report.perPkg[w.short] = {
      functions: cands.length,
      converted: convFns.length,
      callersDiscard: convFns.reduce((a, c) => a + c.callers, 0),
      callersForward: convFns.reduce((a, c) => a + c.forwards, 0),
      slotsRetyped: convSlots.length,
      slotsBlocked: slots.size - convSlots.length,
    };
    for (const c of cands) if (!alive.has(c)) report.blocked.push({ pkg: w.short, file: rel(c.file), name: c.name, reason: reason.get(c) ?? '?' });
    for (const s of slots.values()) if (!alive.has(s)) report.slots.push({ pkg: w.short, name: s.name, reason: reason.get(s) ?? '?' });
    for (const c of convFns) converted.push({ pkg: w.short, file: rel(c.file), name: c.name, callers: c.callers + c.forwards });

    // ---- prod edits ----
    const retype = (e) => {
      if (e.derived) return;
      addEdit(e.file, { start: e.ct.node.getStart(e.sf), end: e.ct.node.end, text: 'void' });
    };
    const rewriteBody = (fn, e, sf, f) => {
      if (!ts.isBlock(fn.body)) {
        if (constKind(fn.body)) addEdit(f, { start: fn.body.getStart(sf), end: fn.body.end, text: '{}' });
        return;
      }
      const stmts = fn.body.statements;
      const t = getText(f);
      const v = (n) => {
        if (n !== fn && ts.isFunctionLike(n)) return;
        if (ts.isReturnStatement(n) && n.expression) {
          const isLast = n === stmts[stmts.length - 1];
          const u = unwrap(n.expression);
          const alias = aliasDecl(u, fn);
          const constLike = constKind(n.expression) || alias;
          const neverCall = ts.isCallExpression(u) && !constLike && isNever(u);
          if (constLike) {
            if (isLast) addEdit(f, { start: t.lastIndexOf('\n', n.getStart(sf)) + 1, end: t.indexOf('\n', n.end) + 1, text: '' });
            else addEdit(f, { start: n.getStart(sf), end: n.end, text: 'return;' });
          } else if (neverCall && isLast) addEdit(f, { start: n.getStart(sf), end: n.expression.getStart(sf), text: '' });
        }
        ts.forEachChild(n, v);
      };
      ts.forEachChild(fn.body, v);
      for (const d of varAliasDecls.get(e) ?? []) {
        const st = d.parent.parent;
        if (ts.isVariableStatement(st) && st.declarationList.declarations.length === 1) addEdit(f, { start: t.lastIndexOf('\n', st.getStart(sf)) + 1, end: t.indexOf('\n', st.end) + 1, text: '' });
      }
    };
    for (const c of convFns) {
      retype(c);
      rewriteBody(c.fn, c, c.sf, c.file);
      report.editedFiles.add(c.file);
    }
    for (const cb of cbs.filter((x) => alive.has(x))) {
      report.editedFiles.add(cb.file);
      rewriteBody(cb.fn, cb, cb.sf, cb.file);
    }
    for (const s of convSlots) {
      retype(s);
      report.editedFiles.add(s.file);
      for (const m of s.members) if (m.fn) rewriteBody(m.fn, s, m.fn.getSourceFile(), m.fn.getSourceFile().fileName);
    }
    pkgLive.set(w.short, { w, convFns });
    console.error(`${w.short}: ${convFns.length}/${cands.length} functions, ${convSlots.length}/${slots.size} slots`);
  }
  // cross-package closure of the dead set
  const dead = new Set([...globalDead, ...report.deadIds, ...report.extOther]);
  const stack = [...dead];
  while (stack.length) {
    const d = stack.pop();
    for (const n of report.adj.get(d) ?? []) if (!dead.has(n)) { dead.add(n); stack.push(n); }
  }
  return dead;
};

let globalDead = new Set();
let knownIds = new Set();
for (let round = 0; round < 6; round++) {
  const dead = analyse(globalDead, knownIds);
  const nextKnown = report.candIds;
  const grew = dead.size > globalDead.size || nextKnown.size > knownIds.size;
  console.error(`round ${round}: dead ${dead.size} known ${nextKnown.size}`);
  globalDead = dead;
  knownIds = new Set([...knownIds, ...nextKnown]);
  if (!grew) break;
}
// ------------------------------------------------------------------ apply prod edits to an overlay, clean imports
const overlay = new Map();
for (const [f, edits] of editsByFile) {
  // slots and member arrows can be reached twice; drop identical edits
  const seen = new Set();
  const uniq = edits.filter((e) => {
    const k = `${e.start}:${e.end}:${e.text}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const out = lib.applyEdits(getText(f), uniq);
  const sf2 = lib.parse(f, out);
  const drop = [];
  for (const st of sf2.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings) || st.importClause.name) continue;
    const els = st.importClause.namedBindings.elements;
    const used = (nm) => {
      let hit = false;
      const vv = (n) => {
        if (hit || ts.isImportDeclaration(n)) return;
        if (ts.isIdentifier(n) && n.text === nm) hit = true;
        ts.forEachChild(n, vv);
      };
      sf2.statements.forEach(vv);
      return hit;
    };
    const keep = els.filter((e) => used(e.name.text));
    if (keep.length === els.length) continue;
    if (!keep.length) {
      const le = out.indexOf('\n', st.end);
      drop.push({ start: st.getStart(sf2), end: le === -1 ? st.end : le + 1, text: '' });
    } else drop.push({ start: st.getStart(sf2), end: st.end, text: `import${st.importClause.isTypeOnly ? ' type' : ''} { ${keep.map((e) => e.getText(sf2)).join(', ')} } from ${st.moduleSpecifier.getText(sf2)};` });
  }
  overlay.set(f, lib.applyEdits(out, drop));
}

// ------------------------------------------------------------------ tests, proxies, stubs: typed rewrite
const isVoidish = (checker, node) => {
  let t = checker.getTypeAtLocation(node);
  const promiseArgs = t.symbol?.name === 'Promise' ? checker.getTypeArguments(t) : null;
  if (promiseArgs?.length === 1) t = promiseArgs[0];
  return (t.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined)) !== 0;
};
const MATCHERS = new Set(['toStrictEqual', 'toBe', 'toEqual']);
const isStubCall = (e) => ts.isCallExpression(e) && e.expression.getText() === 'AdapterResultStub' && e.arguments.length === 0;
const testStats = { assertRewritten: 0, constReplaced: 0, successReadRemoved: 0, unusedResultDropped: 0 };
const dropUnusedImports = (f, out) => {
  const sf2 = lib.parse(f, out);
  const drop = [];
  for (const st of sf2.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings) || st.importClause.name) continue;
    const els = st.importClause.namedBindings.elements;
    const used = (nm) => {
      let hit = false;
      const vv = (x) => {
        if (hit || ts.isImportDeclaration(x)) return;
        if (ts.isIdentifier(x) && x.text === nm) hit = true;
        ts.forEachChild(x, vv);
      };
      sf2.statements.forEach(vv);
      return hit;
    };
    const keep = els.filter((e) => used(e.name.text));
    if (keep.length === els.length) continue;
    if (!keep.length) {
      const le = out.indexOf('\n', st.end);
      drop.push({ start: st.getStart(sf2), end: le === -1 ? st.end : le + 1, text: '' });
    } else drop.push({ start: st.getStart(sf2), end: st.end, text: `import${st.importClause.isTypeOnly ? ' type' : ''} { ${keep.map((e) => e.getText(sf2)).join(', ')} } from ${st.moduleSpecifier.getText(sf2)};` });
  }
  return lib.applyEdits(out, drop);
};
if (overlay.size) {
  for (const [short, { w }] of pkgLive) {
    const live = new Map();
    for (const [f, t] of overlay) live.set(f, { v: 1, text: t });
    const svc = lib.makeLanguageService(w.dir, live);
    const program = svc.service.getProgram();
    const checker = program.getTypeChecker();
    const files = lib.walk(w.dir).filter((f) => lib.isTestSupport(f) && /success|AdapterResultStub/u.test(getText(f)));
    for (const f of files) {
      const sf = program.getSourceFile(f);
      if (!sf) continue;
      const text = getText(f);
      const baseDiag = [...svc.service.getSemanticDiagnostics(f)].map((d) => ({ start: d.start ?? 0, end: (d.start ?? 0) + (d.length ?? 0) }));
      const edits = [];
      const gate = [];
      const skipConst = new Set();
      const v = (n) => {
        if (ts.isImportDeclaration(n)) return;
        if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)) {
          const name = n.expression.name.text;
          const arg = n.arguments[0];
          if (MATCHERS.has(name) && n.arguments.length === 1 && arg && (isSuccessLiteral(arg) || isStubCall(arg))) {
            let q = n.expression.expression;
            if (ts.isPropertyAccessExpression(q) && (q.name.text === 'resolves' || q.name.text === 'rejects')) q = q.expression;
            if (ts.isCallExpression(q) && q.expression.getText() === 'expect' && q.arguments[0]) {
              skipConst.add(arg);
              if (isVoidish(checker, q.arguments[0])) {
                edits.push({ start: n.expression.name.getStart(sf), end: n.end, text: 'toBeUndefined()' });
                testStats.assertRewritten++;
              } else report.testLeft.push({ file: rel(f), line: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1, why: 'expect subject is not void', text: n.getText(sf).slice(0, 90) });
            }
          }
        }
        // expect(V.success).toBe(...) where V is void now: the assertion said nothing, so the statement goes
        if (ts.isPropertyAccessExpression(n) && n.name.text === 'success' && isVoidish(checker, n.expression)) {
          let s = n;
          while (s.parent && !ts.isExpressionStatement(s.parent) && !ts.isBlock(s.parent) && !ts.isSourceFile(s.parent)) s = s.parent;
          if (s.parent && ts.isExpressionStatement(s.parent) && /^(await\s+)?expect\(/u.test(s.parent.getText(sf))) {
            edits.push({ start: text.lastIndexOf('\n', s.parent.getStart(sf)) + 1, end: text.indexOf('\n', s.parent.end) + 1, text: '' });
            testStats.successReadRemoved++;
          } else report.testLeft.push({ file: rel(f), line: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1, why: '.success read on void', text: n.parent.getText(sf).replace(/\s+/g, ' ').slice(0, 90) });
        }
        if ((isSuccessLiteral(n) || isStubCall(n)) && !skipConst.has(n) && !(n.parent && ts.isPropertyAccessExpression(n.parent))) {
          const st = lib.enclosingStatement(n, sf);
          if (baseDiag.some((d) => d.start >= st.stmtStart && d.start <= st.stmtEnd)) gate.push({ start: n.getStart(sf), end: n.end, text: 'undefined', ...st, node: n });
        }
        ts.forEachChild(n, v);
      };
      v(sf);
      if (!edits.length && !gate.length) continue;
      const dedup = (arr) => arr.filter((e, i) => arr.findIndex((o) => o.start === e.start && o.end === e.end) === i);
      let accepted = [];
      if (gate.length) {
        accepted = lib.gateEdits({ service: svc.service, live, file: f, text, cands: gate, render: (acc) => lib.applyEdits(text, dedup([...edits, ...acc.map((a) => ({ start: a.start, end: a.end, text: a.text }))])) });
        testStats.constReplaced += accepted.length;
        for (const g of gate) if (!accepted.includes(g)) report.testLeft.push({ file: rel(f), line: sf.getLineAndCharacterOfPosition(g.start).line + 1, why: 'replacement rejected by the gate', text: g.node.parent.getText(sf).replace(/\s+/g, ' ').slice(0, 90) });
      }
      let out = lib.applyEdits(text, dedup([...edits, ...accepted.map((a) => ({ start: a.start, end: a.end, text: a.text }))]));
      // `const V = await F();` whose V nobody reads any more
      const sf3 = lib.parse(f, out);
      const dead = [];
      const scan = (n) => {
        if (ts.isVariableStatement(n) && n.declarationList.declarations.length === 1) {
          const d = n.declarationList.declarations[0];
          if (ts.isIdentifier(d.name) && d.initializer && (ts.isAwaitExpression(d.initializer) || ts.isCallExpression(d.initializer))) {
            let uses = 0;
            const u = (x) => { if (ts.isIdentifier(x) && x.text === d.name.text && x !== d.name) uses++; ts.forEachChild(x, u); };
            ts.forEachChild(enclosingFn(n) ?? sf3, u);
            const initText = d.initializer.getText(sf3);
            if (uses === 0 && /^(await\s+)?\w+\(/u.test(initText) && /(^|\W)(result|actual|ok|res)\b/u.test(d.name.text) && (edits.length || accepted.length)) dead.push({ start: n.getStart(sf3), end: n.end, text: `${initText};` });
          }
        }
        ts.forEachChild(n, scan);
      };
      scan(sf3);
      if (dead.length) { out = lib.applyEdits(out, dead); testStats.unusedResultDropped += dead.length; }
      overlay.set(f, dropUnusedImports(f, out));
    }
    console.error(`${short} tests scanned`);
  }
}

// ------------------------------------------------------------------ verify: every package with a touched file, plus its dependents
const keyD = (d) => `${d.code}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
const verify = { filesRewritten: overlay.size, cleanFiles: 0, newDiagnostics: 0, kinds: {}, bad: [] };
if (!flag('no-verify') && overlay.size) {
  const touched = new Set([...overlay.keys()].map((f) => lib.workspaceOf(f, ws).name));
  const toCheck = ws.filter((w) => !w.isGateway && (touched.has(w.name) || Object.keys({ ...w.packageJson.dependencies, ...w.packageJson.devDependencies }).some((d) => touched.has(d))));
  for (const w of toCheck) {
    if (onlyPkgs && !onlyPkgs.includes(w.short) && !touched.has(w.name)) continue;
    const options = lib.packageCompilerOptions(w.dir);
    const pf = lib.walk(w.dir);
    const base = lib.diagnosticsWithOverlay(pf, new Map(), options).diagnostics;
    const aft = lib.diagnosticsWithOverlay(pf, overlay, options).diagnostics;
    for (const f of pf) {
      const bk = new Set((base.get(f) ?? []).map(keyD));
      const add = (aft.get(f) ?? []).filter((d) => !bk.has(keyD(d)));
      if (overlay.has(f) && !add.length) verify.cleanFiles++;
      if (add.length) {
        verify.newDiagnostics += add.length;
        for (const d of add) {
          const k = `TS${d.code} ` + ts.flattenDiagnosticMessageText(d.messageText, ' ').slice(0, 55).replace(/'[^']*'/g, 'X');
          verify.kinds[k] = (verify.kinds[k] ?? 0) + 1;
          verify.bad.push(lib.formatDiagnostic(d).slice(0, 220));
        }
      }
    }
    console.error(`${w.short} verified`);
  }
}

// ------------------------------------------------------------------ output
const out = arg('sample-out');
if (out) for (const [f, t] of overlay) {
  const d = path.join(ROOT, out, rel(f));
  fs.mkdirSync(path.dirname(d), { recursive: true });
  fs.writeFileSync(d, t);
}
const sum = (k) => Object.values(report.perPkg).reduce((a, p) => a + p[k], 0);
console.log(JSON.stringify({ functions: sum('functions'), converted: sum('converted'), callersDiscard: sum('callersDiscard'), callersForward: sum('callersForward'), slotsRetyped: sum('slotsRetyped'), slotsBlocked: sum('slotsBlocked'), filesRewritten: overlay.size, testStats }));
console.log('per package', JSON.stringify(report.perPkg));
console.log('verify', JSON.stringify({ filesRewritten: verify.filesRewritten, cleanFiles: verify.cleanFiles, newDiagnostics: verify.newDiagnostics, kinds: verify.kinds }));
const lo = arg('leftovers');
if (lo) {
  fs.mkdirSync(path.dirname(path.join(ROOT, lo)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, lo), JSON.stringify({ blocked: report.blocked, slotsBlocked: report.slots, testLeft: report.testLeft, diagnostics: verify.bad }, null, 1));
}

// B02: the contract parse index, read from syntax trees with TypeScript's own module resolution.
// Read-only. Classifies every `contracts/**/*-contract.ts` file in every non-gateway workspace
// package into exactly one class, most-alive first:
//
//   parsed          production code calls .parse/.safeParse/.parseAsync/.safeParseAsync on one of its
//                   exported consts (or a chain off it: x.shape.id.parse, x.array().parse), or it is
//                   nested in a parsed contract (a parsed contract file value-imports it; closure).
//   value-used      no parse found, but production code uses a const as a VALUE (passes it to a
//                   helper that may parse it, spreads .shape, builds a schema in statics). Needs a human.
//   type-only       production code uses only its types (the eslint-context-contract case from B06).
//   test-only       only tests, stubs, proxies or harnesses use it or its stub (the exec-error-contract
//                   case from B06: a harness uses its stub).
//   dead            nothing outside its own folder's contract/stub/test files references it or its
//                   stub; barrel re-exports do not count. The ONLY class delete.cjs will act on.
//
// "Production" = not a .test/.proxy/.stub/.harness/.e2e file and not under test/, e2e/, __mocks__.
// Re-exports (`export ... from`) never count as a use; `inPublicBarrel` says whether a package
// barrel re-exports it, for the human reading the list.
//
// Also flags `notZodInfer`: an exported type alias/interface in a contract file that is not
// `z.infer<typeof ...>`/`z.input`/`z.output` (B02 item, rule 2; the hydration Collection/RowVerbs/Op case).
//
// Usage: node tmp/phase34/b02-contract-index/index.cjs [pkg ...]
// Writes out/contract-index.json and out/delete-candidates.txt (dead class only, one path per line).
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');

const { ts, rel } = lib;
const buildIndex = (pkgArgs = []) => {
const ws = lib.workspaces();
const resolve = lib.makeResolver();

const isContractFile = (f) => /[\\/]contracts[\\/].*-contract\.ts$/u.test(f);
const folderOf = (f) => path.dirname(f);
// A contract's own trio: itself, <base>.stub.ts and <base>-contract.test.ts beside it. Uses from
// these never keep it alive; every other file, a sibling contract in the same folder included, does.
const trioOf = (cf) => {
  const base = cf.replace(/-contract\.ts$/u, '');
  return new Set([cf, `${base}.stub.ts`, `${base}-contract.test.ts`]);
};
const PARSE = new Set(['parse', 'safeParse', 'parseAsync', 'safeParseAsync']);

const allFiles = ws.filter((w) => !w.isGateway).flatMap((w) => lib.walk(w.dir));
const contractFiles = allFiles.filter(
  (f) => isContractFile(f) && (!pkgArgs.length || pkgArgs.includes(lib.workspaceOf(f, ws).short)),
);
const info = new Map(
  contractFiles.map((f) => [
    f,
    {
      file: rel(f),
      pkg: lib.workspaceOf(f, ws).short,
      layer: /-layer-contract\.ts$/u.test(f),
      exportsConsts: [],
      exportsTypes: [],
      notZodInfer: [],
      parseSites: [],
      nestedIn: [],
      prodValueUses: [],
      prodTypeUses: [],
      testUses: [],
      stubUses: [],
      inPublicBarrel: false,
      cls: null,
    },
  ]),
);

// Exported names and the z.infer check.
for (const f of contractFiles) {
  const sf = lib.parse(f);
  const i = info.get(f);
  for (const st of sf.statements) {
    const exported = (ts.getCombinedModifierFlags(st) & ts.ModifierFlags.Export) !== 0;
    if (!exported) continue;
    if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name)) i.exportsConsts.push(d.name.text);
    } else if (ts.isTypeAliasDeclaration(st)) {
      i.exportsTypes.push(st.name.text);
      const t = st.type.getText(sf);
      if (!/^z\.(infer|input|output)<typeof \w+/u.test(t)) i.notZodInfer.push(st.name.text);
    } else if (ts.isInterfaceDeclaration(st)) {
      i.exportsTypes.push(st.name.text);
      i.notZodInfer.push(st.name.text);
    }
  }
}

// Every import in the repo: which contract (or stub beside one) each imported name lands on, and how
// the importer uses it.
const stubToContract = (f) => {
  if (!/\.stub\.ts$/u.test(f)) return null;
  const dir = folderOf(f);
  return contractFiles.filter((c) => folderOf(c) === dir);
};
const kindOf = (f) => (lib.isTestSupport(f) ? 'test' : 'prod');
const rootIdent = (e) => {
  let x = e;
  for (;;) {
    if (ts.isPropertyAccessExpression(x) || ts.isElementAccessExpression(x)) x = x.expression;
    else if (ts.isCallExpression(x)) x = x.expression;
    else if (ts.isParenthesizedExpression(x) || ts.isNonNullExpression(x) || ts.isAsExpression(x)) x = x.expression;
    else break;
  }
  return ts.isIdentifier(x) ? x : null;
};
const inTypePosition = (n) => {
  for (let p = n.parent; p; p = p.parent) {
    if (ts.isTypeNode(p) || ts.isTypeQueryNode(p) || ts.isTypeAliasDeclaration(p) || ts.isInterfaceDeclaration(p)) return true;
    if (ts.isStatement(p) || ts.isExpression(p) && !ts.isIdentifier(p)) return false;
  }
  return false;
};

for (const f of allFiles) {
  const text = fs.readFileSync(f, 'utf8');
  if (!/contract|Stub/u.test(text)) continue;
  const sf = lib.parse(f, text);
  const local = new Map(); // local name -> { contract file, name, viaStub }
  for (const st of sf.statements) {
    if (ts.isExportDeclaration(st) && st.moduleSpecifier && ts.isStringLiteral(st.moduleSpecifier)) {
      // a re-export: not a use, but note public-barrel reach
      const t = resolve(st.moduleSpecifier.text, f);
      if (t && info.has(t) && !lib.isTestSupport(f) && !isContractFile(f)) info.get(t).inPublicBarrel = true;
      if (t && !st.exportClause) continue;
      if (t && st.exportClause && ts.isNamedExports(st.exportClause)) {
        for (const el of st.exportClause.elements) {
          const d = lib.findDeclaringFile(t, (el.propertyName ?? el.name).text, resolve);
          if (d && info.has(d.file) && !lib.isTestSupport(f) && !isContractFile(f)) info.get(d.file).inPublicBarrel = true;
        }
      }
      continue;
    }
    if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier)) continue;
    const ic = st.importClause;
    if (!ic?.namedBindings || !ts.isNamedImports(ic.namedBindings)) continue;
    const t = resolve(st.moduleSpecifier.text, f);
    if (!t) continue;
    for (const el of ic.namedBindings.elements) {
      const d = lib.findDeclaringFile(t, (el.propertyName ?? el.name).text, resolve);
      if (!d || d.kind !== 'decl') continue;
      const typeOnly = ic.isTypeOnly || el.isTypeOnly;
      if (info.has(d.file)) local.set(el.name.text, { cf: d.file, name: (el.propertyName ?? el.name).text, typeOnly });
      else {
        const cs = stubToContract(d.file);
        if (cs && cs.length) for (const c of cs) if (!trioOf(c).has(f)) info.get(c)?.stubUses.push(rel(f));
      }
    }
  }
  if (!local.size) continue;
  const fromContract = isContractFile(f);
  const sameFolder = (cf) => trioOf(cf).has(f);
  const seen = new Set();
  const visit = (n) => {
    if (ts.isIdentifier(n) && local.has(n.text) && !(n.parent && (ts.isImportSpecifier(n.parent) || ts.isExportSpecifier(n.parent)))) {
      const u = local.get(n.text);
      const i = info.get(u.cf);
      const typePos = u.typeOnly || inTypePosition(n);
      const k = `${u.cf}\0${typePos}`;
      if (!sameFolder(u.cf)) {
        if (kindOf(f) === 'test') {
          if (!seen.has(k + 't')) i.testUses.push(rel(f));
          seen.add(k + 't');
        } else if (fromContract && !typePos) {
          if (!seen.has(k)) i.nestedIn.push(rel(f));
        } else if (typePos) {
          if (!seen.has(k)) i.prodTypeUses.push(rel(f));
        } else if (!seen.has(k)) i.prodValueUses.push(rel(f));
        seen.add(k);
      }
    }
    if (kindOf(f) === 'prod' && ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && PARSE.has(n.expression.name.text)) {
      const r = rootIdent(n.expression.expression);
      if (r && local.has(r.text)) {
        const u = local.get(r.text);
        info.get(u.cf).parseSites.push(`${rel(f)}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`);
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}

// Parsed closure: a contract nested (value-imported) by a parsed contract counts as parsed.
const parsed = new Set(contractFiles.filter((f) => info.get(f).parseSites.length));
for (let changed = true; changed; ) {
  changed = false;
  for (const f of contractFiles) {
    if (parsed.has(f)) continue;
    if (info.get(f).nestedIn.some((p) => parsed.has(path.join(lib.ROOT, p)))) {
      parsed.add(f);
      changed = true;
    }
  }
}
// Nested in a contract that is itself used in production counts as that parent's class at best.
const counts = {};
for (const f of contractFiles) {
  const i = info.get(f);
  const nestedAlive = i.nestedIn.length > 0;
  i.cls = parsed.has(f)
    ? 'parsed'
    : i.prodValueUses.length || nestedAlive
      ? 'value-used'
      : i.prodTypeUses.length
        ? 'type-only'
        : i.testUses.length || i.stubUses.length
          ? 'test-only'
          : 'dead';
  counts[i.cls] = (counts[i.cls] ?? 0) + 1;
}
return { list: contractFiles.map((f) => info.get(f)), counts, trioOf };
};

module.exports = { buildIndex };
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
if (require.main !== module) return;
const pkgArgs = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const { list, counts } = buildIndex(pkgArgs);
fs.writeFileSync(path.join(OUT, 'contract-index.json'), JSON.stringify(list, null, 1));
const dead = list.filter((i) => i.cls === 'dead').map((i) => i.file);
fs.writeFileSync(path.join(OUT, 'delete-candidates.txt'), dead.join('\n') + (dead.length ? '\n' : ''));
const notInfer = list.filter((i) => i.notZodInfer.length);
console.log(`${list.length} contract files indexed`, counts);
console.log(`contract files exporting a type that is not z.infer/input/output: ${notInfer.length}`);
for (const cls of ['dead', 'test-only', 'type-only']) {
  const l = list.filter((i) => i.cls === cls);
  console.log(`\n${cls} (${l.length}):`);
  for (const i of l.slice(0, 60)) console.log(`  ${i.file}${i.inPublicBarrel ? '  [in a package barrel]' : ''}`);
  if (l.length > 60) console.log(`  ... ${l.length - 60} more in out/contract-index.json`);
}
console.log('\nout/contract-index.json, out/delete-candidates.txt written. Review the candidates before delete.cjs.');

#!/usr/bin/env node
// Merge-master residue: master's side still names standalone brands this branch deleted (W1 made them plain, W3/W5
// moved some into owner fields). Rewrites each unresolved use the way W1/W5 rewrote the branch's own callers:
//   plain brand   XStub({ value: v }) -> v     XStub() -> the stub's default literal     xContract.parse(a) -> a
//                 type X / ReturnType<typeof XStub> / z.infer<typeof xContract> -> string | number | the enum union
//   owner field   XStub({ value: v }) -> ownerContract.shape.f.parse(v)    xContract -> ownerContract.shape.f
//                 type X -> Owner['f']
//   still exported somewhere live (an enum contract, a stub that still exists) -> the import master's side lost
// Position-based: only the identifiers the diag reports (TS2304/TS2552), plus every reference to a name whose import the
// diag reports as dead (TS2305/TS2724/TS2307). A shadowed local of the same name is never reported, so it is never touched.
//
// Usage (from the gateway-pivot checkout):
//   node scrolls/brands-gateways-epic/merge-master/plain-brand-residue.cjs --root=<W> [--apply] [--diag=<file>]
//        [--deletions=<dir>] [--out-dir=<dir>] [--allow-drop-validation]
// Dry run by default. Both modes write <out-dir>/plain-brand-{table,rewrites,leftovers}.json (out-dir defaults to
// <root>/tmp/merge-master); only --apply touches source files.
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const flag = (n) => process.argv.includes(`--${n}`);
const ROOT = path.resolve(arg('root') ?? '');
if (!arg('root') || !fs.existsSync(path.join(ROOT, 'packages'))) {
  console.error('usage: plain-brand-residue.cjs --root=<worktree> [--apply]');
  process.exit(2);
}
const APPLY = flag('apply');
const ALLOW_DROP = flag('allow-drop-validation');
const OUT_DIR = path.resolve(arg('out-dir') ?? path.join(ROOT, 'tmp/merge-master'));
const DIAG = path.resolve(arg('diag') ?? path.join(OUT_DIR, 'diag-r1.json'));
const DELETIONS = path.resolve(arg('deletions') ?? path.join(process.cwd(), 'tmp/deletions'));
const ts = require(require.resolve('typescript', { paths: [ROOT, process.cwd()] }));

const TEST_SUPPORT = /\.(test|integration\.test|e2e|spec|proxy|stub|harness)\.tsx?$/u;
const rel = (abs) => path.relative(ROOT, abs).split(path.sep).join('/');
const kebab = (pascal) => pascal.replace(/([a-z0-9])([A-Z])/gu, '$1-$2').toLowerCase();
const camel = (pascal) => pascal[0].toLowerCase() + pascal.slice(1);
const pascal = (s) => s[0].toUpperCase() + s.slice(1);
const pkgOf = (file) => /packages\/([^/]+)\//u.exec(file.split(path.sep).join('/'))?.[1] ?? null;
const parseSf = (f, text) =>
  ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

// ---------------------------------------------------------------------------------------------------------------
// 1. the table
// ---------------------------------------------------------------------------------------------------------------
const identify = (name) => {
  if (/^[A-Z]\w*Stub$/u.test(name)) return { kind: 'stub', typeName: name.slice(0, -4) };
  if (/^[a-z]\w*Contract$/u.test(name)) return { kind: 'contract', typeName: pascal(name.slice(0, -8)) };
  if (/^[A-Z]\w*$/u.test(name)) return { kind: 'type', typeName: name };
  return null;
};

const walkDir = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.ward', 'coverage'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkDir(p, out);
    else out.push(p);
  }
  return out;
};

// chain `z.string().min(1).brand<'X'>()` -> methods in call order, root first
const chainOf = (init) => {
  const methods = [];
  let n = init;
  while (n && ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)) {
    methods.unshift({ name: n.expression.name.text, call: n });
    n = n.expression.expression;
  }
  return { methods, root: n };
};
const brandOfChain = (methods) => {
  const b = methods.find((m) => m.name === 'brand');
  return b?.call.typeArguments?.[0]?.getText().replace(/['"]/gu, '') ?? null;
};

const STUB_DEFAULT_RES = [
  /\}\s*=\s*\{\s*value:\s*('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`[^`$]*`|-?[\d_]+(?:\.\d+)?)\s*,?\s*\}/u,
  /value\s*\?\?\s*\(?\s*('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|-?[\d_]+(?:\.\d+)?)/u,
  /\bvalue\s*=\s*('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|-?[\d_]+(?:\.\d+)?)/u,
];
const stubDefaultOf = (stubText) => {
  for (const re of STUB_DEFAULT_RES) {
    const m = re.exec(stubText);
    if (m) return m[1];
  }
  return null;
};

// A deleted standalone contract: base type, validation the brand carried, stub default.
const readDeleted = (contractFile, stubFile, source) => {
  const text = fs.readFileSync(contractFile, 'utf8');
  const sf = parseSf(contractFile, text);
  const stubText = stubFile && fs.existsSync(stubFile) ? fs.readFileSync(stubFile, 'utf8') : null;
  const out = { source, contractPath: source, base: null, validation: [], stubDefault: stubText ? stubDefaultOf(stubText) : null, problems: [] };
  for (const st of sf.statements) {
    if (!ts.isVariableStatement(st)) continue;
    for (const d of st.declarationList.declarations) {
      if (!ts.isIdentifier(d.name) || !/Contract$/u.test(d.name.text) || !d.initializer) continue;
      const { methods } = chainOf(d.initializer);
      if (!methods.length) {
        out.problems.push(`initializer is not a z chain: ${d.initializer.getText(sf).slice(0, 60)}`);
        continue;
      }
      const root = methods[0];
      if (root.name === 'string') out.base = 'string';
      else if (root.name === 'number') out.base = 'number';
      else if (root.name === 'boolean') out.base = 'boolean';
      else if (root.name === 'enum') {
        const a = root.call.arguments[0];
        if (a && ts.isArrayLiteralExpression(a)) out.base = a.elements.map((e) => e.getText(sf)).join(' | ');
      } else if (root.name === 'union') {
        out.base = 'string';
        out.problems.push('union of contracts: base assumed string');
        out.validation.push('union');
      } else out.problems.push(`root z.${root.name}(): base unknown`);
      out.validation.push(...methods.slice(1).filter((m) => m.name !== 'brand').map((m) => m.name));
      out.brand = brandOfChain(methods);
      out.baseSchema = d.initializer.getText(sf).replace(/\s+/gu, ' ').replace(/\s*\.brand<[^>]*>\(\)\s*$/u, '').replace(/ (?=\.)/gu, '').trim();
      out.schemaIds = [];
      const ids = (n) => {
        if (ts.isIdentifier(n) && n.text !== 'z' && !(ts.isPropertyAccessExpression(n.parent) && n.parent.name === n)) out.schemaIds.push(n.text);
        ts.forEachChild(n, ids);
      };
      ids(d.initializer);
    }
  }
  return out;
};

const packageDirs = fs.readdirSync(path.join(ROOT, 'packages')).filter((d) => d !== '@gateway');

// deleted copies, keyed by kebab name -> [{pkg, ...}]
const deletedIndex = new Map();
for (const f of walkDir(DELETIONS)) {
  const m = /^(.*?)\/packages\/([^/]+)\/src\/contracts\/([^/]+)\/\3-contract\.ts$/u.exec(f.split(path.sep).join('/'));
  if (!m) continue;
  const stub = f.replace(/-contract\.ts$/u, '.stub.ts');
  const list = deletedIndex.get(m[3]) ?? [];
  list.push({ wave: path.basename(m[1]), pkg: m[2], file: f, stub });
  deletedIndex.set(m[3], list);
}
const deletedFor = (k) => {
  // one copy per package; the latest wave name sorts last (R1 < W1 < W5)
  const byPkg = new Map();
  for (const e of (deletedIndex.get(k) ?? []).sort((a, b) => a.wave.localeCompare(b.wave))) byPkg.set(e.pkg, e);
  const out = [];
  for (const [pkg, e] of byPkg) out.push({ pkg, ...readDeleted(e.file, e.stub, `tmp/deletions/${e.wave}/packages/${pkg}/src/contracts/${k}`) });
  if (!out.length) {
    try {
      const sha = cp
        .execFileSync('git', ['-C', ROOT, 'log', '--diff-filter=D', '--format=%H', '-n1', '--', `:(glob)packages/*/src/contracts/${k}/${k}-contract.ts`], { encoding: 'utf8' })
        .trim();
      if (sha) {
        const names = cp.execFileSync('git', ['-C', ROOT, 'show', '--name-only', '--format=', sha, '--', `:(glob)packages/*/src/contracts/${k}/${k}-contract.ts`], { encoding: 'utf8' }).trim().split('\n');
        for (const n of names) {
          const tmp = path.join(OUT_DIR, 'plain-brand-git', n);
          fs.mkdirSync(path.dirname(tmp), { recursive: true });
          fs.writeFileSync(tmp, cp.execFileSync('git', ['-C', ROOT, 'show', `${sha}^:${n}`], { encoding: 'utf8' }));
          let stubTmp = null;
          try {
            stubTmp = tmp.replace(/-contract\.ts$/u, '.stub.ts');
            fs.writeFileSync(stubTmp, cp.execFileSync('git', ['-C', ROOT, 'show', `${sha}^:${n.replace(/-contract\.ts$/u, '.stub.ts')}`], { encoding: 'utf8' }));
          } catch {
            stubTmp = null;
          }
          out.push({ pkg: pkgOf(n), ...readDeleted(tmp, stubTmp, `git:${sha.slice(0, 9)}:${n}`) });
        }
      }
    } catch {
      // no history hit: the name is not a deleted contract
    }
  }
  return out;
};

// live contracts / stubs in ROOT, and owner fields (brand text -> owning contract)
const liveIndex = new Map(); // kebab -> [{pkg, contractFile, stubFile, exports:Set}]
const ownerIndex = new Map(); // brand -> {ownerVar, field, ownerType, file, pkg}
for (const pd of packageDirs) {
  const cdir = path.join(ROOT, 'packages', pd, 'src', 'contracts');
  if (!fs.existsSync(cdir)) continue;
  for (const f of walkDir(cdir)) {
    if (f.endsWith('.test.ts') || !f.endsWith('.ts')) continue;
    const t = fs.readFileSync(f, 'utf8');
    const base = path.basename(f);
    const dirName = path.basename(path.dirname(f));
    if (base === `${dirName}-contract.ts` || base === `${dirName}.stub.ts`) {
      const list = liveIndex.get(dirName) ?? [];
      let e = list.find((x) => x.pkg === pd);
      if (!e) list.push((e = { pkg: pd, contractFile: null, stubFile: null, exports: new Set() }));
      if (base.endsWith('-contract.ts')) e.contractFile = f;
      else e.stubFile = f;
      for (const m of t.matchAll(/export (?:const|type) (\w+)/gu)) e.exports.add(m[1]);
      liveIndex.set(dirName, list);
    }
    if (base.endsWith('-contract.ts') && t.includes('.brand<')) {
      const sf = parseSf(f, t);
      const ownerTypeByVar = new Map();
      for (const st of sf.statements)
        if (ts.isTypeAliasDeclaration(st)) {
          const m = /typeof (\w+)/u.exec(st.type.getText(sf));
          if (m) ownerTypeByVar.set(m[1], st.name.text);
        }
      for (const st of sf.statements) {
        if (!ts.isVariableStatement(st)) continue;
        for (const d of st.declarationList.declarations) {
          if (!ts.isIdentifier(d.name) || !d.initializer) continue;
          const { methods } = chainOf(d.initializer);
          if (!methods.length || methods[0].name !== 'object') continue;
          const obj = methods[0].call.arguments[0];
          if (!obj || !ts.isObjectLiteralExpression(obj)) continue;
          for (const p of obj.properties) {
            if (!ts.isPropertyAssignment(p) || !ts.isIdentifier(p.name)) continue;
            const b = brandOfChain(chainOf(p.initializer).methods);
            if (b && !ownerIndex.has(b)) ownerIndex.set(b, { ownerVar: d.name.text, field: p.name.text, ownerType: ownerTypeByVar.get(d.name.text) ?? null, file: f, pkg: pd });
          }
        }
      }
    }
  }
}

// A live stub that reads `const xContract = owner.shape.f` says where the branch moved brand X: onto that owner field.
const ownerVarIndex = new Map(); // ownerVar -> {file, ownerType, pkg}
for (const pd of packageDirs) {
  const cdir = path.join(ROOT, 'packages', pd, 'src', 'contracts');
  if (!fs.existsSync(cdir)) continue;
  for (const f of walkDir(cdir)) {
    if (!f.endsWith('-contract.ts') || f.endsWith('.test.ts')) continue;
    const t = fs.readFileSync(f, 'utf8');
    for (const m of t.matchAll(/export const (\w+Contract)\s*=/gu)) {
      const tm = new RegExp(`export type (\\w+)\\s*=\\s*z\\.infer<typeof ${m[1]}>`, 'u').exec(t);
      if (tm && !ownerVarIndex.has(m[1])) ownerVarIndex.set(m[1], { file: f, ownerType: tm[1], pkg: pd });
    }
  }
}
const stubOwnerIndex = new Map(); // TypeName -> [{ownerVar, field, file, ownerType, pkg(of the stub)}]
for (const list of liveIndex.values())
  for (const e of list) {
    if (!e.stubFile) continue;
    const t = fs.readFileSync(e.stubFile, 'utf8');
    for (const m of t.matchAll(/const (\w+)Contract = (\w+)\.shape\.(\w+);/gu)) {
      const ov = ownerVarIndex.get(m[2]);
      if (!ov) continue;
      const typeName = pascal(m[1]);
      const arr = stubOwnerIndex.get(typeName) ?? [];
      arr.push({ ownerVar: m[2], field: m[3], ownerType: ov.ownerType, file: ov.file, pkg: e.pkg });
      stubOwnerIndex.set(typeName, arr);
    }
  }

// ---------------------------------------------------------------------------------------------------------------
// resolution of one name for one file
// ---------------------------------------------------------------------------------------------------------------
const tableCache = new Map();
const outOfScope = new Set();
const resolveName = (name, filePkg) => {
  const key = `${name}@${filePkg}`;
  if (tableCache.has(key)) return tableCache.get(key);
  const id = identify(name);
  let res = null;
  if (id) {
    const k = kebab(id.typeName);
    const owner = ownerIndex.get(id.typeName);
    const deleted = deletedFor(k);
    const live = (liveIndex.get(k) ?? []).filter((e) => e.exports.has(name));
    const liveIn = (pkg) => live.find((e) => e.pkg === pkg);
    const base = { name, ...id, filePkg };
    // only scalar brands go plain: an object or custom contract is a different template, not this residue
    const scalar = deleted.filter((d) => d.base !== null);
    const delIn = (pkg) => scalar.find((e) => e.pkg === pkg);
    const stubOwner = (stubOwnerIndex.get(id.typeName) ?? []).find((o) => o.pkg === filePkg) ?? (stubOwnerIndex.get(id.typeName) ?? []).find((o) => o.pkg === 'shared');
    if (liveIn(filePkg)) res = { ...base, mode: 'restore', live: liveIn(filePkg) };
    else if (stubOwner && id.kind !== 'stub') res = { ...base, mode: 'owner', owner: stubOwner, deletedFrom: deleted.map((d) => d.source), validation: [], viaStub: true };
    else if (owner && (deleted.length || live.length === 0)) {
      res = { ...base, mode: 'owner', owner, deletedFrom: deleted.map((d) => d.source), validation: [] };
    } else if (delIn(filePkg)) res = { ...base, mode: 'plain', def: delIn(filePkg), candidates: scalar.length };
    else if (delIn('shared')) res = { ...base, mode: 'plain', def: delIn('shared'), candidates: scalar.length };
    else if (liveIn('shared')) res = { ...base, mode: 'restore', live: liveIn('shared') };
    else if (scalar.length) {
      const bases = new Set(scalar.map((d) => d.base));
      res = { ...base, mode: 'plain', def: scalar[0], candidates: scalar.length, ambiguousCopies: bases.size > 1 || new Set(scalar.map((d) => d.stubDefault)).size > 1 };
    } else if (deleted.length) outOfScope.add(`${name}: deleted contract is not scalar (${deleted[0].problems.join('; ') || 'no base'})`);
    if (res && res.mode === 'plain') {
      res.validation = [...new Set(deleted.flatMap((d) => d.validation))];
      if (!res.def.base) res.baseProblem = `base unknown (${res.def.problems.join('; ')})`;
    }
  }
  tableCache.set(key, res);
  return res;
};

// ---------------------------------------------------------------------------------------------------------------
// 2. per-file rewriting
// ---------------------------------------------------------------------------------------------------------------
const diag = JSON.parse(fs.readFileSync(DIAG, 'utf8'));
const byFile = new Map();
for (const e of diag) {
  if (![2304, 2552, 2305, 2724, 2307, 6133, 6196, 6192].includes(e.code)) continue;
  if (!byFile.has(e.file)) byFile.set(e.file, []);
  byFile.get(e.file).push(e);
}

const stats = { filesSeen: 0, filesChanged: 0, rewrites: {}, leftovers: 0, names: new Set() };
const bump = (k) => (stats.rewrites[k] = (stats.rewrites[k] ?? 0) + 1);
const leftovers = [];
const rewriteLog = [];
const validationNotes = {};

const identAt = (sf, pos, name) => {
  let hit = null;
  const visit = (n) => {
    if (hit || pos < n.getFullStart() || pos >= n.end) return;
    if (ts.isIdentifier(n) && n.getStart(sf) === pos && n.text === name) {
      hit = n;
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return hit;
};

const isReferenceIdent = (id) => {
  const p = id.parent;
  if (!p) return false;
  if (ts.isPropertyAccessExpression(p) && p.name === id) return false;
  if ((ts.isPropertyAssignment(p) || ts.isPropertySignature(p) || ts.isMethodDeclaration(p) || ts.isPropertyDeclaration(p)) && p.name === id) return false;
  if (ts.isBindingElement(p) && p.propertyName === id) return false;
  if (ts.isQualifiedName(p) && p.right === id) return false;
  if (ts.isImportSpecifier(p) || ts.isExportSpecifier(p) || ts.isImportClause(p)) return false;
  return true;
};
const declaresLocally = (sf, name) => {
  let hit = false;
  const visit = (n) => {
    if (hit) return;
    if ((ts.isVariableDeclaration(n) || ts.isParameter(n) || ts.isBindingElement(n) || ts.isFunctionDeclaration(n) || ts.isClassDeclaration(n) || ts.isTypeAliasDeclaration(n) || ts.isInterfaceDeclaration(n) || ts.isEnumDeclaration(n)) && n.name && ts.isIdentifier(n.name) && n.name.text === name) hit = true;
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return hit;
};

const lowPrec = (n) =>
  ts.isBinaryExpression(n) || ts.isConditionalExpression(n) || ts.isArrowFunction(n) || ts.isAsExpression(n) || ts.isSatisfiesExpression?.(n) || ts.isAwaitExpression(n) || ts.isYieldExpression(n) || ts.isPrefixUnaryExpression(n) || ts.isPostfixUnaryExpression(n) || ts.isTypeOfExpression(n) || ts.isVoidExpression(n) || ts.isDeleteExpression(n) || ts.isTypeAssertionExpression(n) || ts.isObjectLiteralExpression(n) || ts.isFunctionExpression(n);
const safeParent = (p, node) =>
  ts.isPropertyAssignment(p) || ts.isVariableDeclaration(p) || ts.isParenthesizedExpression(p) || ts.isArrayLiteralExpression(p) || ts.isReturnStatement(p) || ts.isTemplateSpan(p) || ts.isJsxExpression(p) || ts.isShorthandPropertyAssignment(p) || ts.isSpreadElement(p) || ts.isSpreadAssignment(p) || ts.isParameter(p) || ts.isPropertyDeclaration(p) || ts.isExportAssignment(p) || (ts.isCallExpression(p) && p.arguments.includes(node)) || (ts.isNewExpression(p) && p.arguments?.includes(node)) || (ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.EqualsToken && p.right === node) || ts.isCaseClause(p) || ts.isElementAccessExpression(p) && p.argumentExpression === node;
// Does replacing `node` (whose parent is `p`) with the expression `v` need parentheses?
const needsParen = (v, node) => {
  const p = node.parent;
  if (ts.isNumericLiteral(v) && p && (ts.isPropertyAccessExpression(p) || ts.isElementAccessExpression(p)) && p.expression === node) return true;
  if (!lowPrec(v)) return false;
  if (ts.isObjectLiteralExpression(v) && p && (ts.isArrowFunction(p) || ts.isExpressionStatement(p))) return true;
  if (ts.isObjectLiteralExpression(v)) return false;
  return !(p && safeParent(p, node));
};

let barrelText = null;
const sharedBarrel = () => (barrelText ??= fs.readFileSync(path.join(ROOT, 'packages/shared/src/contracts/contracts.ts'), 'utf8'));
const relSpec = (fromFile, toFile) => {
  let r = path.relative(path.dirname(fromFile), toFile).replace(/\.tsx?$/u, '').split(path.sep).join('/');
  if (!r.startsWith('.')) r = `./${r}`;
  return r;
};
// module specifier that reaches `toFile` (under packages/<pkg>/src/contracts/) from `fromFile`; null when it cannot be proven
const specFor = (fromFile, toFile) => {
  const fp = pkgOf(rel(fromFile));
  const tp = pkgOf(rel(toFile));
  if (fp === tp) return relSpec(fromFile, toFile);
  if (tp === 'shared') {
    const m = /packages\/shared\/src\/contracts\/(.+)\.ts$/u.exec(rel(toFile));
    // shared's exports map publishes the barrel and, per file, only what the branch imports by path (stubs)
    if (m && /\.stub$/u.test(m[1])) return `@dungeonmaster/shared/contracts/${m[1]}`;
    if (m && sharedBarrel().includes(`/${m[1]}'`)) return '@dungeonmaster/shared/contracts';
  }
  return null;
};

const processFile = (relFile, entries) => {
  const file = path.join(ROOT, relFile);
  const original = fs.readFileSync(file, 'utf8');
  const sf = parseSf(file, original);
  const filePkg = pkgOf(relFile);
  const testSupport = TEST_SUPPORT.test(relFile) || /\/test\//u.test(relFile);
  stats.filesSeen++;
  const lineOf = (pos) => sf.getLineAndCharacterOfPosition(pos).line + 1;
  const left = (node, name, reason, extra = {}) => {
    leftovers.push({ file: relFile, line: lineOf(node.getStart(sf)), name, reason, text: node.getText(sf).replace(/\s+/gu, ' ').slice(0, 160), ...extra });
  };

  // ---- targets ----
  const targets = new Map(); // pos -> {id, name}
  const deadImports = new Map(); // local name -> ImportSpecifier
  const unusedImports = new Set();
  const addTarget = (id) => targets.set(id.getStart(sf), { id, name: id.text });
  for (const e of entries) {
    if (e.code === 2304 || e.code === 2552) {
      const m = /Cannot find name '(\w+)'/u.exec(e.message);
      if (!m || !resolveName(m[1], filePkg)) continue;
      const pos = sf.getPositionOfLineAndCharacter(e.line - 1, e.col - 1);
      const id = identAt(sf, pos, m[1]);
      if (id) addTarget(id);
    } else if (e.code === 6133 || e.code === 6196 || e.code === 6192) {
      // an import this script's own rewrites (or master's merge) left unused: only names of this table or its owner contracts
      const pos = sf.getPositionOfLineAndCharacter(e.line - 1, e.col - 1);
      for (const st of sf.statements) {
        if (!ts.isImportDeclaration(st) || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings) || st.importClause.name) continue;
        for (const s of st.importClause.namedBindings.elements) {
          const hit = e.code === 6192 ? st.getStart(sf) === pos : s.name.getStart(sf) === pos;
          const imported = (s.propertyName ?? s.name).text;
          if (hit && (resolveName(imported, filePkg) || ownerVarIndex.has(imported))) unusedImports.add(s.name.text);
        }
      }
    } else {
      const consider = (spec) => {
        const imported = (spec.propertyName ?? spec.name).text;
        if (spec.propertyName && spec.propertyName.text !== spec.name.text) return;
        if (resolveName(imported, filePkg)) deadImports.set(spec.name.text, spec);
      };
      if (e.code === 2305 || e.code === 2724) {
        const m = /member(?: named)? '(\w+)'/u.exec(e.message);
        if (!m) continue;
        for (const st of sf.statements)
          if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings))
            for (const s of st.importClause.namedBindings.elements) if ((s.propertyName ?? s.name).text === m[1]) consider(s);
      } else {
        const pos = sf.getPositionOfLineAndCharacter(e.line - 1, e.col - 1);
        for (const st of sf.statements)
          if (ts.isImportDeclaration(st) && st.moduleSpecifier.getStart(sf) === pos && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings))
            for (const s of st.importClause.namedBindings.elements) consider(s);
      }
    }
  }
  const shadowedImports = new Set();
  for (const [local] of deadImports) {
    if (declaresLocally(sf, local)) {
      shadowedImports.add(local);
      const spec = deadImports.get(local);
      left(spec, local, 'name is also declared locally in this file: which binding a reference means is not provable here');
      continue;
    }
    const visit = (n) => {
      if (ts.isImportDeclaration(n)) return;
      if (ts.isIdentifier(n) && n.text === local && isReferenceIdent(n)) addTarget(n);
      ts.forEachChild(n, visit);
    };
    sf.statements.forEach(visit);
  }

  // ---- edits ----
  const edits = []; // {start, end, parts, kind, name}
  const needImports = []; // {spec, names:[...], typeOnly}
  const leftoverNames = new Set();
  const restoredNames = new Set();
  const addNeed = (spec, name, typeOnly) => needImports.push({ spec, name, typeOnly });
  const render = (node) => node.getText(sf);
  const partsFor = (valueNode) => [{ range: [valueNode.getStart(sf), valueNode.end] }];
  const leftTarget = (t, reason) => {
    left(t.id.parent && (ts.isCallExpression(t.id.parent) || ts.isPropertyAccessExpression(t.id.parent) || ts.isTypeReferenceNode(t.id.parent)) ? t.id.parent : t.id, t.name, reason);
    leftoverNames.add(t.name);
  };

  for (const t of targets.values()) {
    const info = resolveName(t.name, filePkg);
    const id = t.id;
    const p = id.parent;
    stats.names.add(t.name);
    if (info.mode === 'restore') {
      const f = info.kind === 'stub' ? info.live.stubFile : info.live.contractFile;
      const s = f && specFor(file, f.replace(/\.ts$/u, '') + '.ts');
      if (!s) {
        leftTarget(t, `live export of ${t.name} in ${info.live.pkg} has no provable import path from ${filePkg}`);
        continue;
      }
      restoredNames.add(t.name);
      addNeed(s, t.name, info.kind === 'type' || (p && ts.isTypeReferenceNode(p) && p.typeName === id));
      bump('restore-import');
      continue;
    }
    if (info.mode === 'plain' && info.baseProblem && info.kind !== 'stub') {
      leftTarget(t, info.baseProblem);
      continue;
    }
    if (info.mode === 'plain' && info.ambiguousCopies && !(info.kind === 'stub' && p && ts.isCallExpression(p) && p.arguments.length)) {
      leftTarget(t, `deleted copies in ${info.candidates} packages disagree on base or stub default and none is in ${filePkg} or shared`);
      continue;
    }
    const owner = info.mode === 'owner' ? info.owner : null;
    const ownerExpr = owner ? `${owner.ownerVar}.shape.${owner.field}` : null;
    const needOwner = (typeToo) => {
      const s = specFor(file, owner.file);
      if (!s) return false;
      addNeed(s, owner.ownerVar, false);
      if (typeToo) addNeed(s, owner.ownerType, true);
      return true;
    };
    const baseText = owner ? `${owner.ownerType}['${owner.field}']` : info.def.base;
    const typeOk = () => {
      if (!owner) return true;
      const s = owner.ownerType && specFor(file, owner.file);
      if (!s) return false;
      addNeed(s, owner.ownerType, true);
      return true;
    };

    // ---- stub call ----
    if (info.kind === 'stub' && p && ts.isCallExpression(p) && p.expression === id) {
      const a = p.arguments[0];
      let valueNode = null;
      let defaultText = null;
      if (!a) {
        defaultText = info.mode === 'plain' ? info.def.stubDefault : (() => { const d = deletedFor(kebab(info.typeName))[0]; return d?.stubDefault ?? null; })();
        if (!defaultText) {
          leftTarget(t, 'XStub() with no default literal in the deleted stub');
          continue;
        }
      } else if (ts.isObjectLiteralExpression(a) && a.properties.length === 1 && p.arguments.length === 1) {
        const pr = a.properties[0];
        if (ts.isPropertyAssignment(pr) && pr.name.getText(sf) === 'value') valueNode = pr.initializer;
        else if (ts.isShorthandPropertyAssignment(pr) && pr.name.text === 'value') valueNode = pr.name;
      }
      if (a && !valueNode) {
        leftTarget(t, `stub argument is not exactly { value: v } (${a.getText(sf).replace(/\s+/gu, ' ').slice(0, 60)})`);
        continue;
      }
      if (owner) {
        if (!needOwner(false)) {
          leftTarget(t, 'owner contract has no provable import path from this package');
          continue;
        }
        const parts = [`${ownerExpr}.parse(`, ...(valueNode ? partsFor(valueNode) : [defaultText]), ')'];
        edits.push({ start: p.getStart(sf), end: p.end, parts, kind: 'stub->owner-parse', name: t.name, node: p });
        bump('stub->owner-parse');
      } else {
        const v = valueNode ?? { synth: defaultText };
        const isNum = valueNode ? ts.isNumericLiteral(valueNode) : /^-?[\d_]/u.test(defaultText);
        const paren = valueNode ? needsParen(valueNode, p) : isNum && p.parent && (ts.isPropertyAccessExpression(p.parent) || ts.isElementAccessExpression(p.parent)) && p.parent.expression === p;
        const inner = valueNode ? partsFor(valueNode) : [defaultText];
        edits.push({ start: p.getStart(sf), end: p.end, parts: paren ? ['(', ...inner, ')'] : inner, kind: valueNode ? 'stub-value' : 'stub-default', name: t.name, node: p });
        bump(valueNode ? 'stub-value' : 'stub-default');
        if (info.validation.length) (validationNotes[t.name] ??= { validation: info.validation, stubSites: 0, parseSitesRewritten: 0 }).stubSites++;
        void v;
      }
      continue;
    }

    // ---- contract: xContract.parse(a) / xContract.safeParse / bare ----
    if (info.kind === 'contract') {
      if (owner) {
        if (!needOwner(false)) {
          leftTarget(t, 'owner contract has no provable import path from this package');
          continue;
        }
        edits.push({ start: id.getStart(sf), end: id.end, parts: [ownerExpr], kind: 'contract->owner-shape', name: t.name, node: id });
        bump('contract->owner-shape');
        continue;
      }
      // a field of a contract: `key: xContract`, `key: xContract.nullable()`, `key: z.array(xContract)` -> the brand inlined
      // as `<base schema>.brand<'OwnerKey'>()`, as W1 wrote the branch's own contracts
      if (/-contract\.ts$/u.test(relFile)) {
        let cur = id;
        while (cur.parent && ((ts.isPropertyAccessExpression(cur.parent) && cur.parent.expression === cur && ts.isCallExpression(cur.parent.parent)) || (ts.isCallExpression(cur.parent) && cur.parent.expression === cur))) cur = cur.parent;
        let pa = null;
        let holder = cur;
        if (cur.parent && ts.isCallExpression(cur.parent) && cur.parent.arguments.length === 1 && cur.parent.arguments[0] === cur && ts.isPropertyAccessExpression(cur.parent.expression) && /^z$/u.test(cur.parent.expression.expression.getText(sf)) && cur.parent.expression.name.text === 'array') holder = cur.parent;
        for (let q = holder; q.parent; ) {
          if (ts.isPropertyAssignment(q.parent) && q.parent.initializer === q) {
            pa = q.parent;
            break;
          }
          if (ts.isPropertyAccessExpression(q.parent) && q.parent.expression === q && ts.isCallExpression(q.parent.parent)) q = q.parent.parent;
          else break;
        }
        if (pa && ts.isIdentifier(pa.name)) {
          let ownerName = null;
          for (let q = pa.parent; q && !ownerName; q = q.parent) {
            if (ts.isCallExpression(q) && ts.isPropertyAccessExpression(q.expression) && q.expression.name.text === 'brand' && q.typeArguments?.[0]) ownerName = q.typeArguments[0].getText(sf).replace(/['"]/gu, '');
            else if (ts.isVariableDeclaration(q) && ts.isIdentifier(q.name)) ownerName = pascal(q.name.text.replace(/Contract$/u, ''));
          }
          const def = info.def;
          if (!ownerName || !def.baseSchema) {
            leftTarget(t, 'contract field: owner brand name or base schema not found');
            continue;
          }
          if (def.schemaIds.length) {
            leftTarget(t, `contract field: the deleted schema reads ${[...new Set(def.schemaIds)].join(', ')}, which this file would have to import first`);
            continue;
          }
          edits.push({ start: id.getStart(sf), end: id.end, parts: [`${def.baseSchema}.brand<'${ownerName}${pascal(pa.name.text)}'>()`], kind: 'contract-field-inline', name: t.name, node: id });
          bump('contract-field-inline');
          continue;
        }
      }
      const grand = p && ts.isPropertyAccessExpression(p) && p.expression === id ? p.parent : null;
      if (grand && p.name.text === 'parse' && ts.isCallExpression(grand) && grand.expression === p && grand.arguments.length === 1) {
        if (info.validation.length && !(testSupport || ALLOW_DROP)) {
          leftTarget(t, `runtime parse site: the deleted brand carried .${info.validation.join('().')}() and a plain rewrite drops it`);
          leftovers[leftovers.length - 1].validationDropped = info.validation;
          continue;
        }
        const a = grand.arguments[0];
        const paren = needsParen(a, grand);
        edits.push({ start: grand.getStart(sf), end: grand.end, parts: paren ? ['(', ...partsFor(a), ')'] : partsFor(a), kind: 'parse', name: t.name, node: grand });
        bump('parse');
        if (info.validation.length) (validationNotes[t.name] ??= { validation: info.validation, stubSites: 0, parseSitesRewritten: 0 }).parseSitesRewritten++;
        continue;
      }
      leftTarget(t, 'contract used other than xContract.parse(a) (shape, safeParse, passed as a value)');
      continue;
    }

    // ---- type reference ----
    if (info.kind === 'type' || info.kind === 'stub' || info.kind === 'contract') {
      if (p && ts.isTypeReferenceNode(p) && p.typeName === id && info.kind === 'type') {
        if (!typeOk()) {
          leftTarget(t, 'owner contract has no provable import path from this package');
          continue;
        }
        const wrap = baseText.includes('|') && p.parent && (ts.isArrayTypeNode(p.parent) || ts.isTypeOperatorNode(p.parent) || ts.isIndexedAccessTypeNode(p.parent) || ts.isOptionalTypeNode(p.parent));
        edits.push({ start: p.getStart(sf), end: p.end, parts: [wrap ? `(${baseText})` : baseText], kind: 'type', name: t.name, node: p });
        bump('type');
        continue;
      }
      if (p && ts.isTypeQueryNode(p) && p.exprName === id) {
        const pp = p.parent;
        const wrapper = pp && ts.isTypeReferenceNode(pp) && pp.typeArguments?.length === 1 && /^(ReturnType|z\.infer|z\.output|z\.input|infer)$/u.test(pp.typeName.getText(sf)) ? pp : null;
        if (wrapper && typeOk()) {
          edits.push({ start: wrapper.getStart(sf), end: wrapper.end, parts: [baseText], kind: 'typeof->type', name: t.name, node: wrapper });
          bump('typeof->type');
          continue;
        }
      }
    }
    leftTarget(t, 'use site is not a stub call, a parse call, a type reference or ReturnType<typeof X>');
  }

  // ---- nested edit application ----
  const applyRange = (s, e, list) => {
    const inside = list.filter((x) => x.start >= s && x.end <= e).sort((a, b) => a.start - b.start || b.end - a.end);
    const top = [];
    for (const x of inside) if (!top.some((y) => x.start >= y.start && x.end <= y.end)) top.push(x);
    let out = '';
    let at = s;
    for (const x of top) {
      out += original.slice(at, x.start);
      out += x.parts.map((q) => (typeof q === 'string' ? q : applyRange(q.range[0], q.range[1], list.filter((y) => y !== x)))).join('');
      at = x.end;
    }
    return out + original.slice(at, e);
  };
  let text = applyRange(0, original.length, edits);
  for (const x of edits) {
    const after = applyRange(x.start, x.end, edits.filter((y) => y === x || (y.start >= x.start && y.end <= x.end && y !== x)));
    rewriteLog.push({ file: relFile, line: lineOf(x.start), kind: x.kind, name: x.name, before: original.slice(x.start, x.end).replace(/\s+/gu, ' ').slice(0, 200), after: after.replace(/\s+/gu, ' ').slice(0, 200) });
  }

  // ---- imports: drop dead specifiers whose every reference was rewritten, add needed ones ----
  const dropNames = new Set([...deadImports.keys()].filter((n) => !shadowedImports.has(n) && !leftoverNames.has(n)));
  const sf2 = parseSf(file, text);
  const importEdits = [];
  const have = new Set();
  const lastImport = [...sf2.statements].filter(ts.isImportDeclaration).pop();
  const stillHas = (n) => {
    let hit = false;
    const visit = (x) => {
      if (hit || ts.isImportDeclaration(x)) return;
      if (ts.isIdentifier(x) && x.text === n && isReferenceIdent(x)) hit = true;
      ts.forEachChild(x, visit);
    };
    sf2.statements.forEach(visit);
    return hit;
  };
  for (const st of sf2.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings) || st.importClause.name) continue;
    const els = st.importClause.namedBindings.elements;
    const keep = els.filter((e) => !(unusedImports.has(e.name.text) && !stillHas(e.name.text)) && !(restoredNames.has(e.name.text) && deadImports.has(e.name.text)) && !(dropNames.has(e.name.text) && !stillHas(e.name.text)));
    for (const e of keep) have.add(e.name.text);
    if (keep.length === els.length) continue;
    if (!keep.length) {
      const nl = text.indexOf('\n', st.end);
      importEdits.push({ start: st.getStart(sf2), end: nl === -1 ? st.end : nl + 1, text: '' });
    } else importEdits.push({ start: st.getStart(sf2), end: st.end, text: `import${st.importClause.isTypeOnly ? ' type' : ''} { ${keep.map((e) => e.getText(sf2)).join(', ')} } from ${st.moduleSpecifier.getText(sf2)};` });
  }
  const bySpec = new Map();
  for (const n of needImports) {
    if (have.has(n.name)) continue;
    const k = `${n.spec}|${n.typeOnly ? 't' : 'v'}`;
    const cur = bySpec.get(k) ?? { spec: n.spec, typeOnly: n.typeOnly, names: new Set() };
    cur.names.add(n.name);
    bySpec.set(k, cur);
  }
  const addLines = [];
  for (const g of bySpec.values()) {
    const existing = [...sf2.statements].find((st) => ts.isImportDeclaration(st) && st.moduleSpecifier.text === g.spec && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings) && !st.importClause.name && !!st.importClause.isTypeOnly === g.typeOnly && !importEdits.some((ie) => ie.start === st.getStart(sf2)));
    if (existing) {
      const els = existing.importClause.namedBindings.elements.map((e) => e.getText(sf2));
      const names = [...els, ...[...g.names].filter((n) => !els.includes(n))].sort();
      importEdits.push({ start: existing.getStart(sf2), end: existing.end, text: `import${g.typeOnly ? ' type' : ''} { ${names.join(', ')} } from '${g.spec}';` });
    } else addLines.push(`import${g.typeOnly ? ' type' : ''} { ${[...g.names].sort().join(', ')} } from '${g.spec}';`);
  }
  if (addLines.length) {
    const at = lastImport ? lastImport.end : 0;
    importEdits.push({ start: at, end: at, text: (lastImport ? '\n' : '') + addLines.join('\n') + (lastImport ? '' : '\n') });
  }
  importEdits.sort((a, b) => b.start - a.start);
  for (const ie of importEdits) {
    rewriteLog.push({ file: relFile, line: sf2.getLineAndCharacterOfPosition(ie.start).line + 1, kind: 'import', name: '', before: text.slice(ie.start, ie.end).replace(/\s+/gu, ' ').slice(0, 200), after: ie.text.replace(/\s+/gu, ' ').slice(0, 200) });
    text = text.slice(0, ie.start) + ie.text + text.slice(ie.end);
  }

  if (text === original) return;
  const parseErrs = (src) => parseSf(file, src).parseDiagnostics?.length ?? 0;
  if (parseErrs(text) > parseErrs(original)) {
    leftovers.push({ file: relFile, line: 0, name: '*', reason: 'rewrite produced a syntax error; file left untouched' });
    return;
  }
  stats.filesChanged++;
  if (APPLY) fs.writeFileSync(file, text);
};

for (const [relFile, entries] of [...byFile].sort()) {
  if (!fs.existsSync(path.join(ROOT, relFile))) continue;
  processFile(relFile, entries);
}

// ---------------------------------------------------------------------------------------------------------------
// 3. reports
// ---------------------------------------------------------------------------------------------------------------
const table = {};
for (const n of [...stats.names].sort()) {
  table[n] = [...tableCache.entries()]
    .filter(([k, v]) => v && k.startsWith(`${n}@`))
    .map(([, v]) => ({
      forPackage: v.filePkg,
      kind: v.kind,
      mode: v.mode,
      base: v.mode === 'owner' ? `${v.owner.ownerType}['${v.owner.field}']` : v.mode === 'plain' ? v.def.base : null,
      stubDefault: v.mode === 'plain' ? v.def.stubDefault : (deletedFor(kebab(v.typeName))[0]?.stubDefault ?? null),
      validation: v.validation ?? [],
      source: v.mode === 'plain' ? v.def.source : v.mode === 'owner' ? rel(v.owner.file) : rel(v.live.contractFile ?? v.live.stubFile),
      ownerField: v.mode === 'owner' ? `${v.owner.ownerVar}.shape.${v.owner.field}` : null,
      copies: v.candidates ?? null,
      problems: v.def?.problems ?? [],
    }));
}
fs.mkdirSync(OUT_DIR, { recursive: true });
const w = (name, data) => fs.writeFileSync(path.join(OUT_DIR, name), `${JSON.stringify(data, null, 2)}\n`);
w('plain-brand-table.json', { outOfScope: [...outOfScope].sort(), names: table });
w('plain-brand-rewrites.json', rewriteLog);
w('plain-brand-leftovers.json', { mode: APPLY ? 'apply' : 'dry-run', count: leftovers.length, validationNotes, leftovers });
console.log(JSON.stringify({ mode: APPLY ? 'apply' : 'dry-run', tableNames: Object.keys(table).length, filesSeen: stats.filesSeen, filesChanged: stats.filesChanged, rewrites: stats.rewrites, rewriteTotal: Object.values(stats.rewrites).reduce((a, b) => a + b, 0), leftovers: leftovers.length, out: OUT_DIR }, null, 2));

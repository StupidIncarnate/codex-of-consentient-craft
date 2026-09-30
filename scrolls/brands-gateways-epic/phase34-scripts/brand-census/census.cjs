// Read-only AST census for the brands epic: the input a 4.0 decision pass drafts its tables from (PORTING.md).
// Run from the repo root, or pass --root=DIR; writes CSVs under <out>/brand-census (default <root>/tmp/brand-census).
//   node scrolls/brands-gateways-epic/phase34-scripts/brand-census/census.cjs [--root=DIR] [--out-dir=DIR] [--scope=@x/]
const cfg = require('../lib/port-config.cjs');
const { ROOT } = cfg;
const ts = require(ROOT + '/node_modules/typescript');
const fs = require('fs');
const path = require('path');
const OUT = path.join(cfg.OUT, 'brand-census');
fs.mkdirSync(OUT, { recursive: true });

// ---------- file walk ----------
const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', '.turbo', '.git']);
const files = [];
const walk = (dir, pkg) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(path.join(dir, e.name), pkg);
    } else if (/\.(ts|tsx)$/.test(e.name) && !e.name.endsWith('.d.ts')) {
      files.push({ abs: path.join(dir, e.name), pkg });
    }
  }
};
for (const p of fs.readdirSync(ROOT + '/packages')) {
  if (`packages/${p}` === cfg.GATEWAY_DIR) continue;
  if (!fs.statSync(ROOT + '/packages/' + p).isDirectory()) continue;
  walk(ROOT + '/packages/' + p, p);
}
const PKGS = [...new Set(files.map((f) => f.pkg))].sort();

const fileKind = (rel) => {
  const base = path.basename(rel);
  if (/\.(test|spec)\.tsx?$/.test(base)) return 'test';
  if (/\.proxy\.tsx?$/.test(base)) return 'proxy';
  if (/\.stub\.tsx?$/.test(base)) return 'stub';
  if (/\.harness\.tsx?$/.test(base) || rel.split('/').includes('harnesses') || rel.split('/').includes('test') || rel.split('/').includes('e2e')) return 'harness';
  if (/-contract\.tsx?$/.test(base)) return 'contract';
  return 'prod';
};
const folderOf = (rel) => {
  const parts = rel.split('/');
  if (parts[0] === 'src') return parts.length > 2 ? parts[1] : 'src-root';
  return parts.length > 1 ? parts[0] + '/' : 'pkg-root';
};
for (const f of files) {
  f.rel = path.relative(ROOT + '/packages/' + f.pkg, f.abs);
  f.kind = fileKind(f.rel);
  f.folder = folderOf(f.rel);
  f.short = path.relative(ROOT, f.abs);
};

const parseFile = (f) => {
  const text = fs.readFileSync(f.abs, 'utf8');
  return ts.createSourceFile(f.abs, text, ts.ScriptTarget.Latest, true, f.abs.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
};
const lineOf = (sf, n) => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
const pascal = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const unwrap = (n) => {
  while (n && (ts.isParenthesizedExpression(n) || ts.isAsExpression(n) || ts.isSatisfiesExpression(n) || ts.isNonNullExpression(n))) n = n.expression;
  return n;
};

// ---------- pass 1: contracts ----------
const contractFiles = files.filter((f) => /-contract\.tsx?$/.test(f.rel));
const consts = []; // {name, exported, init, file, pkg, line, sf}
const byName = new Map();
const typeAliasOf = new Map(); // constName -> alias type name
const perFile1 = new Map();

const zRootName = (callee) => {
  // returns 'string' for z.string, 'coerce.number' for z.coerce.number, or null
  if (ts.isPropertyAccessExpression(callee)) {
    if (ts.isIdentifier(callee.expression) && (callee.expression.text === 'z' || callee.expression.text === 'zod')) return callee.name.text;
    if (ts.isPropertyAccessExpression(callee.expression) && ts.isIdentifier(callee.expression.expression) && callee.expression.expression.text === 'z')
      return callee.expression.name.text + '.' + callee.name.text;
  }
  return null;
};

for (const f of contractFiles) {
  const sf = parseFile(f);
  perFile1.set(f, sf);
  for (const st of sf.statements) {
    if (ts.isVariableStatement(st)) {
      const exported = !!st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      for (const d of st.declarationList.declarations) {
        if (ts.isIdentifier(d.name) && d.initializer) {
          const c = { name: d.name.text, exported, init: d.initializer, file: f, pkg: f.pkg, line: lineOf(sf, d), sf };
          consts.push(c);
          if (!byName.has(c.name)) byName.set(c.name, []);
          byName.get(c.name).push(c);
        }
      }
    } else if (ts.isTypeAliasDeclaration(st)) {
      const t = st.type;
      if (ts.isTypeReferenceNode(t) && t.typeArguments?.length === 1 && ts.isTypeQueryNode(t.typeArguments[0]) && ts.isIdentifier(t.typeArguments[0].exprName)) {
        const tn = t.typeName.getText(sf);
        if (/(^|\.)(infer|input|output)$/.test(tn)) {
          const k = f.pkg + ':' + t.typeArguments[0].exprName.text;
          if (!typeAliasOf.has(k) && /infer$/.test(tn)) typeAliasOf.set(k, st.name.text);
        }
      }
    }
  }
}

const SCALAR_ROOTS = new Set(['string', 'number', 'bigint', 'int', 'uuid', 'email', 'url', 'coerce.string', 'coerce.number', 'coerce.bigint', 'guid', 'cuid', 'nanoid', 'ulid', 'ipv4', 'ipv6', 'int32', 'float64']);
const kindMemo = new Map();
const lookupConst = (name, pkg) => {
  const c = byName.get(name);
  if (!c) return null;
  return c.find((x) => x.pkg === pkg) || c[0];
};
const kindOfConst = (c) => {
  if (kindMemo.has(c)) return kindMemo.get(c);
  kindMemo.set(c, 'cycle');
  const k = analyze(c.init, c.pkg).kind;
  kindMemo.set(c, k);
  return k;
};
function analyze(expr, pkg) {
  let cur = unwrap(expr);
  const methods = [];
  let rootKind = 'other';
  let rootName = '';
  let rootArgs = [];
  for (;;) {
    cur = unwrap(cur);
    if (ts.isCallExpression(cur)) {
      const callee = cur.expression;
      const zr = zRootName(callee);
      if (zr) {
        rootName = zr;
        rootArgs = cur.arguments;
        break;
      }
      if (ts.isPropertyAccessExpression(callee)) {
        methods.push({ name: callee.name.text, call: cur });
        cur = callee.expression;
        continue;
      }
      rootName = 'call:' + callee.getText().slice(0, 30);
      break;
    } else if (ts.isIdentifier(cur)) {
      rootName = 'ref:' + cur.text;
      const c = lookupConst(cur.text, pkg);
      rootKind = c ? kindOfConst(c) : 'ref-unresolved';
      break;
    } else if (ts.isPropertyAccessExpression(cur)) {
      // x.shape.id etc.
      const t = cur.getText();
      if (/\.shape\./.test(t) || /\.shape$/.test(t)) {
        rootName = 'fieldref';
        rootKind = 'fieldref';
        break;
      }
      methods.push({ name: cur.name.text, call: null });
      cur = cur.expression;
      continue;
    } else {
      rootName = 'other';
      break;
    }
  }
  if (rootName && !rootName.startsWith('ref:') && rootName !== 'fieldref') {
    const r = rootName;
    if (r === 'object' || r === 'strictObject' || r === 'looseObject' || r === 'interface') rootKind = 'object';
    else if (r === 'enum' || r === 'nativeEnum' || r === 'literal') rootKind = 'enum';
    else if (SCALAR_ROOTS.has(r) || /^iso\./.test(r) || /^coerce\.(string|number|bigint)$/.test(r)) rootKind = 'scalar';
    else if (r === 'boolean' || r === 'coerce.boolean') rootKind = 'boolean';
    else if (r === 'array' || r === 'tuple' || r === 'record' || r === 'map' || r === 'set' || r === 'partialRecord' || r === 'looseRecord') rootKind = 'collection';
    else if (r === 'unknown' || r === 'any') rootKind = 'unknown';
    else if (r === 'json') rootKind = 'json';
    else if (r === 'discriminatedUnion' || r === 'union' || r === 'intersection' || r === 'xor') {
      const arr = r === 'discriminatedUnion' ? rootArgs[1] : rootArgs[0];
      const elems = arr && ts.isArrayLiteralExpression(arr) ? arr.elements : [];
      const ks = elems.map((e) => analyze(e, pkg).kind);
      const u = [...new Set(ks)];
      if (r === 'intersection') rootKind = u.includes('object') ? 'object' : 'other';
      else if (u.length === 1) rootKind = u[0] === 'fieldref' ? 'scalar?' : u[0];
      else if (u.every((k) => k === 'enum' || k === 'scalar' || k === 'literalish')) rootKind = 'scalar';
      else if (u.every((k) => k === 'object' || k === 'fieldref')) rootKind = 'object';
      else rootKind = 'mixed:' + u.join('+');
      if (r === 'discriminatedUnion') rootKind = 'object';
    } else if (r === 'lazy' || r === 'custom' || r === 'instanceof' || r === 'function' || r === 'date' || r === 'null' || r === 'undefined' || r === 'never' || r === 'void' || r === 'symbol' || r === 'preprocess' || r === 'pipe' || r === 'transform') rootKind = 'other-' + r;
    else rootKind = 'other-' + r;
  }
  let kind = rootKind;
  const mnames = methods.map((m) => m.name);
  if (mnames.includes('array')) kind = 'collection';
  const brandM = methods.filter((m) => m.name === 'brand');
  const brandTexts = brandM.map((m) => {
    const ta = m.call && m.call.typeArguments && m.call.typeArguments[0];
    return ta && ts.isLiteralTypeNode(ta) && ts.isStringLiteral(ta.literal) ? ta.literal.text : '?';
  });
  return { kind, rootName, rootKind, methods: mnames, endsInBrand: mnames[0] === 'brand', brandAny: brandM.length > 0, brandTexts };
}

// per-const analysis
const constInfo = new Map();
for (const c of consts) {
  const a = analyze(c.init, c.pkg);
  // union-of-objects where each branch already branded?
  constInfo.set(c, a);
}

// brand sites, leaves, unknown/any, field uses
const brandSites = []; // {text, file, line, owner, key, top}
const leafStats = new Map(); // pkg -> {branded, unbranded}
const unknownAny = new Map(); // pkg -> {unknown, any}
const fieldUses = []; // {file, pkg, owner, key, ids:Set}
const objRootFns = new Set(['object', 'strictObject', 'looseObject']);

const isObjectCall = (n) => {
  if (!ts.isCallExpression(n)) return false;
  const zr = zRootName(n.expression);
  if (zr && objRootFns.has(zr)) return true;
  return ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'extend';
};
const collectIds = (n, out) => {
  if (ts.isObjectLiteralExpression(n) && n.parent && isObjectCall(n.parent) && n.parent.arguments[0] === n) return; // nested object: handled itself
  if (ts.isIdentifier(n)) out.add(n.text);
  ts.forEachChild(n, (c) => collectIds(c, out));
};

for (const f of contractFiles) {
  const sf = perFile1.get(f);
  const ua = unknownAny.get(f.pkg) || { unknown: 0, any: 0 };
  unknownAny.set(f.pkg, ua);
  const ls = leafStats.get(f.pkg) || { branded: 0, unbranded: 0 };
  leafStats.set(f.pkg, ls);
  const topOf = (n) => {
    let p = n;
    while (p && p.parent && p.parent.kind !== ts.SyntaxKind.SourceFile) p = p.parent;
    return p;
  };
  const visit = (n) => {
    if (ts.isCallExpression(n)) {
      const zr = zRootName(n.expression);
      if (zr === 'unknown') ua.unknown++;
      if (zr === 'any') ua.any++;
      if (ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'brand' && n.typeArguments?.[0] && ts.isLiteralTypeNode(n.typeArguments[0]) && ts.isStringLiteral(n.typeArguments[0].literal)) {
        let p = n.parent;
        let key = '';
        let inProp = false;
        let owner = '';
        while (p) {
          if ((ts.isPropertyAssignment(p) || ts.isGetAccessor(p)) && !inProp) {
            key = p.name.getText(sf);
            inProp = true;
          }
          if (p.parent && p.parent.kind === ts.SyntaxKind.SourceFile && ts.isVariableStatement(p)) owner = p.declarationList.declarations[0].name.getText(sf);
          p = p.parent;
        }
        brandSites.push({ text: n.typeArguments[0].literal.text, file: f.short, pkg: f.pkg, line: lineOf(sf, n), owner, key, inProp });
      }
      if (zr && (zr === 'string' || zr === 'number' || zr === 'coerce.number' || zr === 'coerce.string' || zr === 'bigint')) {
        let top = n;
        let branded = false;
        while (top.parent && ts.isPropertyAccessExpression(top.parent) && top.parent.expression === top && top.parent.parent && ts.isCallExpression(top.parent.parent) && top.parent.parent.expression === top.parent) {
          if (top.parent.name.text === 'brand') branded = true;
          top = top.parent.parent;
        }
        // inside a property of an object contract?
        let p = top.parent;
        let inProp = false;
        while (p) {
          if (ts.isPropertyAssignment(p) || ts.isGetAccessor(p)) {
            inProp = true;
            break;
          }
          p = p.parent;
        }
        if (inProp) {
          if (branded) ls.branded++;
          else ls.unbranded++;
        }
      }
    }
    if ((ts.isPropertyAssignment(n) || ts.isGetAccessor(n) || ts.isShorthandPropertyAssignment(n)) && n.parent && ts.isObjectLiteralExpression(n.parent) && n.parent.parent && isObjectCall(n.parent.parent) && n.parent.parent.arguments[0] === n.parent) {
      const ids = new Set();
      if (ts.isPropertyAssignment(n)) collectIds(n.initializer, ids);
      else if (ts.isGetAccessor(n)) collectIds(n.body, ids);
      else ids.add(n.name.text);
      const top = topOf(n);
      const owner = ts.isVariableStatement(top) ? top.declarationList.declarations[0].name.getText(sf) : '?';
      fieldUses.push({ file: f.short, pkg: f.pkg, owner, key: n.name ? n.name.getText(sf) : '?', ids });
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}

// ---------- classify contracts ----------
const pkgRows = new Map();
const row = (p) => {
  if (!pkgRows.has(p))
    pkgRows.set(p, { pkg: p, contractFiles: 0, exportedConsts: 0, objectContracts: 0, objectBranded: 0, objectUnbranded: 0, enumContracts: 0, standaloneScalarBrands: 0, scalarNoBrand: 0, unknown: 0, any: 0, leavesBranded: 0, leavesUnbranded: 0 });
  return pkgRows.get(p);
};
for (const p of PKGS) row(p);
for (const f of contractFiles) row(f.pkg).contractFiles++;
for (const [p, u] of unknownAny) {
  row(p).unknown = u.unknown;
  row(p).any = u.any;
}
for (const [p, l] of leafStats) {
  row(p).leavesBranded = l.branded;
  row(p).leavesUnbranded = l.unbranded;
}
const standalone = [];
const enumContracts = [];
const objectContractList = [];
for (const c of consts) {
  if (!c.exported) continue;
  const a = constInfo.get(c);
  const r = row(c.pkg);
  r.exportedConsts++;
  if (a.kind === 'object') {
    r.objectContracts++;
    if (a.endsInBrand) r.objectBranded++;
    else r.objectUnbranded++;
    objectContractList.push({ pkg: c.pkg, name: c.name, file: c.file.short, endsInBrand: a.endsInBrand, root: a.rootName });
  } else if (a.kind === 'enum') {
    r.enumContracts++;
    enumContracts.push(c);
  } else if (a.kind === 'scalar') {
    if (a.brandAny) {
      r.standaloneScalarBrands++;
      standalone.push(c);
    } else r.scalarNoBrand++;
  }
}

// ---------- targets ----------
const targets = new Map(); // name -> role list
const addT = (n, role, ref) => {
  if (!targets.has(n)) targets.set(n, []);
  targets.get(n).push({ role, ref });
};
const sInfo = standalone.map((c) => {
  const a = constInfo.get(c);
  const base = c.name.replace(/Contract$/, '');
  const typeName = typeAliasOf.get(c.pkg + ':' + c.name) || pascal(base);
  const o = { c, pkg: c.pkg, contract: c.name, typeName, stub: pascal(base) + 'Stub', brand: a.brandTexts.join('|'), file: c.file.short, line: c.line, root: a.rootName };
  addT(c.name, 'contract', o);
  addT(typeName, 'type', o);
  addT(o.stub, 'stub', o);
  return o;
});
const eInfo = enumContracts.map((c) => {
  const base = c.name.replace(/Contract$/, '');
  const o = { c, pkg: c.pkg, contract: c.name, typeName: typeAliasOf.get(c.pkg + ':' + c.name) || pascal(base), stub: pascal(base) + 'Stub', file: c.file.short, branded: constInfo.get(c).brandAny ? constInfo.get(c).brandTexts.join('|') : '' };
  addT(c.name, 'econtract', o);
  addT(o.stub, 'estub', o);
  return o;
});
const targetNames = new Set(targets.keys());

// ---------- pass 2: all files ----------
const idHits = new Map(); // name -> Map(fileIdx -> count)
const parseHits = new Map(); // contract name -> Map(fileIdx -> count)
const stubHits = new Map(); // stub name -> Map(fileIdx -> count)
const bump = (m, k, i) => {
  if (!m.has(k)) m.set(k, new Map());
  const mm = m.get(k);
  mm.set(i, (mm.get(i) || 0) + 1);
};
const b13 = []; // {pkg,file,line,name,kind,fk}
const b14 = []; // {pkg,file,line,folder,fk,site,cat}

const isFnTypeNode = (t) => {
  while (t && ts.isParenthesizedTypeNode(t)) t = t.type;
  return t && (ts.isFunctionTypeNode(t) || ts.isConstructorTypeNode(t));
};
const classifyType = (t) => {
  let data = false, methodSet = false;
  const v = (n) => {
    if (ts.isFunctionTypeNode(n) || ts.isConstructorTypeNode(n)) return;
    if (ts.isTypeLiteralNode(n)) {
      if (n.members.length > 0) {
        const allFn = n.members.every((m) => ts.isMethodSignature(m) || ts.isCallSignatureDeclaration(m) || ts.isConstructSignatureDeclaration(m) || (ts.isPropertySignature(m) && isFnTypeNode(m.type)));
        if (allFn) methodSet = true;
        else data = true;
      }
    }
    ts.forEachChild(n, v);
  };
  if (t) v(t);
  return data ? 'data' : methodSet ? 'methodSet' : null;
};
const ID_RE = /[a-z0-9]Id$/;

for (let i = 0; i < files.length; i++) {
  const f = files[i];
  let sf;
  try {
    sf = parseFile(f);
  } catch (e) {
    continue;
  }
  const doB13 = !f.rel.split('/').includes('contracts') && f.kind !== 'proxy';
  const doB14 = f.kind !== 'proxy' && !f.rel.split('/').includes('contracts') && !f.rel.split('/').includes('widgets') && !/-contract\.tsx?$/.test(f.rel);
  const imported = new Set();
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier) && (st.moduleSpecifier.text.startsWith('.') || st.moduleSpecifier.text.startsWith(cfg.SCOPE)) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings))
      for (const el of st.importClause.namedBindings.elements) imported.add((el.propertyName || el.name).text);
  }
  const visit = (n) => {
    if (ts.isIdentifier(n)) {
      if (targetNames.has(n.text) && imported.has(n.text)) {
        const p = n.parent;
        if (!(ts.isImportSpecifier(p) || ts.isExportSpecifier(p) || ts.isImportClause(p) || ts.isNamespaceImport(p))) bump(idHits, n.text, i);
      }
    } else if (ts.isCallExpression(n)) {
      const c = n.expression;
      if (ts.isIdentifier(c) && targetNames.has(c.text) && imported.has(c.text)) bump(stubHits, c.text, i);
      if (ts.isPropertyAccessExpression(c) && /^(parse|safeParse|parseAsync|safeParseAsync)$/.test(c.name.text) && ts.isIdentifier(c.expression) && targetNames.has(c.expression.text) && imported.has(c.expression.text)) bump(parseHits, c.expression.text, i);
    }
    if (doB13 && ts.isParameter(n) && ts.isFunctionLike(n.parent)) {
      if (ts.isIdentifier(n.name) && ID_RE.test(n.name.text) && n.type && n.type.kind === ts.SyntaxKind.StringKeyword) b13.push({ pkg: f.pkg, file: f.short, line: lineOf(sf, n), name: n.name.text, kind: 'param', fk: f.kind });
      if (n.type && ts.isTypeLiteralNode(n.type)) {
        for (const m of n.type.members) {
          if (ts.isPropertySignature(m) && m.name && ts.isIdentifier(m.name) && ID_RE.test(m.name.text) && m.type && m.type.kind === ts.SyntaxKind.StringKeyword) b13.push({ pkg: f.pkg, file: f.short, line: lineOf(sf, m), name: m.name.text, kind: 'prop', fk: f.kind });
        }
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);

  if (doB14) {
    const rec = (node, site, cat) => {
      if (!cat) return;
      b14.push({ pkg: f.pkg, file: f.short, line: lineOf(sf, node), folder: f.folder, fk: f.kind, site, cat });
    };
    const modWalk = (n) => {
      if (!n) return;
      if (ts.isFunctionLike(n) && !ts.isConstructorDeclaration(n)) {
        if (n.type) rec(n.type, 'return', classifyType(n.type));
        return;
      }
      if (ts.isClassLike(n) || ts.isInterfaceDeclaration(n)) return;
      if ((ts.isCallExpression(n) || ts.isNewExpression(n)) && n.typeArguments) for (const ta of n.typeArguments) rec(ta, 'typeArg', classifyType(ta));
      ts.forEachChild(n, modWalk);
    };
    for (const st of sf.statements) {
      if (ts.isFunctionDeclaration(st)) {
        if (st.type) rec(st.type, 'return', classifyType(st.type));
      } else if (ts.isTypeAliasDeclaration(st)) {
        rec(st.type, 'alias', classifyType(st.type));
      } else if (ts.isVariableStatement(st)) {
        for (const d of st.declarationList.declarations) {
          if (d.type) rec(d.type, 'varType', classifyType(d.type));
          if (d.initializer) modWalk(d.initializer);
        }
      } else if (ts.isExpressionStatement(st) || ts.isExportAssignment(st)) {
        modWalk(st.expression);
      }
    }
  }
}

// ---------- aggregation ----------
const sumMap = (m, filter) => {
  let total = 0, nf = 0;
  const pk = new Set();
  if (!m) return { total, nf, pk };
  for (const [i, c] of m) {
    if (filter(files[i])) {
      total += c;
      nf++;
      pk.add(files[i].pkg);
    }
  }
  return { total, nf, pk };
};
const isProdFile = (f) => f.kind === 'prod' || f.kind === 'contract';
const isNonProd = (f) => f.kind === 'test' || f.kind === 'proxy' || f.kind === 'stub' || f.kind === 'harness';
const csv = (rows, cols) => cols.join(',') + '\n' + rows.map((r) => cols.map((c) => JSON.stringify(r[c] ?? '')).join(',')).join('\n') + '\n';

// field uses per standalone
const fuByContract = new Map();
for (const u of fieldUses) for (const id of u.ids) if (targets.has(id)) {
  if (!fuByContract.has(id)) fuByContract.set(id, []);
  fuByContract.get(id).push(u);
}
const declPkgs = new Map();
for (const s of sInfo) { if (!declPkgs.has(s.contract)) declPkgs.set(s.contract, new Set()); declPkgs.get(s.contract).add(s.pkg); }
const resolvesTo = (s, refPkg) => {
  const set = declPkgs.get(s.contract);
  if (set.size === 1) return true;
  const owner = set.has(refPkg) ? refPkg : set.has('shared') ? 'shared' : [...set].sort()[0];
  return owner === s.pkg;
};
const sRows = [];
for (const s of sInfo) {
  const declFile = s.file;
  const notDecl = (f) => f.short !== declFile && resolvesTo(s, f.pkg);
  const fu = (fuByContract.get(s.contract) || []).filter((u) => u.file !== declFile && resolvesTo(s, u.pkg));
  const owners = new Set(fu.map((u) => u.file + '#' + u.owner));
  const tRef = sumMap(idHits.get(s.typeName), (f) => isProdFile(f) && notDecl(f));
  const cRefContractFiles = sumMap(idHits.get(s.contract), (f) => f.kind === 'contract' && notDecl(f));
  const parsesProd = sumMap(parseHits.get(s.contract), (f) => isProdFile(f) && notDecl(f));
  const parsesTest = sumMap(parseHits.get(s.contract), (f) => isNonProd(f) && notDecl(f));
  const stubNon = sumMap(stubHits.get(s.stub), (f) => isNonProd(f) && notDecl(f));
  const stubProd = sumMap(stubHits.get(s.stub), (f) => isProdFile(f) && notDecl(f));
  const pk = new Set([s.pkg]);
  for (const m of [idHits.get(s.typeName), idHits.get(s.contract), parseHits.get(s.contract), stubHits.get(s.stub)]) {
    const r = sumMap(m, (f) => notDecl(f));
    r.pk.forEach((x) => pk.add(x));
  }
  const fanOut = tRef.total + parsesProd.total + stubNon.total;
  sRows.push({
    pkg: s.pkg, contract: s.contract, typeName: s.typeName, brand: s.brand, root: s.root, file: s.file, line: s.line,
    fieldUses: fu.length, ownerContracts: owners.size, contractRefsInOtherContractFiles: cRefContractFiles.total,
    class: fu.length > 0 ? 'F' : 'P',
    prodTypeFiles: tRef.nf, prodTypeRefs: tRef.total, prodParses: parsesProd.total, testParses: parsesTest.total,
    dupNameRows: (byName.get(s.contract) || []).filter((x) => x.exported).length, stubCalls: stubNon.total, stubFiles: stubNon.nf, stubCallsInProd: stubProd.total, packages: pk.size, packageList: [...pk].sort().join('|'), fanOut,
  });
}
fs.writeFileSync(OUT + '/standalone-brands.csv', csv(sRows, Object.keys(sRows[0])));

// enum stubs
const stubDecl = new Set();
for (const f of files) if (f.kind === 'stub') {
  // cheap: names exported are discovered by regex on file text
  const t = fs.readFileSync(f.abs, 'utf8');
  for (const m of t.matchAll(/export const (\w+Stub)\b/g)) stubDecl.add(m[1]);
}
const eRows = eInfo.map((e) => {
  const s = sumMap(stubHits.get(e.stub), (f) => isNonProd(f));
  return { pkg: e.pkg, enumContract: e.contract, stub: e.stub, stubExists: stubDecl.has(e.stub), stubCalls: s.total, stubFiles: s.nf, enumBrand: e.branded, file: e.file };
});
fs.writeFileSync(OUT + '/enum-stubs.csv', csv(eRows, Object.keys(eRows[0])));

// per-package table
const pkgArr = [...pkgRows.values()];
fs.writeFileSync(OUT + '/per-package.csv', csv(pkgArr, Object.keys(pkgArr[0])));

// class per package
const clsPkg = {};
for (const r of sRows) {
  clsPkg[r.pkg] = clsPkg[r.pkg] || { P: 0, F: 0 };
  clsPkg[r.pkg][r.class]++;
}

// brand sharing
const bt = new Map();
for (const b of brandSites) {
  if (!bt.has(b.text)) bt.set(b.text, []);
  bt.get(b.text).push(b);
}
const shared = [];
for (const [text, arr] of bt) {
  const sites = new Map();
  for (const b of arr) sites.set(b.file + '#' + b.owner + '#' + b.key, b);
  if (sites.size >= 2) {
    const s = [...sites.values()];
    shared.push({ text, sites: s.length, files: new Set(s.map((x) => x.file)).size, pkgs: [...new Set(s.map((x) => x.pkg))].join('|'), example: s.slice(0, 4).map((x) => `${x.file}:${x.line}(${x.owner}.${x.key || '-'})`).join(' ; ') });
  }
}
shared.sort((a, b) => b.sites - a.sites);
fs.writeFileSync(OUT + '/brand-sharing.csv', csv(shared, ['text', 'sites', 'files', 'pkgs', 'example']));
const totalBrandTexts = bt.size;

// B13
const b13ByPkg = {};
for (const h of b13) {
  const r = (b13ByPkg[h.pkg] = b13ByPkg[h.pkg] || { pkg: h.pkg, prod: 0, test: 0, other: 0, total: 0 });
  r.total++;
  if (h.fk === 'prod') r.prod++;
  else if (h.fk === 'test') r.test++;
  else r.other++;
}
const b13Names = {};
for (const h of b13) b13Names[h.name] = (b13Names[h.name] || 0) + 1;
fs.writeFileSync(OUT + '/b13-by-package.csv', csv(Object.values(b13ByPkg), ['pkg', 'prod', 'test', 'other', 'total']));
fs.writeFileSync(OUT + '/b13-hits.csv', csv(b13, ['pkg', 'file', 'line', 'name', 'kind', 'fk']));

// B14
const agg = (key) => {
  const m = {};
  for (const h of b14) {
    const k = key(h);
    const r = (m[k] = m[k] || { key: k, dataImpl: 0, methodSetImpl: 0, dataTest: 0, methodSetTest: 0 });
    const impl = h.fk === 'prod';
    if (h.cat === 'data') impl ? r.dataImpl++ : r.dataTest++;
    else impl ? r.methodSetImpl++ : r.methodSetTest++;
  }
  return Object.values(m).sort((a, b) => b.dataImpl - a.dataImpl);
};
const b14Pkg = agg((h) => h.pkg);
const b14Folder = agg((h) => h.folder);
const b14Site = {};
for (const h of b14) if (h.cat === 'data' && h.fk === 'prod') b14Site[h.site] = (b14Site[h.site] || 0) + 1;
fs.writeFileSync(OUT + '/b14-by-package.csv', csv(b14Pkg, ['key', 'dataImpl', 'methodSetImpl', 'dataTest', 'methodSetTest']));
fs.writeFileSync(OUT + '/b14-by-folder.csv', csv(b14Folder, ['key', 'dataImpl', 'methodSetImpl', 'dataTest', 'methodSetTest']));
const pf = {};
for (const h of b14) if (h.cat === 'data' && h.fk === 'prod') {
  const k = h.pkg + '/' + h.folder;
  pf[k] = (pf[k] || 0) + 1;
}
fs.writeFileSync(OUT + '/b14-by-package-folder.csv', csv(Object.entries(pf).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ key: k, dataImpl: v })), ['key', 'dataImpl']));
fs.writeFileSync(OUT + '/b14-hits.csv', csv(b14, ['pkg', 'file', 'line', 'folder', 'fk', 'site', 'cat']));

// summary
const sum = {
  filesScanned: files.length,
  contractFiles: contractFiles.length,
  perPackage: pkgArr,
  standaloneTotal: sRows.length,
  classTotals: { P: sRows.filter((r) => r.class === 'P').length, F: sRows.filter((r) => r.class === 'F').length },
  classPerPackage: clsPkg,
  totalsStandalone: {
    fieldUses: sRows.reduce((a, r) => a + r.fieldUses, 0),
    prodTypeRefs: sRows.reduce((a, r) => a + r.prodTypeRefs, 0),
    prodParses: sRows.reduce((a, r) => a + r.prodParses, 0),
    stubCalls: sRows.reduce((a, r) => a + r.stubCalls, 0),
  },
  top30: [...sRows].sort((a, b) => (b.prodTypeRefs + b.prodParses + b.stubCalls) - (a.prodTypeRefs + a.prodParses + a.stubCalls)).slice(0, 30).map((r) => ({ pkg: r.pkg, contract: r.contract, brand: r.brand, class: r.class, fieldUses: r.fieldUses, owners: r.ownerContracts, typeRefs: r.prodTypeRefs, typeFiles: r.prodTypeFiles, parses: r.prodParses, stubCalls: r.stubCalls, stubFiles: r.stubFiles, pkgs: r.packages, fanOut: r.fanOut })),
  uniqueByContractName: (() => { const seen = new Map(); for (const r of sRows) { const k = r.contract; const o = seen.get(k) || { n: 0, tr: 0, pa: 0, sc: 0 }; o.n++; o.tr = r.prodTypeRefs; o.pa = r.prodParses; o.sc = r.stubCalls; seen.set(k, o); } let tr = 0, pa = 0, sc = 0; for (const o of seen.values()) { tr += o.tr; pa += o.pa; sc += o.sc; } return { names: seen.size, typeRefs: tr, parses: pa, stubCalls: sc }; })(),
  enumBranded: eRows.filter((r) => r.enumBrand).length,
  brandTextsTotal: totalBrandTexts,
  brandTextsShared: shared.length,
  top20Shared: shared.slice(0, 20),
  b13: { total: b13.length, byPkg: Object.values(b13ByPkg), topNames: Object.entries(b13Names).sort((a, b) => b[1] - a[1]).slice(0, 20) },
  b14: { byPackage: b14Pkg, byFolder: b14Folder, bySiteImpl: b14Site },
  enumStubs: { enums: eRows.length, withStub: eRows.filter((r) => r.stubExists).length, calls: eRows.reduce((a, r) => a + r.stubCalls, 0), top: [...eRows].sort((a, b) => b.stubCalls - a.stubCalls).slice(0, 15) },
  duplicateNames: [...byName.entries()].filter(([, v]) => v.length > 1 && v.some((c) => c.exported)).length,
};
const kh = {};
for (const c of consts) if (c.exported) { const a = constInfo.get(c); const k = a.kind + (a.brandAny ? '+brand' : ''); (kh[k] = kh[k] || []).push(c.file.short + ':' + c.line + ' ' + c.name); }
fs.writeFileSync(OUT + '/kinds.json', JSON.stringify(Object.fromEntries(Object.entries(kh).map(([k, v]) => [k, { n: v.length, ex: v.slice(0, 6) }])), null, 1));
fs.writeFileSync(OUT + '/summary.json', JSON.stringify(sum, null, 1));
console.log('done', files.length, 'files');

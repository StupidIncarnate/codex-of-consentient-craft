// Shared helpers for the Phase 3/4 migration scripts. Every script re-censuses the tree on each run;
// nothing here holds a file list.
//
// Resolution is TypeScript's own (`ts.resolveModuleName`, node16, `customConditions: ['source']` — the
// root tsconfig's settings), through a host that can overlay file contents. The overlay is how a dry
// run proves that a rewritten specifier resolves against a package.json that has not been written yet.
const fs = require('fs');
const path = require('path');

// Root, scope, gateway names and output folders come from port-config.cjs (flags, MIGRATE_* env, or defaults).
const cfg = require('./port-config.cjs');

const { ROOT } = cfg;
const ts = require(path.join(ROOT, 'node_modules', 'typescript'));

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.ward',
  'coverage',
  'test-results',
  '.test-tmp',
  'playwright-report',
  '_lint-testbed',
]);
const TS_FILE = /\.(ts|tsx|mts|cts)$/u;
const TEST_SUPPORT_FILE = /\.(test|integration\.test|e2e|spec|proxy|stub|harness)\.tsx?$/u;
const STUB_OR_PROXY_FILE = /\.(stub|proxy)\.tsx?$/u;

const rel = (abs) => path.relative(ROOT, abs).split(path.sep).join('/');

const workspaces = () => {
  const out = [];
  const add = (dir) => {
    const pj = path.join(dir, 'package.json');
    if (!fs.existsSync(pj)) return;
    const json = JSON.parse(fs.readFileSync(pj, 'utf8'));
    out.push({
      name: json.name,
      // An unscoped package (a consumer's bin package) goes by its folder name, as the decision tables do.
      short: cfg.SCOPE_RE.test(json.name) ? cfg.stripScope(json.name) : path.basename(dir),
      dir,
      rel: rel(dir),
      isGateway: rel(dir).startsWith(`${cfg.GATEWAY_DIR}/`),
      packageJsonPath: pj,
      packageJson: json,
    });
  };
  const pk = path.join(ROOT, 'packages');
  for (const d of fs.readdirSync(pk)) {
    if (`packages/${d}` === cfg.GATEWAY_DIR) {
      for (const g of fs.readdirSync(path.join(pk, d))) add(path.join(pk, d, g));
    } else add(path.join(pk, d));
  }
  return out;
};

const workspaceOf = (abs, list) =>
  list
    .filter((w) => abs === w.dir || abs.startsWith(w.dir + path.sep))
    .sort((a, b) => b.dir.length - a.dir.length)[0];

const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (TS_FILE.test(e.name) && !e.name.endsWith('.d.ts')) out.push(p);
  }
  return out;
};

const parse = (abs, text) =>
  ts.createSourceFile(
    abs,
    text ?? fs.readFileSync(abs, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    abs.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

const COMPILER_OPTIONS = {
  module: ts.ModuleKind.Node16,
  moduleResolution: ts.ModuleResolutionKind.Node16,
  customConditions: ['source'],
  resolveJsonModule: true,
  allowJs: true,
  jsx: ts.JsxEmit.ReactJSX,
};

// overlay: Map<absPath, text | null>; null means "this file does not exist".
// A worktree sits inside the main checkout, so an unfenced walk-up that misses there resolves to
// the MAIN checkout's copy and fakes a pass. Every host below hides paths outside the fence
// (the root, plus the real directories of `file:`-linked packages: port-config.cjs).
const inRoot = cfg.inFence;
// Overlay keys are real paths; resolution asks through the node_modules symlink path, so a path is
// also looked up by its real directory.
const canon = (p) => {
  // realpath of the deepest existing ancestor + the rest, so a NEW file under a symlinked package resolves
  const a = path.resolve(p);
  const rest = [];
  let cur = a;
  for (;;) {
    try {
      return path.join(fs.realpathSync(cur), ...rest.reverse());
    } catch {
      const up = path.dirname(cur);
      if (up === cur) return a;
      rest.push(path.basename(cur));
      cur = up;
    }
  }
};
const overlayView = (overlay) => {
  const has = (p) => overlay.has(path.resolve(p)) || overlay.has(canon(p));
  const get = (p) => (overlay.has(path.resolve(p)) ? overlay.get(path.resolve(p)) : overlay.get(canon(p)));
  const hasDir = (p) => {
    const ds = [path.resolve(p) + path.sep, canon(p) + path.sep];
    for (const [k, v] of overlay) if (v !== null && ds.some((d) => k.startsWith(d))) return true;
    return false;
  };
  return { has, get, hasDir };
};
const makeResolver = (overlay = new Map()) => {
  const { has, get, hasDir } = overlayView(overlay);
  const host = {
    fileExists: (p) => (has(p) ? get(p) !== null : inRoot(p) && ts.sys.fileExists(p)),
    readFile: (p) => (has(p) ? (get(p) ?? undefined) : ts.sys.readFile(p)),
    directoryExists: (p) => hasDir(p) || (inRoot(p) && ts.sys.directoryExists(p)),
    getDirectories: (p) => ts.sys.getDirectories(p),
    realpath: (p) => ts.sys.realpath(p),
    getCurrentDirectory: () => ROOT,
  };
  const memo = new Map();
  return (spec, fromFile) => {
    const key = `${path.dirname(fromFile)}\0${spec}`;
    if (memo.has(key)) return memo.get(key);
    const r = ts.resolveModuleName(spec, fromFile, COMPILER_OPTIONS, host);
    const f = r.resolvedModule ? path.resolve(r.resolvedModule.resolvedFileName) : null;
    memo.set(key, f);
    return f;
  };
};

// Follows a module's export graph to the file that declares `name`. Handles `export *`,
// `export { a as b } from`, `export * as ns from`, `import { a } ...; export { a }`, and local
// declarations. Returns { file, kind: 'decl' | 'namespace' } or null.
const sfCache = new Map();
const cachedParse = (abs) => {
  if (!sfCache.has(abs)) sfCache.set(abs, parse(abs));
  return sfCache.get(abs);
};
const hasExportModifier = (n) => (ts.getCombinedModifierFlags(n) & ts.ModifierFlags.Export) !== 0;

const findDeclaringFile = (file, name, resolve, seen = new Set()) => {
  const key = `${file}\0${name}`;
  if (seen.has(key)) return null;
  seen.add(key);
  if (!/\.(ts|tsx|mts|cts)$/u.test(file) || file.endsWith('.d.ts')) return { file, kind: 'external' };
  const sf = cachedParse(file);
  const localImports = new Map();
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) {
      for (const el of st.importClause.namedBindings.elements) {
        localImports.set(el.name.text, { spec: st.moduleSpecifier.text, name: (el.propertyName ?? el.name).text });
      }
    }
  }
  const starTargets = [];
  for (const st of sf.statements) {
    if (ts.isExportDeclaration(st)) {
      const spec = st.moduleSpecifier && ts.isStringLiteral(st.moduleSpecifier) ? st.moduleSpecifier.text : null;
      if (!st.exportClause) {
        if (spec) starTargets.push(spec);
        continue;
      }
      if (ts.isNamespaceExport(st.exportClause)) {
        if (st.exportClause.name.text === name && spec) {
          const t = resolve(spec, file);
          return t ? { file: t, kind: 'namespace' } : null;
        }
        continue;
      }
      for (const el of st.exportClause.elements) {
        if (el.name.text !== name) continue;
        const src = (el.propertyName ?? el.name).text;
        if (spec) {
          const t = resolve(spec, file);
          return t ? findDeclaringFile(t, src, resolve, seen) : null;
        }
        const li = localImports.get(src);
        if (li) {
          const t = resolve(li.spec, file);
          return t ? findDeclaringFile(t, li.name, resolve, seen) : null;
        }
        return { file, kind: 'decl' };
      }
      continue;
    }
    if (!hasExportModifier(st)) continue;
    if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (ts.isIdentifier(d.name) && d.name.text === name) return { file, kind: 'decl' };
        if (ts.isObjectBindingPattern(d.name) && d.name.elements.some((e) => ts.isIdentifier(e.name) && e.name.text === name)) {
          return { file, kind: 'decl' };
        }
      }
    } else if (st.name && ts.isIdentifier(st.name) && st.name.text === name) {
      return { file, kind: 'decl' };
    }
  }
  for (const spec of starTargets) {
    const t = resolve(spec, file);
    if (!t) continue;
    const r = findDeclaringFile(t, name, resolve, seen);
    if (r) return r;
  }
  return null;
};

// The three-key exports form of EPIC concession 1, for a workspace package. `dist` paths come from
// the package's own tsconfig.build.json (rootDir/outDir), never assumed. Conditions follow the
// gateway's order minus its gateway-only conditions: source, types, import, require.
const readJsonc = (p) => {
  if (!fs.existsSync(p)) return null;
  const r = ts.parseConfigFileTextToJson(p, fs.readFileSync(p, 'utf8'));
  return r.config ?? null;
};
const distSrcPrefix = (w) => {
  const cfg = readJsonc(path.join(w.dir, 'tsconfig.build.json'));
  const co = cfg?.compilerOptions ?? {};
  const rootDir = path.resolve(w.dir, co.rootDir ?? '.');
  const outDir = path.resolve(w.dir, co.outDir ?? 'dist');
  const srcOut = path.join(outDir, path.relative(rootDir, path.join(w.dir, 'src')));
  return './' + path.relative(w.dir, srcOut).split(path.sep).join('/');
};
const threeKeyExports = (w) => {
  const d = distSrcPrefix(w);
  const entry = (srcPat, distPat) => ({
    source: `./src/${srcPat}.ts`,
    types: `${d}/${distPat}.d.ts`,
    import: `${d}/${distPat}.js`,
    require: `${d}/${distPat}.js`,
  });
  return {
    './*.proxy': w.short === 'testing' ? entry('*.proxy', '*.proxy') : { source: './src/*.proxy.ts' },
    './*.stub': w.short === 'testing' ? entry('*.stub', '*.stub') : { source: './src/*.stub.ts' },
  };
};

// One explicit key per folder-type barrel: TypeScript names a module from an exports pattern by
// splitting at the first `*` only, so a two-star `./*` key breaks declaration emit (TS2742).
const barrelKeys = (w, names) => {
  const d = distSrcPrefix(w);
  const out = {};
  for (const ft of [...names].sort()) {
    out[`./${ft}`] = {
      source: `./src/${ft}/${ft}.ts`,
      types: `${d}/${ft}/${ft}.d.ts`,
      import: `${d}/${ft}/${ft}.js`,
      require: `${d}/${ft}/${ft}.js`,
    };
  }
  return out;
};

// Which existing `exports` keys a folder-type barrel key replaces: `./<name>` whose name is a
// directory under src/. Everything else ('.', './tsconfig', './rule-tester.harness', ...) is kept.
const srcFolderTypes = (w) => {
  const src = path.join(w.dir, 'src');
  if (!fs.existsSync(src)) return new Set();
  return new Set(fs.readdirSync(src, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name));
};

// keepUnmovedBarrels: keep a `./<folderType>` key while its barrel has not moved to
// src/<ft>/<ft>.ts yet, so the planned map resolves on today's tree as well as after the move.
const plannedExports = (w, { keepTesting = true, keepUnmovedBarrels = true } = {}) => {
  const old = w.packageJson.exports ?? {};
  const fts = srcFolderTypes(w);
  const kept = {};
  const dropped = [];
  for (const [k, v] of Object.entries(typeof old === 'string' ? { '.': old } : old)) {
    const m = /^\.\/([^*/]+)$/u.exec(k);
    if (k === './*' || k === './*.proxy' || k === './*.stub') continue;
    if (k === './testing') {
      if (keepTesting) kept[k] = v;
      else dropped.push(k);
      continue;
    }
    if (m && fts.has(m[1]) && !(keepUnmovedBarrels && !fs.existsSync(path.join(w.dir, 'src', m[1], `${m[1]}.ts`)))) {
      dropped.push(k);
      continue;
    }
    kept[k] = v;
  }
  const barrels = new Set(dropped.filter((k) => k !== './testing').map((k) => k.slice(2)));
  for (const ft of fts) if (fs.existsSync(path.join(w.dir, 'src', ft, `${ft}.ts`))) barrels.add(ft);
  for (const k of Object.keys(kept)) barrels.delete(k.slice(2));
  // A package with no `exports` keeps its package.json subpath, and its bare-specifier entry when it has a `main`:
  // adding `exports` closes both otherwise.
  const legacy = {};
  const main = w.packageJson.main;
  if (w.packageJson.exports === undefined) legacy['./package.json'] = './package.json';
  if (w.packageJson.exports === undefined && typeof main === 'string' && /^\.?\/?dist\/.+\.js$/u.test(main)) {
    const base = main.replace(/^\.?\/?dist\//u, '').replace(/\.js$/u, '');
    legacy['.'] = {
      source: `./${base}.ts`,
      types: `./dist/${base}.d.ts`,
      import: `./dist/${base}.js`,
      require: `./dist/${base}.js`,
    };
  }
  return { exports: { ...legacy, ...kept, ...threeKeyExports(w), ...barrelKeys(w, barrels) }, dropped, kept: Object.keys(kept) };
};

const unifiedDiff = (file, before, after) => {
  if (before === after) return '';
  const a = before.split('\n');
  const b = after.split('\n');
  let s = 0;
  while (s < a.length && s < b.length && a[s] === b[s]) s++;
  let ea = a.length - 1;
  let eb = b.length - 1;
  while (ea >= s && eb >= s && a[ea] === b[eb]) {
    ea--;
    eb--;
  }
  // Myers O(ND) over the changed middle only, then print changed runs with two lines of context.
  const A = a.slice(s, ea + 1);
  const B = b.slice(s, eb + 1);
  const N = A.length;
  const M = B.length;
  const max = N + M;
  const off = max + 1;
  let v = new Int32Array(2 * max + 3);
  const trace = [];
  let found = false;
  for (let d = 0; d <= max && !found; d++) {
    trace.push(v.slice());
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? v[off + k + 1] : v[off + k - 1] + 1;
      let y = x - k;
      while (x < N && y < M && A[x] === B[y]) {
        x++;
        y++;
      }
      v[off + k] = x;
      if (x >= N && y >= M) {
        found = true;
        break;
      }
    }
  }
  const rev = [];
  let x = N;
  let y = M;
  for (let d = trace.length - 1; d >= 0; d--) {
    const vv = trace[d];
    const k = x - y;
    const prevK = k === -d || (k !== d && vv[off + k - 1] < vv[off + k + 1]) ? k + 1 : k - 1;
    const px = vv[off + prevK];
    const py = px - prevK;
    while (x > px && y > py) rev.push([' ', A[--x], y--]);
    if (d > 0) {
      if (x === px) rev.push(['+', B[--y]]);
      else rev.push(['-', A[--x]]);
    }
  }
  const ops = rev.reverse().map(([o, l]) => [o, l]);
  const all = [...a.slice(0, s).map((l) => [' ', l]), ...ops, ...a.slice(ea + 1).map((l) => [' ', l])];
  const ctx = 2;
  const keep = all.map(() => false);
  all.forEach(([o], k) => {
    if (o !== ' ') for (let x = Math.max(0, k - ctx); x <= Math.min(all.length - 1, k + ctx); x++) keep[x] = true;
  });
  const out = [`--- a/${file}`, `+++ b/${file}`];
  let oldLine = 1;
  let prevKept = false;
  all.forEach(([o, l], k) => {
    if (keep[k] && !prevKept) out.push(`@@ -${oldLine} @@`);
    if (keep[k]) out.push(o + l);
    prevKept = keep[k];
    if (o !== '+') oldLine++;
  });
  return out.join('\n') + '\n';
};

const applyEdits = (text, edits) => {
  const sorted = [...edits].sort((x, y) => y.start - x.start);
  let out = text;
  for (const e of sorted) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  return out;
};

// Overlay every non-gateway, non-testing workspace package.json with its planned three-key exports,
// at both its real path and its node_modules symlink path (resolution reads the symlink path).
const plannedExportsOverlay = (list = workspaces(), overlay = new Map()) => {
  for (const w of list) {
    if (w.isGateway || w.name === cfg.pkgName('testing')) continue;
    const text = JSON.stringify({ ...w.packageJson, exports: plannedExports(w).exports }, null, 2);
    overlay.set(w.packageJsonPath, text);
    overlay.set(path.join(ROOT, 'node_modules', w.name, 'package.json'), text);
  }
  return overlay;
};

// Compiler options a package's own typecheck uses: its tsconfig.json, parsed the way tsc parses it.
// The returned options carry the package's root file list as a non-enumerable `rootNames`, so a
// one-file check still sees the package's global setup files (jest-dom matchers, ambient types).
const packageCompilerOptions = (pkgDir) => {
  const cfgPath = path.join(pkgDir, 'tsconfig.json');
  const cfg = ts.readConfigFile(cfgPath, ts.sys.readFile).config;
  const parsed = ts.parseJsonConfigFileContent(cfg, ts.sys, pkgDir, undefined, cfgPath);
  const options = { ...parsed.options, noEmit: true };
  Object.defineProperty(options, 'rootNames', { value: parsed.fileNames, enumerable: false });
  return options;
};

// Semantic + syntactic diagnostics of `files` in a program whose host sees `overlay` in place of disk.
const diagnosticsWithOverlay = (files, overlay, options) => {
  const host = ts.createCompilerHost(options, true);
  const origRead = host.readFile.bind(host);
  const origExists = host.fileExists.bind(host);
  const origGetSf = host.getSourceFile.bind(host);
  const { has, get, hasDir } = overlayView(overlay);
  host.readFile = (p) => (has(p) ? (get(p) ?? undefined) : origRead(p));
  host.fileExists = (p) => (has(p) ? get(p) !== null : inRoot(p) && origExists(p));
  host.directoryExists = (p) => hasDir(p) || (inRoot(p) && ts.sys.directoryExists(p));
  host.getSourceFile = (p, lang, onErr, create) => {
    if (has(p) && get(p) !== null) return ts.createSourceFile(p, get(p), lang, true);
    return origGetSf(p, lang, onErr, create);
  };
  const roots = [...new Set([...(options.rootNames ?? []), ...files])];
  const program = ts.createProgram(roots, options, host);
  const out = new Map();
  for (const f of files) {
    const sf = program.getSourceFile(f);
    out.set(f, sf ? [...program.getSyntacticDiagnostics(sf), ...program.getSemanticDiagnostics(sf)] : null);
  }
  return { program, diagnostics: out };
};

const formatDiagnostic = (d) => {
  const msg = ts.flattenDiagnosticMessageText(d.messageText, ' ');
  if (!d.file) return `TS${d.code}: ${msg}`;
  const { line } = d.file.getLineAndCharacterOfPosition(d.start ?? 0);
  return `${rel(d.file.fileName)}:${line + 1} TS${d.code}: ${msg}`;
};

// A LanguageService over one package's own tsconfig.json, fenced to the root. `live` maps an
// absolute path to { v, text } for in-memory edits; bump `v` on every change.
const makeLanguageService = (pkgDir, live = new Map()) => {
  const cfgPath = path.join(pkgDir, 'tsconfig.json');
  const parsed = ts.parseJsonConfigFileContent(ts.readConfigFile(cfgPath, ts.sys.readFile).config, ts.sys, pkgDir, undefined, cfgPath);
  const options = { ...parsed.options, noEmit: true };
  const service = ts.createLanguageService(
    {
      getScriptFileNames: () => parsed.fileNames,
      getScriptVersion: (f) => String(live.get(path.resolve(f))?.v ?? 0),
      getScriptSnapshot: (f) => {
        const a = path.resolve(f);
        if (live.has(a)) return ts.ScriptSnapshot.fromString(live.get(a).text);
        if (!inRoot(a)) return undefined;
        const t = ts.sys.readFile(a);
        return t === undefined ? undefined : ts.ScriptSnapshot.fromString(t);
      },
      getCurrentDirectory: () => pkgDir,
      getCompilationSettings: () => options,
      getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
      fileExists: (p) => inRoot(p) && ts.sys.fileExists(p),
      readFile: (p) => ts.sys.readFile(p),
      readDirectory: ts.sys.readDirectory,
      directoryExists: (p) => inRoot(p) && ts.sys.directoryExists(p),
      getDirectories: ts.sys.getDirectories,
      realpath: ts.sys.realpath,
    },
    ts.createDocumentRegistry(),
  );
  return { service, fileNames: parsed.fileNames.map((f) => path.resolve(f)), options, live };
};

// The typecheck gate. `cands` are independent edits ({ start, end, text, stmtStart, stmtEnd }) on
// `text`; `render(accepted)` returns the file text with those applied. Applies every candidate, and
// for each diagnostic the edit introduced restores the candidates inside the statement holding it,
// until the file's diagnostics equal its baseline (code + line + message). Returns the accepted
// candidates ([] if it cannot converge). Leaves the service showing the original text.
const gateEdits = ({ service, live, file, text, cands, render, ignore }) => {
  const setText = (t) => live.set(file, { v: (live.get(file)?.v ?? 0) + 1, text: t });
  const diag = () =>
    [...service.getSyntacticDiagnostics(file), ...service.getSemanticDiagnostics(file)].map((d) => ({
      // No line in the key: in a file that is already red, an edit that shifts lines would otherwise make every
      // old diagnostic look new and restore every edit. The baseline is a count per code and message instead.
      key: `${d.code}:${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`,
      start: d.start ?? 0,
      end: (d.start ?? 0) + (d.length ?? 0),
      code: d.code,
    }));
  const base = new Map();
  for (const d of diag()) base.set(d.key, (base.get(d.key) ?? 0) + 1);
  const freshOf = (list) => {
    const left = new Map(base);
    return list.filter((d) => {
      if (ignore && ignore(d)) return false;
      const n = left.get(d.key) ?? 0;
      if (n > 0) { left.set(d.key, n - 1); return false; }
      return true;
    });
  };
  let accepted = [...cands];
  for (let guard = 0; guard < 60 && accepted.length; guard++) {
    const out = render(accepted);
    setText(out);
    const added = freshOf(diag());
    if (!added.length) break;
    // Map a position in the edited text back to the original by replaying the edits' length deltas.
    const sorted = [...accepted].sort((a, b) => a.start - b.start);
    const back = (pos) => {
      let delta = 0;
      for (const c of sorted) {
        const newStart = c.start + delta;
        if (newStart >= pos) break;
        delta += c.text.length - (c.end - c.start);
      }
      return pos - delta;
    };
    const restore = new Set();
    for (const d of added) {
      const s = back(d.start);
      const e = back(d.end);
      const hits = accepted.filter((c) => c.stmtStart <= s && e <= c.stmtEnd);
      (hits.length ? hits : accepted).forEach((c) => restore.add(c));
    }
    accepted = accepted.filter((c) => !restore.has(c));
  }
  if (accepted.length) {
    setText(render(accepted));
    if (freshOf(diag()).length) accepted = [];
  }
  setText(text);
  return accepted;
};

// The smallest statement (in a block or at file level) holding a node: the unit a gate restores.
const enclosingStatement = (n, sf) => {
  let s = n;
  while (s.parent && !ts.isSourceFile(s.parent)) {
    if (ts.isStatement(s) && ts.isBlock(s.parent)) break;
    s = s.parent;
  }
  return { stmtStart: s.getStart(sf), stmtEnd: s.end };
};

// Folds `import { a } from 'x'; import { b } from 'x';` into the first one (same specifier, same
// type-only-ness, named imports only, no default). A rewrite that points a name at a specifier the
// file already imports would otherwise leave two statements for one module.
const mergeDuplicateImports = (abs, text) => {
  const sf = parse(abs, text);
  const firsts = new Map();
  const edits = [];
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause || st.importClause.name) continue;
    const nb = st.importClause.namedBindings;
    if (!nb || !ts.isNamedImports(nb)) continue;
    const k = `${st.importClause.isTypeOnly}\0${st.moduleSpecifier.text}`;
    if (!firsts.has(k)) {
      firsts.set(k, { st, els: nb.elements.map((e) => e.getText(sf)) });
      continue;
    }
    const f = firsts.get(k);
    for (const e of nb.elements) if (!f.els.includes(e.getText(sf))) f.els.push(e.getText(sf));
    f.changed = true;
    const lineEnd = text.indexOf('\n', st.end);
    edits.push({ start: st.getStart(sf), end: lineEnd === -1 ? st.end : lineEnd + 1, text: '' });
  }
  for (const f of firsts.values()) {
    if (!f.changed) continue;
    const q = f.st.moduleSpecifier.getText(sf)[0];
    edits.push({
      start: f.st.getStart(sf),
      end: f.st.end,
      text: `import${f.st.importClause.isTypeOnly ? ' type' : ''} { ${f.els.join(', ')} } from ${q}${f.st.moduleSpecifier.text}${q};`,
    });
  }
  return applyEdits(text, edits);
};

const isTestSupport = (abs) =>
  TEST_SUPPORT_FILE.test(abs) || /[\\/](test|tests|e2e|__mocks__|test-fixtures)[\\/]/u.test(rel(abs));

module.exports = {
  cfg,
  ROOT,
  OUT: cfg.OUT,
  SCOPE: cfg.SCOPE,
  SCOPE_RE: cfg.SCOPE_RE,
  GW: cfg.GW,
  GATEWAY_DIR: cfg.GATEWAY_DIR,
  ZOD_SPEC: cfg.ZOD_SPEC,
  DELETIONS: cfg.DELETIONS,
  workDir: cfg.workDir,
  outDir: cfg.outDir,
  pkgName: cfg.pkgName,
  rootRequire: cfg.rootRequire,
  ts,
  inRoot,
  rel,
  workspaces,
  workspaceOf,
  walk,
  parse,
  makeResolver,
  findDeclaringFile,
  plannedExports,
  threeKeyExports,
  distSrcPrefix,
  srcFolderTypes,
  unifiedDiff,
  applyEdits,
  isTestSupport,
  gateEdits,
  enclosingStatement,
  makeLanguageService,
  mergeDuplicateImports,
  plannedExportsOverlay,
  packageCompilerOptions,
  diagnosticsWithOverlay,
  formatDiagnostic,
  STUB_OR_PROXY_FILE,
  COMPILER_OPTIONS,
};

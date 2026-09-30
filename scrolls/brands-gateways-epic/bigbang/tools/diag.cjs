#!/usr/bin/env node
// Typecheck workspace packages the way ward's typecheck does
// (packages/ward/src/brokers/check-run/typecheck/check-run-typecheck-broker.ts):
//   pass 1: `tsc --noEmit --listFiles` against the package's tsconfig.json (cwd = package dir)
//   pass 2: `tsc --noEmit -p tsconfig.build.json` when that file exists, errors merged and de-duplicated
// Here each pass is a ts.createProgram over the same parsed config, and diagnostics are gathered in the
// order and with the short-circuits of tsc's own emitFilesAndReportErrors (config -> syntactic -> options
// -> global -> semantic -> declaration when noEmit+declaration). `--full` drops the short-circuits so a
// syntax error in one file does not hide every semantic error in the package.
//
// Usage:
//   node scrolls/brands-gateways-epic/bigbang/tools/diag.cjs [--root=DIR] [--pkgs=cli,config,@gateway/node] [--jobs=3] [--out=file.json]
//        [--overlay=<json file | inline json {path: content|null}>] [--no-build-pass] [--full] [--fence]
// Resolution is UNFENCED by default, like ward's real tsc: in the gateway-pivot worktree node_modules lacks
// @types/pngjs and @types/pixelmatch, and tsc finds them by walking up into the main checkout. --fence hides every
// path outside the root (and outside `file:`-linked packages' real directories) and reports that gap.
// --out is resolved against the root; the worker processes inherit --root through MIGRATE_ROOT.
// One fresh child process per package (memory is returned between packages); --jobs runs N at once.
// Output: JSON array of {pkg, file, line, col, code, message, template, templateFine, checkedBy}, one entry
// per distinct diagnostic. `pkg` is the package that OWNS the file (a red shared file is reported once,
// though every dependent package's program sees it); `checkedBy` lists the package:config passes that saw it.
const fs = require('fs');
const path = require('path');
const { fork } = require('child_process');
const L = require('./lib.cjs');

const { ts, ROOT } = L;
const A = L.args();

// ---------------------------------------------------------------- worker
const runPass = (pkgDir, cfgName, overlay, opts) => {
  const cfgPath = path.join(pkgDir, cfgName);
  const parsed = L.parseTsconfig(cfgPath);
  const options = { ...parsed.options, noEmit: true };
  delete options.incremental;
  delete options.tsBuildInfoFile;
  const host = L.fencedHost(options, overlay, { fence: opts.fence });
  const program = ts.createProgram({
    rootNames: parsed.fileNames,
    options,
    host,
    configFileParsingDiagnostics: ts.getConfigFileParsingDiagnostics(parsed),
    projectReferences: parsed.projectReferences,
  });
  // noEmit/declaration of the ORIGINAL options decide the declaration pass, exactly as in tsc
  const origOptions = { ...parsed.options, noEmit: true };
  const all = [...program.getConfigFileParsingDiagnostics()];
  const base = all.length;
  const full = opts.full;
  all.push(...program.getSyntacticDiagnostics());
  if (full || all.length === base) {
    all.push(...program.getOptionsDiagnostics());
    all.push(...program.getGlobalDiagnostics());
    if (full || all.length === base) all.push(...program.getSemanticDiagnostics());
    if (ts.getEmitDeclarations ? ts.getEmitDeclarations(origOptions) : origOptions.declaration || origOptions.composite) {
      if (full || all.length === base) all.push(...program.getDeclarationDiagnostics());
    }
  }
  return {
    diags: ts.sortAndDeduplicateDiagnostics(all).filter((d) => d.category === ts.DiagnosticCategory.Error),
    fileCount: program.getSourceFiles().length,
  };
};

const worker = () => {
  const pkgDir = path.resolve(ROOT, A.worker);
  const overlay = L.loadOverlay(A.overlay);
  const opts = { full: !!A.full, fence: !!A.fence };
  const out = [];
  const passes = [];
  const t0 = Date.now();
  const cfgs = ['tsconfig.json'];
  if (!A['no-build-pass'] && fs.existsSync(path.join(pkgDir, 'tsconfig.build.json'))) cfgs.push('tsconfig.build.json');
  for (const cfg of cfgs) {
    const t = Date.now();
    const { diags, fileCount } = runPass(pkgDir, cfg, overlay, opts);
    passes.push({ cfg, ms: Date.now() - t, files: fileCount, errors: diags.length });
    for (const d of diags) {
      // Absolute paths in a message are the worktree's; shortened to repo-relative for readers and templates.
      const message = ts.flattenDiagnosticMessageText(d.messageText, '\n').split(`${ROOT}/`).join('');
      let file = null;
      let line = 0;
      let col = 0;
      if (d.file) {
        const lc = d.file.getLineAndCharacterOfPosition(d.start ?? 0);
        file = L.rel(fs.existsSync(d.file.fileName) ? fs.realpathSync(d.file.fileName) : d.file.fileName);
        line = lc.line + 1;
        col = lc.character + 1;
      }
      out.push({ file, line, col, code: d.code, message, cfg });
    }
  }
  const ru = process.resourceUsage();
  process.send({ diags: out, passes, ms: Date.now() - t0, maxRssMB: Math.round(ru.maxRSS / 1024) }, () => process.exit(0));
};

// ---------------------------------------------------------------- parent
const rssOf = (pid) => {
  try {
    const m = /VmRSS:\s+(\d+) kB/u.exec(fs.readFileSync(`/proc/${pid}/status`, 'utf8'));
    return m ? Number(m[1]) / 1024 : 0;
  } catch {
    return 0;
  }
};

const main = async () => {
  const list = L.workspaces().filter((w) => fs.existsSync(path.join(w.dir, 'tsconfig.json')));
  const pkgs = L.pickPackages(A.pkgs, list);
  const jobs = Math.max(1, Number(A.jobs ?? 1));
  // Biggest packages first so the pool packs well.
  const size = (w) => L.walk(path.join(w.dir, 'src')).length;
  const queue = [...pkgs].sort((a, b) => size(b) - size(a));

  let overlayArg = null;
  if (A.overlay && A.overlay !== true) {
    // Workers re-read the overlay from a file; inline JSON is written out once.
    const s = String(A.overlay);
    if (s.trim().startsWith('{')) {
      const p = path.join(L.cfg.workDir(__dirname), `overlay-${process.pid}.json`);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, s);
      overlayArg = p;
    } else overlayArg = path.resolve(ROOT, s);
  }
  const passArgs = [];
  if (overlayArg) passArgs.push(`--overlay=${overlayArg}`);
  for (const f of ['full', 'no-build-pass', 'fence']) if (A[f]) passArgs.push(`--${f}`);

  const t0 = Date.now();
  const results = new Map();
  const live = new Map();
  let peakTotal = 0;
  const sampler = setInterval(() => {
    let tot = 0;
    for (const pid of live.values()) tot += rssOf(pid);
    peakTotal = Math.max(peakTotal, tot);
  }, 250);

  const runOne = (w) =>
    new Promise((resolve) => {
      const child = fork(__filename, [`--worker=${w.dir}`, ...passArgs], {
        cwd: ROOT,
        execArgv: [`--max-old-space-size=${A.heap ?? 8192}`],
        stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
      });
      live.set(w.key, child.pid);
      let got = null;
      child.on('message', (m) => (got = m));
      child.on('exit', (code, signal) => {
        live.delete(w.key);
        results.set(w.key, got ?? { crashed: true, code, signal, diags: [], passes: [] });
        const r = results.get(w.key);
        const errs = r.crashed ? `CRASHED code=${code} signal=${signal}` : `${r.diags.length} diag`;
        process.stderr.write(
          `  ${w.key.padEnd(20)} ${errs.padEnd(12)} ${((r.ms ?? 0) / 1000).toFixed(1).padStart(6)}s  peakRSS ${String(r.maxRssMB ?? '?').padStart(5)}MB  ${(r.passes || []).map((p) => `${p.cfg}:${(p.ms / 1000).toFixed(1)}s/${p.files}f`).join(' ')}\n`,
        );
        resolve();
      });
    });

  const pool = [];
  for (let i = 0; i < jobs; i++)
    pool.push(
      (async () => {
        while (queue.length) await runOne(queue.shift());
      })(),
    );
  await Promise.all(pool);
  clearInterval(sampler);

  // Merge: one entry per distinct diagnostic, attributed to the owning package.
  const merged = new Map();
  for (const [key, r] of results) {
    for (const d of r.diags) {
      const k = `${d.file}|${d.line}|${d.col}|${d.code}|${d.message}`;
      if (!merged.has(k)) {
        merged.set(k, {
          pkg: d.file ? (L.ownerOf(d.file, list) ?? '(outside packages)') : key,
          file: d.file,
          line: d.line,
          col: d.col,
          code: d.code,
          message: d.message,
          template: L.templateOf(d.message, false),
          templateFine: L.templateOf(d.message, true),
          checkedBy: [],
        });
      }
      const tag = `${key}:${d.cfg === 'tsconfig.json' ? 'check' : 'build'}`;
      const e = merged.get(k);
      if (!e.checkedBy.includes(tag)) e.checkedBy.push(tag);
    }
  }
  const out = [...merged.values()].sort((a, b) => String(a.file).localeCompare(String(b.file)) || a.line - b.line || a.col - b.col);
  if (A.out) L.writeJson(A.out, out);

  const byPkg = new Map();
  for (const d of out) byPkg.set(d.pkg, (byPkg.get(d.pkg) ?? 0) + 1);
  const crashed = [...results].filter(([, r]) => r.crashed).map(([k]) => k);
  console.log(`\nerrors by owning package (distinct diagnostics):`);
  for (const [k, n] of [...byPkg].sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(20)} ${n}`);
  console.log(
    `TOTAL ${out.length} distinct errors in ${new Set(out.map((d) => d.file)).size} files | packages ${results.size} | jobs ${jobs} | wall ${((Date.now() - t0) / 1000).toFixed(1)}s | peak concurrent RSS ${(peakTotal / 1024).toFixed(1)}GB${crashed.length ? ` | CRASHED: ${crashed.join(',')}` : ''}${A.out ? ` | -> ${A.out}` : ''}`,
  );
  process.exit(crashed.length ? 2 : 0);
};

if (A.worker) worker();
else main();

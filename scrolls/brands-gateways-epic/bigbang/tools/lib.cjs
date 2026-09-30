// Shared helpers for the bigbang tools: workspaces, per-package tsconfig parsing, a fenced overlay host,
// diagnostic templating, arg parsing.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const ts = require(path.join(ROOT, 'node_modules', 'typescript'));

const rel = (abs) => path.relative(ROOT, abs).split(path.sep).join('/');

const args = (argv = process.argv.slice(2)) => {
  const out = { _: [] };
  for (const a of argv) {
    const m = /^--([^=]+)(?:=(.*))?$/su.exec(a);
    if (m) out[m[1]] = m[2] === undefined ? true : m[2];
    else out._.push(a);
  }
  return out;
};

// Every workspace package: packages/* and packages/@gateway/* (root package.json `workspaces`).
const workspaces = () => {
  const out = [];
  const add = (dir) => {
    const pj = path.join(dir, 'package.json');
    if (!fs.existsSync(pj)) return;
    const json = JSON.parse(fs.readFileSync(pj, 'utf8'));
    const short = json.name.replace(/^@dungeonmaster\//u, '');
    const r = rel(dir);
    out.push({ name: json.name, short, dir, rel: r, key: r.replace(/^packages\//u, '') });
  };
  const pk = path.join(ROOT, 'packages');
  for (const d of fs.readdirSync(pk)) {
    if (d === '@gateway') for (const g of fs.readdirSync(path.join(pk, d))) add(path.join(pk, d, g));
    else add(path.join(pk, d));
  }
  return out;
};

// Owner package key of a repo-relative path ('cli', '@gateway/node', ...), or null.
const ownerOf = (relPath, list) => {
  let best = null;
  for (const w of list) if (relPath === w.rel || relPath.startsWith(w.rel + '/')) if (!best || w.rel.length > best.rel.length) best = w;
  return best ? best.key : null;
};

// Accepts 'cli', 'packages/cli', '@dungeonmaster/cli', '@gateway/node', 'node' (gateway short name).
const pickPackages = (spec, list) => {
  if (!spec || spec === true) return list;
  const want = String(spec).split(',').map((s) => s.trim()).filter(Boolean);
  return want.map((s) => {
    const w = list.find((x) => x.key === s || x.rel === s || x.name === s || x.short === s || x.rel === s.replace(/\/$/u, ''));
    if (!w) throw new Error(`unknown package: ${s}`);
    return w;
  });
};

const parseTsconfig = (cfgPath) => {
  const dir = path.dirname(cfgPath);
  const read = ts.readConfigFile(cfgPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, dir, undefined, cfgPath);
  return parsed;
};

// This worktree sits inside the main checkout: an unfenced walk-up that misses here would resolve to the
// MAIN checkout's copy and fake a pass. Every host hides paths outside ROOT.
const inRoot = (p) => {
  const a = path.resolve(p);
  return a === ROOT || a.startsWith(ROOT + path.sep);
};

// overlay: Map<absRealPath, text|null>. Lookups try the path as asked and its realpath.
const realOrSelf = (p) => {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
};
const loadOverlay = (spec) => {
  const m = new Map();
  if (!spec || spec === true) return m;
  const s = String(spec);
  const obj = s.trim().startsWith('{') ? JSON.parse(s) : JSON.parse(fs.readFileSync(path.resolve(ROOT, s), 'utf8'));
  for (const [k, v] of Object.entries(obj)) {
    const abs = path.resolve(ROOT, k);
    m.set(abs, v);
    m.set(realOrSelf(abs), v);
  }
  return m;
};
const overlayView = (overlay) => {
  if (!overlay.size) return { has: () => false, get: () => undefined, hasDir: () => false };
  const key = (p) => (overlay.has(path.resolve(p)) ? path.resolve(p) : overlay.has(realOrSelf(p)) ? realOrSelf(p) : null);
  return {
    has: (p) => key(p) !== null,
    get: (p) => overlay.get(key(p)),
    hasDir: (p) => {
      const ds = [path.resolve(p) + path.sep, realOrSelf(p) + path.sep];
      for (const [k, v] of overlay) if (v !== null && ds.some((d) => k.startsWith(d))) return true;
      return false;
    },
  };
};

// A compiler host fenced to ROOT, reading `overlay` in place of disk.
const fencedHost = (options, overlay, { fence = true } = {}) => {
  const host = ts.createCompilerHost(options, true);
  const { has, get, hasDir } = overlayView(overlay);
  const ok = (p) => !fence || inRoot(p);
  const origRead = host.readFile.bind(host);
  const origExists = host.fileExists.bind(host);
  const origDirExists = host.directoryExists ? host.directoryExists.bind(host) : ts.sys.directoryExists;
  const origGetSf = host.getSourceFile.bind(host);
  host.readFile = (p) => (has(p) ? (get(p) ?? undefined) : ok(p) ? origRead(p) : undefined);
  host.fileExists = (p) => (has(p) ? get(p) !== null : ok(p) && origExists(p));
  host.directoryExists = (p) => hasDir(p) || (ok(p) && origDirExists(p));
  host.getSourceFile = (p, lang, onErr, create) => {
    if (has(p)) {
      const t = get(p);
      return t === null ? undefined : ts.createSourceFile(p, t, lang, true);
    }
    if (!ok(p)) return undefined;
    return origGetSf(p, lang, onErr, create);
  };
  return host;
};

// Diagnostic -> clustering template. `template` is coarse (every quoted span is 'T'); `templateFine`
// keeps short identifier-like quoted names (a brand like 'FilePath' is the thing a migration cares about).
const QUOTED = /(^|[\s(\[,])'(.*?)'(?=$|[\s.,;:)\]])/gu;
const DQUOTED = /"(?:[^"\\]|\\.)*"/gu;
const templateOf = (msg, fine) => {
  const head = String(msg).split('\n')[0];
  return head
    .replace(QUOTED, (_, pre, inner) => `${pre}'${fine && /^[A-Za-z_$#@][\w$.#@/-]{0,60}$/u.test(inner) ? inner : 'T'}'`)
    .replace(DQUOTED, '"S"')
    .replace(/\b\d+\b/gu, 'N')
    .replace(/\s+/gu, ' ')
    .trim();
};

const isCompanion = (base) => /\.(test|integration\.test|e2e\.test|proxy|stub|e2e|harness)\.tsx?$/u.test(base);
const companionStem = (base) => base.replace(/\.(integration\.test|e2e\.test|test|proxy|stub|e2e|harness)\.tsx?$/u, '');

const TS_FILE = /\.(ts|tsx|mts|cts)$/u;
const SKIP_DIRS = new Set(['node_modules', 'dist', '.ward', 'coverage', 'test-results', '.test-tmp', 'playwright-report', '_lint-testbed']);
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

const readJson = (p) => JSON.parse(fs.readFileSync(path.resolve(ROOT, p), 'utf8'));
const writeJson = (p, v) => {
  const abs = path.resolve(ROOT, p);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(v, null, 1));
  return abs;
};

module.exports = {
  ROOT,
  ts,
  rel,
  args,
  workspaces,
  ownerOf,
  pickPackages,
  parseTsconfig,
  inRoot,
  loadOverlay,
  fencedHost,
  templateOf,
  isCompanion,
  companionStem,
  walk,
  readJson,
  writeJson,
};

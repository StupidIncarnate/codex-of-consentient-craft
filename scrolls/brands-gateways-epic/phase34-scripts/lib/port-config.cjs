// The settings every migration script reads: which repo it works on, where it writes, and the names that differ
// between repos. Each setting is `--<name>=<value>` on the command line, else the `MIGRATE_*` environment variable,
// else the default (this repo's value). A flag is removed from process.argv once read, so a script that treats bare
// arguments as package names never sees it, and it is copied into the environment, so a child process a script
// forks (diag.cjs's workers, sd1's pipeline) works on the same repo.
//
//   --root=DIR            MIGRATE_ROOT           repo the scripts read and write        cwd
//   --out-dir=DIR         MIGRATE_OUT            scratch: reports, leftovers, moved-away files   <root>/tmp
//   --scope=@x/           MIGRATE_SCOPE          npm scope of the repo's own packages   @dungeonmaster/
//   --gateway-dir=REL     MIGRATE_GATEWAY_DIR    folder holding the gateway packages    packages/@gateway
//   --gateway-spec=#x/    MIGRATE_GATEWAY_SPEC   import prefix of the gateways          #gateway/
//   --zod-spec=SPEC       MIGRATE_ZOD_SPEC       specifier a generated file imports z from   <gateway-spec>npm/zod
//   --browser-pkgs=a,b    MIGRATE_BROWSER_PKGS   packages whose gateway kind is browser, not node   web
//   --eslint-prefix=@x/   MIGRATE_ESLINT_PREFIX  rule prefix of @dungeonmaster/eslint-plugin in eslint.config.js   @dungeonmaster/
//   --decisions=FILE      MIGRATE_DECISIONS      the 4.0 decision tables (PORTING.md)   <root>/scrolls/brands-gateways-epic/items/b15-brand-migration.md
//   --fence-extra=a,b     MIGRATE_FENCE_EXTRA    more directories the resolution fence lets through
//   --link-fence=0|1      MIGRATE_LINK_FENCE     let the fence through `file:`-linked packages' real directories   1
//
// The fence: every TypeScript host the scripts build hides paths outside the root, so a walk-up that misses inside
// a worktree cannot resolve to the main checkout's copy and fake a pass. A consumer that links `@dungeonmaster/*` by
// `file:` resolves those packages at their real path outside the root, so each symlink under `node_modules/` whose
// target is outside the root lets that target, and every `node_modules` above it, through the fence.
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const SETTINGS = [
  ['root', 'MIGRATE_ROOT', () => process.cwd(), 'path'],
  ['out-dir', 'MIGRATE_OUT', (s) => path.join(s.root, 'tmp'), 'path'],
  ['scope', 'MIGRATE_SCOPE', () => '@dungeonmaster/'],
  ['gateway-dir', 'MIGRATE_GATEWAY_DIR', () => 'packages/@gateway'],
  ['gateway-spec', 'MIGRATE_GATEWAY_SPEC', () => '#gateway/'],
  ['zod-spec', 'MIGRATE_ZOD_SPEC', (s) => `${s['gateway-spec']}npm/zod`],
  ['browser-pkgs', 'MIGRATE_BROWSER_PKGS', () => 'web'],
  ['eslint-prefix', 'MIGRATE_ESLINT_PREFIX', () => '@dungeonmaster/'],
  ['decisions', 'MIGRATE_DECISIONS', (s) => path.join(s.root, 'scrolls', 'brands-gateways-epic', 'items', 'b15-brand-migration.md'), 'path'],
  ['fence-extra', 'MIGRATE_FENCE_EXTRA', () => ''],
  ['link-fence', 'MIGRATE_LINK_FENCE', () => '1'],
];

const s = {};
for (const [name, env, def, kind] of SETTINGS) {
  const i = process.argv.findIndex((a) => a.startsWith(`--${name}=`));
  let v;
  if (i !== -1) {
    v = process.argv[i].slice(name.length + 3);
    process.argv.splice(i, 1);
    if (kind === 'path') v = path.resolve(v);
  } else v = process.env[env] ?? def(s);
  if (kind === 'path') v = path.resolve(v);
  s[name] = v;
  process.env[env] = v;
}
const ROOT = s.root;
if (!fs.existsSync(path.join(ROOT, 'package.json')) || !fs.existsSync(path.join(ROOT, 'packages'))) {
  throw new Error(`--root=${ROOT} is not an npm-workspaces repo with packages/ (run from the repo root or pass --root)`);
}
const OUT = s['out-dir'];
const withSlash = (x) => (x.endsWith('/') ? x : `${x}/`);
const SCOPE = withSlash(s.scope);
const GW = withSlash(s['gateway-spec']);
const GATEWAY_DIR = s['gateway-dir'].replace(/\/$/u, '');
const ZOD_SPEC = s['zod-spec'];
const ESLINT_PREFIX = withSlash(s['eslint-prefix']);
const BROWSER_PKGS = new Set(s['browser-pkgs'].split(',').map((x) => x.trim()).filter(Boolean));
const esc = (x) => x.replace(/[.*+?^${}()|[\]\\/]/gu, '\\$&');
const SCOPE_ESC = esc(SCOPE);
const SCOPE_RE = new RegExp(`^${SCOPE_ESC}`, 'u');

// ---------- fence ----------
const inside = (a, dir) => a === dir || a.startsWith(dir + path.sep);
const fenceDirs = [ROOT];
const addFence = (d) => {
  const a = path.resolve(d);
  if (!fenceDirs.some((f) => inside(a, f))) fenceDirs.push(a);
};
for (const d of s['fence-extra'].split(',').map((x) => x.trim()).filter(Boolean)) addFence(d);
const LINK_TARGETS = [];
if (s['link-fence'] !== '0') {
  const scan = (nm) => {
    if (!fs.existsSync(nm)) return;
    for (const e of fs.readdirSync(nm)) {
      const entries = e.startsWith('@') && fs.statSync(path.join(nm, e)).isDirectory() ? fs.readdirSync(path.join(nm, e)).map((x) => path.join(nm, e, x)) : [path.join(nm, e)];
      for (const p of entries) {
        if (!fs.lstatSync(p).isSymbolicLink()) continue;
        let t;
        try {
          t = fs.realpathSync(p);
        } catch {
          continue;
        }
        if (inside(t, ROOT)) continue;
        LINK_TARGETS.push({ link: p, target: t });
        addFence(t);
        for (let up = path.dirname(t); up !== path.dirname(up); up = path.dirname(up)) addFence(path.join(up, 'node_modules'));
      }
    }
  };
  scan(path.join(ROOT, 'node_modules'));
  for (const d of fs.readdirSync(path.join(ROOT, 'packages'))) scan(path.join(ROOT, 'packages', d, 'node_modules'));
}
const inFence = (p) => {
  const a = path.resolve(p);
  if (inside(a, ROOT)) return true;
  for (let i = 1; i < fenceDirs.length; i++) if (inside(a, fenceDirs[i])) return true;
  return false;
};

// ---------- where scripts write ----------
// A script's scratch folder mirrors its place under scrolls/brands-gateways-epic/, with phase34-scripts/ shortened to
// phase34/ (the layout the first run used): phase34-scripts/b15-id-brands -> <out>/phase34/b15-id-brands.
const EPIC_HOME = path.resolve(__dirname, '..', '..');
const workDir = (scriptDir) => {
  const r = path.relative(EPIC_HOME, scriptDir).split(path.sep).join('/').replace(/^phase34-scripts(?=\/|$)/u, 'phase34');
  const d = path.join(OUT, r.startsWith('..') ? path.basename(scriptDir) : r);
  fs.mkdirSync(d, { recursive: true });
  return d;
};
const outDir = (scriptDir) => {
  const d = path.join(workDir(scriptDir), 'out');
  fs.mkdirSync(d, { recursive: true });
  return d;
};
// Files a script removes are moved here, never deleted: <out>/deletions/<chunk>/<repo path>.
const DELETIONS = path.join(OUT, 'deletions');

const DECISIONS = s.decisions;
const decisionsText = () => {
  if (!fs.existsSync(DECISIONS)) throw new Error(`decision tables not found: ${DECISIONS} (pass --decisions=<file>; PORTING.md says what it holds)`);
  return fs.readFileSync(DECISIONS, 'utf8');
};

const rootRequire = createRequire(path.join(ROOT, 'package.json'));
const pkgName = (short) => `${SCOPE}${short}`;
const stripScope = (name) => String(name).replace(SCOPE_RE, '');
const gatewayKindOf = (pkgName_) => (BROWSER_PKGS.has(stripScope(pkgName_)) ? 'browser' : 'node');

module.exports = {
  settings: s,
  ROOT,
  OUT,
  SCOPE,
  SCOPE_ESC,
  SCOPE_RE,
  GW,
  GATEWAY_DIR,
  ZOD_SPEC,
  ESLINT_PREFIX,
  BROWSER_PKGS,
  DECISIONS,
  DELETIONS,
  LINK_TARGETS,
  fenceDirs,
  inFence,
  inside,
  workDir,
  outDir,
  decisionsText,
  rootRequire,
  pkgName,
  stripScope,
  gatewayKindOf,
  esc,
};

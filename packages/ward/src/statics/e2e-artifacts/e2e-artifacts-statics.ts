/**
 * PURPOSE: Names the e2e artifacts a run leaves in a package, and how long each is worth keeping.
 * Reach for this rather than spelling a path at a call site: the sweep and the end-of-run removal
 * must agree on every one of these, and an artifact added in only one place leaks silently.
 *
 * `portKeyed` is what the sweep tests an entry's NAME against. Three of these are named after the
 * port the run held, and a port is proof of ownership — it is checked for a live listener before
 * anything is deleted. The bundle is named after a HASH OF ITS INPUTS instead, which is the whole
 * reason it survives across runs, so there is no port to check and every entry under it is ward's.
 *
 * WHY THE THREE WINDOWS DIFFER, and each is answering a different question.
 *
 * The Vite cache holds no evidence: a project setting `optimizeDeps.force: true` re-optimizes from
 * scratch every run and never reads a cache back. It is pure spillage, and it is the whole of the
 * disk problem — measured on this repo at 904 MB across 31 directories against 68 KB across 8
 * `test-results` directories, a ratio of 13,000 to one. Its window asks only how soon waste can go.
 *
 * `test-results/<port>` and the playwright report ARE evidence. A failing run's trace and screenshot
 * say why it failed, and `ttlStatics` records what expiring that costs: a ward failed at 20:04:53,
 * the repair session dispatched to fix it started at 21:14:06, and the detail had been deleted nine
 * minutes earlier, so it worked blind. Their window asks how long a repair takes to arrive, and is
 * pinned to `ttlStatics.runResultTtl` because it is the same question about the same failure.
 *
 * The bundle is neither. It is a CACHE that is reused, so its window asks how long a hash stays
 * current — a different question with a different answer, which is why it is not pinned to the
 * other two.
 *
 * USAGE:
 * e2eArtifactsStatics.artifacts;
 * // Returns the per-run artifact descriptors, each with its parent dir, name prefix and TTL
 */

// Mirrors ttlStatics.runResultTtl — statics cannot import statics, and the rationale for the number
// lives in that file. Two days.
const EVIDENCE_TTL_MS = 172_800_000;
// Strictly shorter than the evidence window, and that ordering is the point rather than the
// number: spillage must expire before the traces do, or the 900 MB comes back.
const CACHE_TTL_MS = 86_400_000;
// The bundle is NOT evidence and is deliberately not tied to the evidence window — it is a cache
// whose entries are REUSED, so its window is sized by how long a hash stays current rather than by
// how long a repair session takes to read a failure back. Measured on `packages/web/.ward/bundle`:
// 31 bundles at 2.7 MB apiece, and the oldest one's `index-*.js` was served 2.99 days after that
// bundle was built — under `relatime`, a lower bound. A two-day window would have thrown that away
// and paid a full production build to rebuild it byte for byte.
const BUNDLE_TTL_MS = 604_800_000;

export const e2eArtifactsStatics = {
  artifacts: [
    {
      // `cacheDir: node_modules/.vite-${basePort}` in the project's vite config. `basePort` is
      // DUNGEONMASTER_PORT, which ward sets to the run's SERVER port — not the web port, even
      // though the process writing this directory is the one listening on the web port.
      parentDir: 'node_modules',
      prefix: '.vite-',
      suffix: '',
      ttlMs: CACHE_TTL_MS,
      portKeyed: true,
    },
    {
      // Playwright's `outputDir`, where the project nests it by port so parallel runs stop clearing
      // each other's traces.
      parentDir: 'test-results',
      prefix: '',
      suffix: '',
      ttlMs: EVIDENCE_TTL_MS,
      portKeyed: true,
    },
    {
      // Ward's own JSON report, named after the run's server port. Ward unlinks it best-effort at
      // the end of a run, so only a run killed before that leaves one behind.
      parentDir: '.',
      prefix: '.ward-playwright-report-',
      suffix: '.json',
      ttlMs: EVIDENCE_TTL_MS,
      portKeyed: true,
    },
    {
      // A prebuilt UI bundle, one directory per hash of the inputs that produced it, plus the
      // `.tmp-<pid>` a killed build never renamed away. Expiring one costs a full production build
      // rather than reclaiming waste, so it carries its own window — see BUNDLE_TTL_MS for what a
      // shorter one was measured to cost.
      parentDir: '.ward/bundle',
      prefix: '',
      suffix: '',
      ttlMs: BUNDLE_TTL_MS,
      portKeyed: false,
    },
  ],
} as const;

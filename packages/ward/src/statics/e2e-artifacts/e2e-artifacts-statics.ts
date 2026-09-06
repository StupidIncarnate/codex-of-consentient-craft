/**
 * PURPOSE: Names the three per-run artifacts an e2e run leaves in a package, and how long each is
 * worth keeping. Reach for this rather than spelling a path at a call site: the sweep and the
 * end-of-run removal must agree on every one of these, and a fourth artifact added in only one
 * place leaks silently.
 *
 * WHY THE TWO WINDOWS DIFFER. The Vite cache holds no evidence: a project setting
 * `optimizeDeps.force: true` re-optimizes from scratch every run and never reads a cache back. It
 * is pure spillage, and it is the whole of the disk problem — measured on this repo at 904 MB
 * across 31 directories against 68 KB across 8 `test-results` directories, a ratio of 13,000 to one.
 *
 * The other two ARE evidence. A failing run's `test-results/<port>` holds the trace and the
 * screenshot that say why it failed, and `ttlStatics` already records what expiring that costs: a
 * ward failed at 20:04:53, the repair session dispatched to fix it started at 21:14:06, and the
 * detail had been deleted nine minutes earlier, so it worked blind. Playwright traces are that same
 * evidence one layer up, so they get that same seven-day window.
 *
 * USAGE:
 * e2eArtifactsStatics.artifacts;
 * // Returns the per-run artifact descriptors, each with its parent dir, name prefix and TTL
 */

// Mirrors ttlStatics.runResultTtl — statics cannot import statics, and the rationale for the number
// lives in that file. Seven days.
const EVIDENCE_TTL_MS = 604_800_000;
const CACHE_TTL_MS = 172_800_000;

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
    },
    {
      // Playwright's `outputDir`, where the project nests it by port so parallel runs stop clearing
      // each other's traces.
      parentDir: 'test-results',
      prefix: '',
      suffix: '',
      ttlMs: EVIDENCE_TTL_MS,
    },
    {
      // Ward's own JSON report, named after the run's server port. Ward unlinks it best-effort at
      // the end of a run, so only a run killed before that leaves one behind.
      parentDir: '.',
      prefix: '.ward-playwright-report-',
      suffix: '.json',
      ttlMs: EVIDENCE_TTL_MS,
    },
  ],
} as const;

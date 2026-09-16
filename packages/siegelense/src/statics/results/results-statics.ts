/**
 * PURPOSE: The `results` call's own vocabulary — the six kinds it accepts, the subset of those six
 * that `since: 'boot'` can actually answer, the `since: 'boot'` sentinel, the row cap one query
 * returns, the step-range separator, and the four level-detection patterns copied verbatim (source
 * and flags both) from `runIndexComputeTransformer` so a run's index and a `results` query's
 * `where: { level }` filter read the same console/network/server line the same way. Patterns are
 * held as `{source, flags}` rather than a regex literal — this folder's own lint rule reserves
 * literal `/pattern/flags` syntax for contracts, guards and transformers. Reach for this over
 * `evidenceFileStatics` when the value describes what a CALLER asks `results` for, not a filename
 * fragment a locations resolver composes on disk.
 *
 * USAGE:
 * resultsStatics.kinds.all;
 * // Returns ['console', 'network', 'ws', 'server', 'screenshots', 'steps']
 *
 * resultsStatics.kinds.sinceBootEligible;
 * // Returns ['console', 'network', 'ws'] — the only kinds a `since: 'boot'` read can answer
 *
 * new RegExp(resultsStatics.patterns.consoleError.source, resultsStatics.patterns.consoleError.flags)
 *   .test('{"at":1,"kind":"console","type":"error", ...}');
 * // Returns true
 */

export const resultsStatics = {
  kinds: {
    // siegelense-tooling.md line 2593-2594's own order.
    all: ['console', 'network', 'ws', 'server', 'screenshots', 'steps'],
    // console.jsonl/network.jsonl/ws.jsonl are the only per-instance files that hold every run's
    // lines end to end (siegelense-tooling.md:122-124's own `kind`+`since: 'boot'` pairing) —
    // server/screenshots/steps each resolve through ONE run's transcript, so there is no
    // "whole timeline" a boot-wide read can answer for them.
    sinceBootEligible: ['console', 'network', 'ws'],
  },
  since: {
    boot: 'boot',
  },
  limits: {
    maxRows: 200,
  },
  stepRange: {
    separator: '-',
  },
  patterns: {
    // Copied verbatim from run-index-compute-transformer.ts's CONSOLE_ERROR_PATTERN (line 28),
    // NETWORK_STATUS_PATTERN (line 29) and SERVER_ERROR_PATTERN (line 32). consoleWarning has no
    // named constant to copy there — the transformer checks it inline as
    // `line.includes('"kind":"console","type":"warning"')` (line 45) — so this is that same
    // literal reshaped into the same {source, flags} pair as its three siblings.
    consoleError: { source: '"kind":"pageerror"|"kind":"console","type":"error"', flags: 'u' },
    consoleWarning: { source: '"kind":"console","type":"warning"', flags: 'u' },
    serverError: { source: 'error', flags: 'iu' },
    networkStatus: { source: '"status":(null|\\d+)', flags: 'u' },
  },
} as const;

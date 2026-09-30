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
 * // Returns ['console', 'network', 'ws', 'server'] — the only kinds a `since: 'boot'` read can answer
 *
 * new RegExp(resultsStatics.patterns.consoleError.source, resultsStatics.patterns.consoleError.flags)
 *   .test('{"at":1,"kind":"console","type":"error", ...}');
 * // Returns true
 */

export const resultsStatics = {
  kinds: {
    // siegelense-tooling.md line 2593-2594's own order.
    all: ['console', 'network', 'ws', 'server', 'screenshots', 'steps'],
    // console.jsonl/network.jsonl/ws.jsonl and api-server.log are the per-instance files that hold
    // every run's lines end to end (siegelense-tooling.md:122-124's own `kind`+`since: 'boot'`
    // pairing) — screenshots/steps each resolve through ONE run's transcript, so there is no
    // "whole timeline" a boot-wide read can answer for them.
    sinceBootEligible: ['console', 'network', 'ws', 'server'],
  },
  since: {
    boot: 'boot',
  },
  // Which --kind each --where-* flag can narrow. A flag outside its kinds filters nothing, so the
  // parser refuses it rather than letting the whole unfiltered view come back.
  whereScope: {
    path: { flag: '--where-path', rows: 'network rows', kinds: ['network'] },
    method: { flag: '--where-method', rows: 'network rows', kinds: ['network'] },
    nth: {
      flag: '--where-nth',
      rows: 'console, network and ws rows',
      kinds: ['console', 'network', 'ws'],
    },
    level: { flag: '--where-level', rows: 'console and server rows', kinds: ['console', 'server'] },
    steps: {
      flag: '--where-steps',
      rows: 'console, network, ws, server and step rows',
      kinds: ['console', 'network', 'ws', 'server', 'steps'],
    },
  },
  // The names a --fields entry can match, per buffer kind. `run` and `step` are stamped onto a
  // `--since boot` row only. Step and screenshot readings take their names from their own contracts.
  fields: {
    console: ['at', 'kind', 'type', 'text', 'url', 'line', 'stack'],
    network: ['at', 'method', 'url', 'resourceType', 'status', 'requestBody', 'responseBody'],
    ws: ['at', 'url', 'direction', 'payload'],
    sinceBootStamped: ['run', 'step'],
  },
  limits: {
    maxRows: 200,
  },
  stepRange: {
    separator: '-',
  },
  render: {
    // The human text view's per-row body trim for `--kind network` — long enough that a real error
    // body's shape still reads, short enough that a screenful of rows stays a screenful.
    bodyTrimChars: 200,
    // What an EMPTY answer calls the thing it found none of, per kind — "0 network requests during
    // run_7" says what was looked for and where, where "none found" says neither.
    emptyNouns: {
      console: 'console lines',
      network: 'network requests',
      ws: 'websocket frames',
      server: 'server log lines',
      screenshots: 'screenshots',
      steps: 'step readings',
    },
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

/**
 * PURPOSE: Names the globals that can strand a handle on the event loop, and the env var ward uses
 * to ask for a report. Reach for this over jest's own `--detectOpenHandles` wherever the run uses
 * WORKERS: jest collects handles on the main thread only, so a worker run reports none, and the flag
 * forces the whole run in band (`if (runInBand || detectOpenHandles)` in `@jest/core`).
 *
 * USAGE:
 * openHandleStatics.timers.arm;
 * // Returns ['setTimeout', 'setInterval', 'setImmediate']
 */
export const openHandleStatics = {
  timers: {
    // Also the source of the finding contract's enum, so the list patched and the list validated
    // cannot drift apart.
    arm: ['setTimeout', 'setInterval', 'setImmediate'],
    disarm: ['clearTimeout', 'clearInterval', 'clearImmediate'],
  },
  report: {
    // Unset means nobody asked: the adapter patches nothing and the run pays nothing.
    pathEnvVar: 'DUNGEONMASTER_OPEN_HANDLE_REPORT',
    // Enough frames to name what armed the timer and the path that reached it. The frames above
    // these are node's own timer plumbing and this package's own wrapper, which name no caller.
    maxStackFrames: 8,
    // BOTH extensions, because the same frame appears twice over: jest resolves this package to
    // TypeScript source, while Playwright resolves it to the build. Matching only `.ts:` left the
    // adapter's own frame at the top of every finding a browser run produced.
    // The colon is what keeps `timers-watch-adapter.test.ts` — a legitimate caller — out of this.
    selfFrames: ['timers-watch-adapter.ts:', 'timers-watch-adapter.js:'],
    // A timer armed entirely inside node's plumbing or a dependency is not ours to fix, and
    // Playwright arms them constantly: a clean five-spec browser batch reported 74 of them, every
    // one a `setTimeout` its own waiting machinery had outstanding. Dropping these is what makes a
    // browser run's leak list mean anything.
    // `node:` and not `node:internal`: Playwright's browser transport arms its timers from
    // `node:events`, so the narrower marker left `at CRSession.emit (node:events:518:28)` standing
    // as the only frame of a finding — 15 of them on a clean five-spec batch.
    foreignFrames: ['node:', 'node_modules'],
  },
} as const;

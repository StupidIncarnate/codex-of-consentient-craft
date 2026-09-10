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
    // Matches the watch adapter's own frames and NOT its test file, which shares the basename and
    // is a legitimate caller. A bare 'timers-watch-adapter' swallowed every frame of that test.
    selfFrame: 'timers-watch-adapter.ts:',
    internalFrame: 'node:internal',
  },
} as const;

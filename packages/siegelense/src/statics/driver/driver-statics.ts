/**
 * PURPOSE: Every timing and sizing knob the driver process itself reads — how long a socket
 * client gets to reach it and how large a request it will read off that socket, how long it
 * sits idle before closing its lane, how long a lane's processes get to answer their ready path
 * during boot, how long teardown waits between SIGTERM and SIGKILL, and the ceiling a step gets
 * when a batch does not name its own. Values are picked once here so the driver, its socket
 * client and its boot poller never hand-roll a timeout that disagrees with a sibling's.
 *
 * USAGE:
 * driverStatics.idle.timeoutMs;
 * // Returns 900_000 — how long the driver waits for the next `run` before closing its lane
 *
 * driverStatics.run.defaultStepTimeoutMs;
 * // Returns 30_000 — the ceiling a step gets when its own `timeoutMs` is omitted
 *
 * driverStatics.settle.ceilingMs;
 * // Returns 5_000 — the most a `waitForSettle` call spends before reporting settled: false
 */

export const driverStatics = {
  socket: {
    // connect() against a local unix socket resolves in microseconds once the driver is
    // listening; a multi-second wait means its event loop is busy launching Chromium or
    // spawning lane processes, not that the socket is unreachable. siegelense-tooling.md line
    // 1700 measures ordinary three-instance contention stretching a 2s page paint to 8s — 5s
    // absorbs a comparable stretch on the connect path before DriverUnreachableError declares
    // the driver actually gone.
    connectTimeoutMs: 5_000,
    // The outer backstop on one whole request/response round trip, not a per-step ceiling —
    // `run.defaultStepTimeoutMs` below already bounds each step, and a `run` request's real
    // ceiling is the sum of its batch's own step timeouts. A ward run over the whole monorepo, or
    // a riftcarver carve (worktree + node_modules mirror + typecheck), already takes minutes
    // elsewhere in this system, so this cannot be tight; it exists only to eventually surface a
    // driver that stopped answering entirely mid-batch, rather than leaving the calling MCP tool
    // blocked forever.
    requestTimeoutMs: 300_000,
    // Bounds the serialized request the driver reads off the socket, so a malformed or runaway
    // batch cannot make it buffer without limit. Ten times the 50,000-char ceiling the design
    // already treats as generous for an MCP tool's RESPONSE (siegelense-tooling.md lines 1610,
    // 2085) — the request side carries several steps' worth of selectors and values plus JSON
    // structure, so it earns more headroom than a single reading does.
    maxRequestBytes: 500_000,
  },
  idle: {
    // Matches the measured prototype's own IDLE_TIMEOUT_MS
    // (packages/web/test/siege-driver/siege-driver.ts:47) and the design's framing of it: "the
    // idle timeout is the only backstop, and it is 900 seconds of three live processes"
    // (siegelense-tooling.md line 1094) — long enough that a session's think-time between
    // batches never trips it, short enough that a forgotten `kill` does not hold a port pair
    // and a browser open indefinitely.
    timeoutMs: 900_000,
  },
  boot: {
    // The interval between successive probes of a lane process's ready path while it boots.
    readyPollMs: 250,
    // A cold Vite pre-bundle of the whole shared surface plus a tsx boot of the API server is
    // the slowest thing here; 180s is generous enough that a loaded machine does not report a
    // boot failure that was only a slow boot.
    defaultTimeoutMs: 180_000,
    // A boot probe that relies on `fetch` either connecting fast or refusing outright carries no
    // per-attempt bound of its own. A driver-managed boot needs an explicit ceiling per attempt
    // so a probe that connects and then hangs cannot wedge the whole readyPollMs cadence behind
    // it. 5s is generous for one HTTP round trip against localhost.
    readyProbeTimeoutMs: 5_000,
    // The throwaway home prefix `lane-boot-broker`'s own USAGE example already assumes
    // (`/tmp/dm-siege-inst_1`) — joined onto `osTmpdirAdapter()` plus the instance id by
    // `locationsInstanceHomePathFindBroker`.
    homePrefix: 'dm-siege-',
  },
  teardown: {
    // SIGTERM, then this long a wait, then SIGKILL to whatever is still standing.
    graceMs: 3_000,
    // The OS signals a driver process reacts to by tearing its own lane down. A bare array
    // literal at the call site is a magic-string-array lint violation, so it lives here instead.
    signals: ['SIGINT', 'SIGTERM'],
  },
  run: {
    // Playwright's own default action timeout for `click`/`fill`/`waitFor`-style calls is
    // 30000ms. Matching it means a step that omits `timeoutMs` behaves exactly as Playwright
    // would out of the box, and the session adapter never has to invent a second number the two
    // could silently disagree on.
    defaultStepTimeoutMs: 30_000,
    // `until`'s own poll interval, for the two forms that poll rather than delegate to a
    // Playwright-owned wait (the console/response buffer scans, the file stat). A buffer read is
    // an in-process array slice and a file probe is one `stat` call, so the cost of the interval
    // is nothing; 100ms is well under the smallest gap a walk can meaningfully observe.
    untilPollMs: 100,
  },
  settle: {
    // Matches `settleWaitLayerAdapter`'s own DEFAULT_QUIET_WINDOW_MS
    // (adapters/playwright/session/settle-wait-layer-adapter.ts) — how long every one of its
    // three signals (network, DOM, animation) must hold still before a wait reports settled: true.
    quietWindowMs: 250,
    // Matches the adapter's own DEFAULT_CEILING_MS — the most one wait spends before giving up
    // and reporting settled: false rather than hanging.
    ceilingMs: 5_000,
    // Matches the adapter's own DEFAULT_POLL_MS — the probe cadence inside one wait.
    pollMs: 50,
    // Matches the adapter's own DEFAULT_POLLER_REPEAT_THRESHOLD. Unlike the three values above,
    // this one belongs at `settleWaitLayerAdapter`'s CONSTRUCTION, not on a `waitForSettle` call —
    // a request shape is classified while requests arrive on the event stream between waits, not
    // during the one wait it would otherwise be read from.
    pollerRepeatThreshold: 3,
  },
} as const;

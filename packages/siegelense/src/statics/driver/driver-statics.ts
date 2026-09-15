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
    // ceiling is the sum of its batch's own step timeouts. `run-ward` and `run-riftcarver`
    // already block through MCP for minutes (siegelense-tooling.md line 104), so this cannot be
    // tight; it exists only to eventually surface a driver that stopped answering entirely
    // mid-batch, rather than leaving the calling MCP tool blocked forever.
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
    // Matches READY_POLL_MS in the measured prototype
    // (packages/web/test/siege-driver/siege-lane.ts:36) — the interval between successive
    // probes of a lane process's ready path while it boots.
    readyPollMs: 250,
    // Matches BOOT_TIMEOUT_MS in the same file (line 35): "a cold Vite pre-bundle of the whole
    // shared surface plus a tsx boot of the API server is the slowest thing here; 180s is
    // generous enough that a loaded machine does not report a boot failure that was only a slow
    // boot."
    defaultTimeoutMs: 180_000,
    // The prototype's own `probeHttp` (siege-lane.ts:156-165) has no per-attempt bound — it
    // relies on `fetch` either connecting fast or refusing outright, which held for a single
    // dev boot. A driver-managed boot needs an explicit ceiling per attempt so a probe that
    // connects and then hangs cannot wedge the whole readyPollMs cadence behind it. 5s is
    // generous for one HTTP round trip against localhost.
    readyProbeTimeoutMs: 5_000,
  },
  teardown: {
    // Matches KILL_GRACE_MS in the measured prototype
    // (packages/web/test/siege-driver/siege-lane.ts:37) — SIGTERM, then this long a wait, then
    // SIGKILL to whatever is still standing.
    graceMs: 3_000,
  },
  run: {
    // Playwright's own default action timeout for `click`/`fill`/`waitFor`-style calls is
    // 30000ms. Matching it means a step that omits `timeoutMs` behaves exactly as Playwright
    // would out of the box, and the session adapter never has to invent a second number the two
    // could silently disagree on.
    defaultStepTimeoutMs: 30_000,
  },
} as const;

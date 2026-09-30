/**
 * PURPOSE: Holds the ONE lane a driver process owns for its whole life, plus everything about that
 * life that outlives a single run: the two clocks (the per-run counter `run` requests mint off, and
 * the last-activity timestamp the idle-deadline recursion reads), the IDLE CEILING this lane reaps
 * itself against (a caller's `--idle-timeout-ms` override at `start` time, or
 * `driverStatics.idle.timeoutMs` when none was given), the FLUSH CURSOR marking how far each of the
 * console/network/websocket buffers has already been written to disk, and the path of the LAST
 * screenshot taken anywhere in the instance's life. The cursor lives here rather than on a run
 * because entries arriving between two runs belong to neither (chunk-03-read-path-and-perception.md
 * §3.A); the last-shot path lives here for the same reason `pixelChange` compares a fresh capture
 * against whichever run took the previous one, including a prior run entirely (§3.B).
 * `driverHandleRequestBroker` cannot read this directly — `state/` sits outside a broker's allowed
 * imports — so the responder that owns the socket's request loop reads these accessors fresh per
 * request and hands the values down explicitly.
 *
 * USAGE:
 * driverSessionState.set({ lane });
 * driverSessionState.lane();
 * // Returns the LaneSession set above, or null before boot / after a kill
 * driverSessionState.idleTimeoutMs();
 * // Returns driverStatics.idle.timeoutMs — `set` was called with no override
 *
 * driverSessionState.set({ lane, idleTimeoutMs: TimeoutMsStub({ value: 1_800_000 }) });
 * driverSessionState.idleTimeoutMs();
 * // Returns 1_800_000 — the caller's raised ceiling, until the next `set` or `clear`
 *
 * driverSessionState.advanceFlushCursor({ consoleLines, networkLines, websocketLines });
 * driverSessionState.flushCursor();
 * // Returns { consoleLines, networkLines, websocketLines } as of the last advance, zero before any
 *
 * driverSessionState.setLastShotPath({ path });
 * driverSessionState.lastShotPath();
 * // Returns the path set above, or null before the instance's first capture
 */

import { timeoutMsContract, siegeRunContract } from '@dungeonmaster/shared/contracts';
import type { TimeoutMs, SiegeRun } from '@dungeonmaster/shared/contracts';

import type { LaneSession } from '../../contracts/lane-session/lane-session-contract';
import { driverStatics } from '../../statics/driver/driver-statics';
import { instanceLifecycleStatics } from '../../statics/instance-lifecycle/instance-lifecycle-statics';

let currentLane: LaneSession | null = null;
let runCounter = 0;
let lastActivityAtMs: number = 0;
let idleTimeoutMsValue: TimeoutMs = timeoutMsContract.parse(driverStatics.idle.timeoutMs);
let flushCursorConsoleLines: number = 0;
let flushCursorNetworkLines: number = 0;
let flushCursorWebsocketLines: number = 0;
let lastShotPathValue: string | null = null;

export const driverSessionState = {
  set: ({ lane, idleTimeoutMs }: { lane: LaneSession; idleTimeoutMs?: TimeoutMs }): void => {
    currentLane = lane;
    lastActivityAtMs = Date.now();
    idleTimeoutMsValue = idleTimeoutMs ?? timeoutMsContract.parse(driverStatics.idle.timeoutMs);
  },

  lane: (): LaneSession | null => currentLane,

  idleTimeoutMs: (): TimeoutMs => idleTimeoutMsValue,

  nextRunId: (): SiegeRun['id'] => {
    runCounter += 1;
    return siegeRunContract.shape.id.parse(`${instanceLifecycleStatics.ids.runPrefix}${String(runCounter)}`);
  },

  touch: (): void => {
    lastActivityAtMs = Date.now();
  },

  lastActivityMs: (): number => lastActivityAtMs,

  flushCursor: (): {
    consoleLines: number;
    networkLines: number;
    websocketLines: number;
  } => ({
    consoleLines: flushCursorConsoleLines,
    networkLines: flushCursorNetworkLines,
    websocketLines: flushCursorWebsocketLines,
  }),

  advanceFlushCursor: ({
    consoleLines,
    networkLines,
    websocketLines,
  }: {
    consoleLines: number;
    networkLines: number;
    websocketLines: number;
  }): void => {
    flushCursorConsoleLines = consoleLines;
    flushCursorNetworkLines = networkLines;
    flushCursorWebsocketLines = websocketLines;
  },

  lastShotPath: (): string | null => lastShotPathValue,

  setLastShotPath: ({ path }: { path: string }): void => {
    lastShotPathValue = path;
  },

  clear: (): void => {
    currentLane = null;
    runCounter = 0;
    lastActivityAtMs = 0;
    idleTimeoutMsValue = timeoutMsContract.parse(driverStatics.idle.timeoutMs);
    flushCursorConsoleLines = 0;
    flushCursorNetworkLines = 0;
    flushCursorWebsocketLines = 0;
    lastShotPathValue = null;
  },
} as const;

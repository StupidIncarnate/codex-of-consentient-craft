/**
 * PURPOSE: Holds the ONE lane a driver process owns for its whole life, plus everything about that
 * life that outlives a single run: the two clocks (the per-run counter `run` requests mint off, and
 * the last-activity timestamp the idle-deadline recursion reads), the FLUSH CURSOR marking how far
 * each of the console/network/websocket buffers has already been written to disk, and the path of
 * the LAST screenshot taken anywhere in the instance's life. The cursor lives here rather than on a
 * run because entries arriving between two runs belong to neither (chunk-03-read-path-and-perception
 * .md §3.A); the last-shot path lives here for the same reason `pixelChange` compares a fresh capture
 * against whichever run took the previous one, including a prior run entirely (§3.B).
 * `driverHandleRequestBroker` cannot read this directly — `state/` sits outside a broker's allowed
 * imports — so the responder that owns the socket's request loop reads these accessors fresh per
 * request and hands the values down explicitly.
 *
 * USAGE:
 * driverSessionState.set({ lane });
 * driverSessionState.lane();
 * // Returns the LaneSession set above, or null before boot / after a kill
 *
 * driverSessionState.advanceFlushCursor({ consoleLines, networkLines, websocketLines });
 * driverSessionState.flushCursor();
 * // Returns { consoleLines, networkLines, websocketLines } as of the last advance, zero before any
 *
 * driverSessionState.setLastShotPath({ path });
 * driverSessionState.lastShotPath();
 * // Returns the path set above, or null before the instance's first capture
 */

import { epochMsContract } from '../../contracts/epoch-ms/epoch-ms-contract';
import type { EpochMs } from '../../contracts/epoch-ms/epoch-ms-contract';
import type { LaneSession } from '../../contracts/lane-session/lane-session-contract';
import { readingCountContract } from '../../contracts/reading-count/reading-count-contract';
import type { ReadingCount } from '../../contracts/reading-count/reading-count-contract';
import { runIdContract } from '../../contracts/run-id/run-id-contract';
import type { RunId } from '../../contracts/run-id/run-id-contract';
import { instanceLifecycleStatics } from '../../statics/instance-lifecycle/instance-lifecycle-statics';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

let currentLane: LaneSession | null = null;
let runCounter = 0;
let lastActivityAtMs: EpochMs = epochMsContract.parse(0);
let flushCursorConsoleLines: ReadingCount = readingCountContract.parse(0);
let flushCursorNetworkLines: ReadingCount = readingCountContract.parse(0);
let flushCursorWebsocketLines: ReadingCount = readingCountContract.parse(0);
let lastShotPathValue: AbsoluteFilePath | null = null;

export const driverSessionState = {
  set: ({ lane }: { lane: LaneSession }): void => {
    currentLane = lane;
    lastActivityAtMs = epochMsContract.parse(Date.now());
  },

  lane: (): LaneSession | null => currentLane,

  nextRunId: (): RunId => {
    runCounter += 1;
    return runIdContract.parse(`${instanceLifecycleStatics.ids.runPrefix}${String(runCounter)}`);
  },

  touch: (): void => {
    lastActivityAtMs = epochMsContract.parse(Date.now());
  },

  lastActivityMs: (): EpochMs => lastActivityAtMs,

  flushCursor: (): {
    consoleLines: ReadingCount;
    networkLines: ReadingCount;
    websocketLines: ReadingCount;
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
    consoleLines: ReadingCount;
    networkLines: ReadingCount;
    websocketLines: ReadingCount;
  }): void => {
    flushCursorConsoleLines = consoleLines;
    flushCursorNetworkLines = networkLines;
    flushCursorWebsocketLines = websocketLines;
  },

  lastShotPath: (): AbsoluteFilePath | null => lastShotPathValue,

  setLastShotPath: ({ path }: { path: AbsoluteFilePath }): void => {
    lastShotPathValue = path;
  },

  clear: (): void => {
    currentLane = null;
    runCounter = 0;
    lastActivityAtMs = epochMsContract.parse(0);
    flushCursorConsoleLines = readingCountContract.parse(0);
    flushCursorNetworkLines = readingCountContract.parse(0);
    flushCursorWebsocketLines = readingCountContract.parse(0);
    lastShotPathValue = null;
  },
} as const;

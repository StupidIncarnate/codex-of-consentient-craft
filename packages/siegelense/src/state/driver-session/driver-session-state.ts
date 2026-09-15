/**
 * PURPOSE: Holds the ONE lane a driver process owns for its whole life, plus the two clocks that
 * govern it — the per-run counter `run` requests mint off, and the last-activity timestamp the
 * idle-deadline recursion reads. One driver process serves exactly one instance (siegelense-tooling.md
 * line 1627: "one driver per instance"), so this is a SINGLETON, not a keyed cache. `driverHandleRequestBroker`
 * cannot read this directly — `state/` sits outside a broker's allowed imports — so the responder that owns
 * the socket's request loop reads `lane()` fresh per request and hands it down explicitly.
 *
 * USAGE:
 * driverSessionState.set({ lane });
 * driverSessionState.lane();
 * // Returns the LaneSession set above, or null before boot / after a kill
 *
 * driverSessionState.nextRunId();
 * // Returns 'run_1' on the first call, 'run_2' on the second, for the life of this process
 */

import { epochMsContract } from '../../contracts/epoch-ms/epoch-ms-contract';
import type { EpochMs } from '../../contracts/epoch-ms/epoch-ms-contract';
import type { LaneSession } from '../../contracts/lane-session/lane-session-contract';
import { runIdContract } from '../../contracts/run-id/run-id-contract';
import type { RunId } from '../../contracts/run-id/run-id-contract';
import { instanceLifecycleStatics } from '../../statics/instance-lifecycle/instance-lifecycle-statics';

let currentLane: LaneSession | null = null;
let runCounter = 0;
let lastActivityAtMs: EpochMs = epochMsContract.parse(0);

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

  clear: (): void => {
    currentLane = null;
    runCounter = 0;
    lastActivityAtMs = epochMsContract.parse(0);
  },
} as const;

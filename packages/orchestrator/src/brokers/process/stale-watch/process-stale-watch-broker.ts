/**
 * PURPOSE: Periodic watchdog that scans registered processes and reports any whose stdout has been silent past a threshold. Caller wires `getProcessIds` + `getActivity` to `orchestrationProcessesState` and `onStale` to a log emitter; the broker owns the tick lifecycle via `timerSetIntervalAdapter` and the OS-level liveness probe via `procCheckAliveAdapter`.
 *
 * USAGE:
 * const stop = processStaleWatchBroker({
 *   getProcessIds: () => orchestrationProcessesState.getAll(),
 *   getActivity: ({ processId }) => orchestrationProcessesState.getActivity({ processId }),
 *   onStale: ({ processId, silentForMs, pid, alive }) => {
 *     process.stderr.write(`[dev] ⚠ stale  proc:${processId}  silentFor:${Math.round(silentForMs / 1000)}s  pid:${pid ?? '?'} alive=${alive ?? '?'}\n`);
 *   },
 * });
 * // Returns { stop } — call stop() to tear down (test cleanup or process shutdown).
 */

import type { ProcessId } from '@dungeonmaster/shared/contracts';

import { procCheckAliveAdapter } from '../../../adapters/proc/check-alive/proc-check-alive-adapter';
import { timerSetIntervalAdapter } from '../../../adapters/timer/set-interval/timer-set-interval-adapter';
import type { ProcessActivity } from '../../../contracts/process-activity/process-activity-contract';
import type { ProcessPid } from '../../../contracts/process-pid/process-pid-contract';
import { processStaleThresholdStatics } from '../../../statics/process-stale-threshold/process-stale-threshold-statics';

export const processStaleWatchBroker = ({
  getProcessIds,
  getActivity,
  onStale,
  intervalMs = processStaleThresholdStatics.tickIntervalMs,
  thresholdMs = processStaleThresholdStatics.thresholdMs,
}: {
  getProcessIds: () => ProcessId[];
  getActivity: (params: { processId: ProcessId }) => ProcessActivity | undefined;
  onStale: (params: {
    processId: ProcessId;
    silentForMs: number;
    pid: ProcessPid | undefined;
    alive: boolean | undefined;
  }) => void;
  intervalMs?: number;
  thresholdMs?: number;
}): { stop: () => void } =>
  timerSetIntervalAdapter({
    intervalMs,
    callback: () => {
      const now = Date.now();
      for (const processId of getProcessIds()) {
        const activity = getActivity({ processId });
        if (activity === undefined) continue;
        const silentForMs = now - activity.lastActivityAt.getTime();
        if (silentForMs < thresholdMs) continue;
        const alive =
          activity.osPid === undefined ? undefined : procCheckAliveAdapter({ pid: activity.osPid });
        onStale({ processId, silentForMs, pid: activity.osPid, alive });
      }
    },
  });

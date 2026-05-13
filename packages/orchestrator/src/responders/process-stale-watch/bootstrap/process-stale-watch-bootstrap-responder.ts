/**
 * PURPOSE: Boots the stale-process watchdog on orchestrator startup. Wires `processStaleWatchBroker` against `orchestrationProcessesState.getAll` + `getActivity`, and routes warning lines to stderr with the `[dev]` prefix the rest of the orchestration logs use. Idempotent — repeated calls reuse the existing handle stored in `processStaleWatchBootstrapState`.
 *
 * USAGE:
 * ProcessStaleWatchBootstrapResponder();
 * // Returns { success: true } once the watchdog is registered. Subsequent calls are no-ops.
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { processStaleWatchBroker } from '../../../brokers/process/stale-watch/process-stale-watch-broker';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { processStaleWatchBootstrapState } from '../../../state/process-stale-watch-bootstrap/process-stale-watch-bootstrap-state';

const MS_PER_SEC = 1000;

export const ProcessStaleWatchBootstrapResponder = (): AdapterResult => {
  if (processStaleWatchBootstrapState.getHandle() !== null) {
    return { success: true as const };
  }

  const handle = processStaleWatchBroker({
    getProcessIds: () => orchestrationProcessesState.getAll(),
    getActivity: ({ processId }) => orchestrationProcessesState.getActivity({ processId }),
    onStale: ({ processId, silentForMs, pid, alive }) => {
      const silentSec = Math.round(silentForMs / MS_PER_SEC);
      const pidPart =
        pid === undefined
          ? 'pid:?'
          : `pid:${pid} alive=${alive === undefined ? '?' : String(alive)}`;
      process.stderr.write(
        `[dev] WARN stale  proc:${processId}  silentFor:${silentSec}s  ${pidPart}\n`,
      );
    },
  });

  processStaleWatchBootstrapState.setHandle({ handle });
  return { success: true as const };
};

/**
 * PURPOSE: Stops every process group of a live lane so a `reset level: 'instance'` restart can
 * respawn onto the same ports — SIGTERM each live group, wait up to `driverStatics.teardown.graceMs`
 * for them to exit, SIGKILL the survivors, then wait up to `driverStatics.teardown.killWaitMs` for
 * those to leave the process table. A group already gone gets no signal at all, and liveness is
 * re-checked right before SIGKILL, because an exited group's pgid can be recycled to an unrelated
 * process. Reach for this over `laneTeardownBroker` when the lane lives on afterwards: it closes no
 * fd, removes no home and touches no browser. A group still alive after SIGKILL throws, since
 * respawning beside it would collide on its port.
 *
 * USAGE:
 * await processesStopLayerBroker({ pgids: [1001] });
 * // Resolves { success: true } once every group has exited; throws naming any group that did not
 */

import { now } from '#gateway/node/Date';

import { processIsAliveBroker } from '../../process/is-alive/process-is-alive-broker';
import { processKillGroupBroker } from '../../process/kill-group/process-kill-group-broker';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { processesExitWaitLayerBroker } from './processes-exit-wait-layer-broker';

export const processesStopLayerBroker = async ({
  pgids,
}: {
  pgids: readonly number[];
}): Promise<void> => {
  const liveTargets = pgids.filter((pgid) => processIsAliveBroker({ pgid }));

  liveTargets.forEach((pgid) => {
    processKillGroupBroker({ pgid, signal: 'SIGTERM' });
  });

  const afterTerm = await processesExitWaitLayerBroker({
    pgids: liveTargets,
    deadlineMs: now() + driverStatics.teardown.graceMs,
  });

  afterTerm.forEach((pgid) => {
    if (processIsAliveBroker({ pgid })) {
      processKillGroupBroker({ pgid, signal: 'SIGKILL' });
    }
  });

  const afterKill = await processesExitWaitLayerBroker({
    pgids: afterTerm,
    deadlineMs: now() + driverStatics.teardown.killWaitMs,
  });

  if (afterKill.length > 0) {
    throw new Error(
      `Stopping lane processes for an instance reset failed: process groups ${afterKill
        .map(String)
        .join(', ')} were still alive ${String(
        driverStatics.teardown.killWaitMs,
      )}ms after SIGKILL, so nothing was respawned onto ports they may still hold.`,
    );
  }
};

/**
 * PURPOSE: Polls a set of process GROUPS until every one has left the process table or `deadlineMs`
 * passes, and answers with whichever are still alive — recursion with an early return, never
 * `while (true)`. A group is gone only once every process in it has exited, which is the moment the
 * listener it held closes its port, so an empty answer is what lets a `reset level: 'instance'`
 * restart respawn onto the SAME ports. Reach for this over `laneTeardownBroker`'s flat grace sleep
 * when the caller wants to move on the instant the groups are gone.
 *
 * USAGE:
 * await processesExitWaitLayerBroker({ pgids: [ProcessGroupIdStub()], deadlineMs: Date.now() + 3_000 });
 * // Returns [] once every group has exited, or the groups still alive when the deadline passed
 */

import { asyncDelayAdapter } from '../../../adapters/async/delay/async-delay-adapter';
import { processIsAliveAdapter } from '../../../adapters/process/is-alive/process-is-alive-adapter';
import type { ProcessGroupId } from '../../../contracts/process-group-id/process-group-id-contract';
import { driverStatics } from '../../../statics/driver/driver-statics';

export const processesExitWaitLayerBroker = async ({
  pgids,
  deadlineMs,
}: {
  pgids: readonly ProcessGroupId[];
  deadlineMs: number;
}): Promise<readonly ProcessGroupId[]> => {
  const survivors = pgids.filter((pgid) => processIsAliveAdapter({ pgid }));

  if (survivors.length === 0 || Date.now() >= deadlineMs) {
    return survivors;
  }

  await asyncDelayAdapter({ ms: driverStatics.teardown.exitPollMs });

  return processesExitWaitLayerBroker({ pgids: survivors, deadlineMs });
};

/**
 * PURPOSE: Polls a set of process GROUPS until every one has left the process table or `deadlineMs`
 * passes, and answers with whichever are still alive — recursion with an early return, never
 * `while (true)`. A group is gone only once every process in it has exited, which is the moment the
 * listener it held closes its port, so an empty answer is what lets a `reset level: 'instance'`
 * restart respawn onto the SAME ports. Reach for this over `laneTeardownBroker`'s flat grace sleep
 * when the caller wants to move on the instant the groups are gone.
 *
 * USAGE:
 * await processesExitWaitLayerBroker({ pgids: [12345], deadlineMs: Date.now() + 3_000 });
 * // Returns [] once every group has exited, or the groups still alive when the deadline passed
 */

import { now } from '#gateway/node/Date';
import { setTimeout } from '#gateway/node/setTimeout';

import { processIsAliveBroker } from '../../process/is-alive/process-is-alive-broker';
import { driverStatics } from '../../../statics/driver/driver-statics';

export const processesExitWaitLayerBroker = async ({
  pgids,
  deadlineMs,
}: {
  pgids: readonly number[];
  deadlineMs: number;
}): Promise<readonly number[]> => {
  const survivors = pgids.filter((pgid) => processIsAliveBroker({ pgid }));

  if (survivors.length === 0 || now() >= deadlineMs) {
    return survivors;
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, driverStatics.teardown.exitPollMs);
  });

  return processesExitWaitLayerBroker({ pgids: survivors, deadlineMs });
};

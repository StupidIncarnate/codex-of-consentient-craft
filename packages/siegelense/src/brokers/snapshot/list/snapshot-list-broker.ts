/**
 * PURPOSE: `snapshots` itself — the points `reset level: 'state'` can return to for one instance
 * (siegelense-tooling.md line 2469), read off DISK with no driver socket involved, so it answers for
 * an instance nobody is holding open ("Only `start`, `run` and `kill` need a live instance", line
 * 2275). The home path is derived from the instance id alone, which is what makes that possible.
 *
 * `instanceState` rides on the answer and is load-bearing rather than decorative: an empty list means
 * "captured nothing yet" against `alive` and "the throwaway home is gone and took the restore points
 * with it" against `killed`, and those are the same empty array without it. An unrecognised id is a
 * REAL answer with `unknown` and no rows rather than a throw, matching `resultsReadBroker` (line
 * 2319: "`pruned` and `unknown` are real answers, not empty results") — `compareReadBroker` throws
 * instead only because it has to name two runs it cannot find.
 *
 * USAGE:
 * await snapshotListBroker({ instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }) });
 * // Returns a SnapshotsAnswer — the instance's state and its current restore points, oldest first
 */

import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import { snapshotsAnswerContract } from '../../../contracts/snapshots-answer/snapshots-answer-contract';
import type { SnapshotsAnswer } from '../../../contracts/snapshots-answer/snapshots-answer-contract';
import { snapshotIndexCollapseTransformer } from '../../../transformers/snapshot-index-collapse/snapshot-index-collapse-transformer';
import { instanceStateResolveBroker } from '../../instance/state-resolve/instance-state-resolve-broker';
import { locationsInstanceHomePathFindBroker } from '../../locations/instance-home-path-find/locations-instance-home-path-find-broker';
import { snapshotIndexReadBroker } from '../index-read/snapshot-index-read-broker';

export const snapshotListBroker = async ({
  instanceId,
}: {
  instanceId: InstanceId;
}): Promise<SnapshotsAnswer> => {
  const { state } = await instanceStateResolveBroker({ instanceId });

  const homePath = locationsInstanceHomePathFindBroker({ instanceId });
  const records = await snapshotIndexReadBroker({ homePath });

  return snapshotsAnswerContract.parse({
    instanceId,
    instanceState: state,
    snapshots: snapshotIndexCollapseTransformer({ records }),
  });
};

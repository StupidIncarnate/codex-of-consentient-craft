/**
 * PURPOSE: Drives the `snapshot` step verb — captures a named manual restore point on disk
 * in the lane's throwaway home directory (`lane.homePath`) using `snapshotCaptureBroker`,
 * and formats the reading using `snapshotReadingRenderTransformer`.
 * Reach for this over automatic run start/end snapshots when an attack or test batch needs an explicit,
 * named checkpoint on disk that `reset` can rewind to. Runs identically on browser and browserless lanes
 * because snapshot capture touches disk state and touches no screen.
 *
 * USAGE:
 * await stepSnapshotBroker({ lane, as: SnapshotNameStub({ value: 'clean' }) });
 * // Captures snapshot "clean" and returns 'snapshot "clean" recorded' as ContentText
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import type { SnapshotName } from '../../../contracts/snapshot-name/snapshot-name-contract';
import { snapshotReadingRenderTransformer } from '../../../transformers/snapshot-reading-render/snapshot-reading-render-transformer';
import { snapshotCaptureBroker } from '../../snapshot/capture/snapshot-capture-broker';

export const stepSnapshotBroker = async ({
  lane,
  as,
}: {
  lane: LaneSession;
  as: SnapshotName;
}): Promise<ContentText> => {
  await snapshotCaptureBroker({
    homePath: lane.homePath,
    name: as,
    manual: true,
  });

  return snapshotReadingRenderTransformer({ name: as });
};

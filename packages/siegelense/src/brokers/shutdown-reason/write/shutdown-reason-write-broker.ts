/**
 * PURPOSE: Writes `shutdown-reason.json` beside an already-resolved evidence directory the moment
 * the driver tears its OWN lane down on purpose — the idle timeout firing — BEFORE teardown runs, so
 * the fact survives the process exiting with it. Mirrors `bootFailureMarkerWriteBroker`'s shape one
 * stage later in the lifecycle: that one records why a BOOT never finished, this one records why a
 * SERVING driver stopped on its own terms. Takes `evidencePath` directly rather than
 * `{instanceId, guildId}` because `DriverServeLayerResponder` has already resolved it one call
 * earlier — re-deriving it here would be a second, redundant
 * `locationsInstanceEvidencePathFindBroker` call for no new information.
 *
 * USAGE:
 * await shutdownReasonWriteBroker({
 *   evidencePath: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_1',
 *   reason: 'reaped by idle timeout after 900s with no run received',
 * });
 * // Writes shutdown-reason.json under that directory and returns the written ShutdownReason
 */

import { join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { writeFile } from '#gateway/node/fs__promises';
import { shutdownReasonContract } from '../../../contracts/shutdown-reason/shutdown-reason-contract';
import type { ShutdownReason } from '../../../contracts/shutdown-reason/shutdown-reason-contract';

export const shutdownReasonWriteBroker = async ({
  evidencePath,
  reason,
}: {
  evidencePath: string;
  reason: string;
}): Promise<ShutdownReason> => {
  const markerPath = join(evidencePath, locationsStatics.siegelense.shutdownReason);

  const marker = shutdownReasonContract.parse({
    reason,
    atMs: Date.now(),
  });

  const contents = `${JSON.stringify(marker)}\n`;

  await writeFile(markerPath, contents);

  return marker;
};

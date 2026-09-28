/**
 * PURPOSE: Reads one instance's `boot-failure.json` back off disk, if the driver ever wrote one —
 * the file `instanceStartBootPollLayerBroker` checks on every failed ping so a dead driver reads
 * differently from a slow one. `null` covers ONLY the file's absence (ENOENT), the ordinary case
 * while a boot is still in flight or already succeeded; any other read failure propagates, matching
 * `heartbeatReadBroker`'s own ENOENT-only contract. Takes `evidencePath` directly — the poll broker
 * already has it, computed once in `instanceStartBroker` before the poll loop starts.
 *
 * USAGE:
 * await bootFailureMarkerReadBroker({
 *   evidencePath: AbsoluteFilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_1' }),
 * });
 * // Returns the parsed BootFailureMarker, or null if boot-failure.json does not exist
 */

import { readFileIfExists } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { bootFailureMarkerContract } from '../../../contracts/boot-failure-marker/boot-failure-marker-contract';
import type { BootFailureMarker } from '../../../contracts/boot-failure-marker/boot-failure-marker-contract';

export const bootFailureMarkerReadBroker = async ({
  evidencePath,
}: {
  evidencePath: AbsoluteFilePath;
}): Promise<BootFailureMarker | null> => {
  const markerPath = absoluteFilePathContract.parse(
    join(evidencePath, locationsStatics.siegelense.bootFailure),
  );

  const content = await readFileIfExists(markerPath);

  if (content === null) {
    return null;
  }

  return bootFailureMarkerContract.parse(JSON.parse(content));
};

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
 *   evidencePath: AbsoluteFilePathStub({ value: '/repo/.siegelense/unowned/instances/inst_1' }),
 * });
 * // Returns the parsed BootFailureMarker, or null if boot-failure.json does not exist
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { errorIsNativeErrorAdapter } from '../../../adapters/error/is-native-error/error-is-native-error-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { bootFailureMarkerContract } from '../../../contracts/boot-failure-marker/boot-failure-marker-contract';
import type { BootFailureMarker } from '../../../contracts/boot-failure-marker/boot-failure-marker-contract';

export const bootFailureMarkerReadBroker = async ({
  evidencePath,
}: {
  evidencePath: AbsoluteFilePath;
}): Promise<BootFailureMarker | null> => {
  const markerPath = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [evidencePath, locationsStatics.siegelense.bootFailure] }),
  );

  const content = await fsReadFileAdapter({ filePath: markerPath }).catch((error: unknown) => {
    if (
      error !== null &&
      typeof error === 'object' &&
      errorIsNativeErrorAdapter({ value: error }) &&
      'cause' in error &&
      error.cause !== null &&
      typeof error.cause === 'object' &&
      errorIsNativeErrorAdapter({ value: error.cause }) &&
      'code' in error.cause &&
      error.cause.code === 'ENOENT'
    ) {
      return null;
    }
    throw error;
  });

  if (content === null) {
    return null;
  }

  return bootFailureMarkerContract.parse(JSON.parse(content));
};

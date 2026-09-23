/**
 * PURPOSE: Reads one instance's `shutdown-reason.json` back off disk, if the driver ever wrote one on
 * its way out — `instanceEntryLayerBroker`'s own read, for a NOT-alive instance, so `likelyCause` can
 * state the recorded reason instead of inventing an RSS/OOM narrative for a death the tool scheduled
 * itself. `null` covers ONLY the file's absence (ENOENT) — the ordinary case for an instance a caller
 * killed, or one that crashed before it ever wrote this marker; any other read failure propagates,
 * matching `bootFailureMarkerReadBroker`'s own ENOENT-only contract. Takes `evidencePath` directly —
 * every call site already has it resolved.
 *
 * USAGE:
 * await shutdownReasonReadBroker({
 *   evidencePath: AbsoluteFilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_1' }),
 * });
 * // Returns the parsed ShutdownReason, or null if shutdown-reason.json does not exist
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { errorIsNativeErrorAdapter } from '../../../adapters/error/is-native-error/error-is-native-error-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { shutdownReasonContract } from '../../../contracts/shutdown-reason/shutdown-reason-contract';
import type { ShutdownReason } from '../../../contracts/shutdown-reason/shutdown-reason-contract';

export const shutdownReasonReadBroker = async ({
  evidencePath,
}: {
  evidencePath: AbsoluteFilePath;
}): Promise<ShutdownReason | null> => {
  const markerPath = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [evidencePath, locationsStatics.siegelense.shutdownReason] }),
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

  return shutdownReasonContract.parse(JSON.parse(content));
};

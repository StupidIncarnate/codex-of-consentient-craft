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

import { join } from '#gateway/node/path';
import { readFileIfExists } from '#gateway/node/fs__promises';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { shutdownReasonContract } from '../../../contracts/shutdown-reason/shutdown-reason-contract';
import type { ShutdownReason } from '../../../contracts/shutdown-reason/shutdown-reason-contract';

export const shutdownReasonReadBroker = async ({
  evidencePath,
}: {
  evidencePath: AbsoluteFilePath;
}): Promise<ShutdownReason | null> => {
  const markerPath = absoluteFilePathContract.parse(
    join(evidencePath, locationsStatics.siegelense.shutdownReason),
  );

  const content = await readFileIfExists(markerPath);

  if (content === null) {
    return null;
  }

  return shutdownReasonContract.parse(JSON.parse(content));
};

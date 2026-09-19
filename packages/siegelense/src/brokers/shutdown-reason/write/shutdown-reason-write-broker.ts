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
 *   evidencePath: AbsoluteFilePathStub({ value: '/repo/.siegelense/unowned/instances/inst_1' }),
 *   reason: ContentTextStub({ value: 'reaped by idle timeout after 900s with no run received' }),
 * });
 * // Writes shutdown-reason.json under that directory and returns the written ShutdownReason
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, fileContentsContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { shutdownReasonContract } from '../../../contracts/shutdown-reason/shutdown-reason-contract';
import type { ShutdownReason } from '../../../contracts/shutdown-reason/shutdown-reason-contract';

export const shutdownReasonWriteBroker = async ({
  evidencePath,
  reason,
}: {
  evidencePath: AbsoluteFilePath;
  reason: ContentText;
}): Promise<ShutdownReason> => {
  const markerPath = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [evidencePath, locationsStatics.siegelense.shutdownReason] }),
  );

  const marker = shutdownReasonContract.parse({
    reason,
    atMs: epochMsContract.parse(Date.now()),
  });

  const contents = fileContentsContract.parse(`${JSON.stringify(marker)}\n`);

  await fsWriteFileAdapter({ filePath: markerPath, contents });

  return marker;
};

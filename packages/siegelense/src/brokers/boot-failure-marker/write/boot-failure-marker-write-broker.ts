/**
 * PURPOSE: Writes `boot-failure.json` beside an already-resolved evidence directory the moment the
 * driver process's own boot throws — BEFORE it exits — so `instanceStartBootPollLayerBroker`, polling
 * from a different process entirely, has a machine-readable place to learn WHY a refused socket
 * connection means "the driver is dead" rather than "the driver is still launching". Takes
 * `evidencePath` directly rather than `{instanceId, guildId}` because every call site
 * (`SiegelenseDriverResponder`) has already resolved it one step earlier — re-deriving it here would
 * be a second, redundant `locationsInstanceEvidencePathFindBroker` call for no new information.
 *
 * USAGE:
 * await bootFailureMarkerWriteBroker({
 *   evidencePath: AbsoluteFilePathStub({ value: '/repo/.siegelense/unowned/instances/inst_1' }),
 *   message: ContentTextStub({ value: 'CLAUDE_CLI_PATH is required' }),
 * });
 * // Writes boot-failure.json under that directory and returns the written BootFailureMarker
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, fileContentsContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { bootFailureMarkerContract } from '../../../contracts/boot-failure-marker/boot-failure-marker-contract';
import type { BootFailureMarker } from '../../../contracts/boot-failure-marker/boot-failure-marker-contract';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';

export const bootFailureMarkerWriteBroker = async ({
  evidencePath,
  message,
}: {
  evidencePath: AbsoluteFilePath;
  message: ContentText;
}): Promise<BootFailureMarker> => {
  const markerPath = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [evidencePath, locationsStatics.siegelense.bootFailure] }),
  );

  const marker = bootFailureMarkerContract.parse({
    message,
    atMs: epochMsContract.parse(Date.now()),
  });

  const contents = fileContentsContract.parse(`${JSON.stringify(marker)}\n`);

  await fsWriteFileAdapter({ filePath: markerPath, contents });

  return marker;
};

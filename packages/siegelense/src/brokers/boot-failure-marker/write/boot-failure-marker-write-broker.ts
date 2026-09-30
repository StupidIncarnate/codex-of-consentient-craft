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
 *   evidencePath: AbsoluteFilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_1' }),
 *   message: ContentTextStub({ value: 'CLAUDE_CLI_PATH is required' }),
 * });
 * // Writes boot-failure.json under that directory and returns the written BootFailureMarker
 */

import { join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { writeFile } from '#gateway/node/fs__promises';
import { bootFailureMarkerContract } from '../../../contracts/boot-failure-marker/boot-failure-marker-contract';
import type { BootFailureMarker } from '../../../contracts/boot-failure-marker/boot-failure-marker-contract';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';

export const bootFailureMarkerWriteBroker = async ({
  evidencePath,
  message,
}: {
  evidencePath: string;
  message: string;
}): Promise<BootFailureMarker> => {
  const markerPath = join(evidencePath, locationsStatics.siegelense.bootFailure);

  const marker = bootFailureMarkerContract.parse({
    message,
    atMs: epochMsContract.parse(Date.now()),
  });

  const contents = `${JSON.stringify(marker)}\n`;

  await writeFile(markerPath, contents);

  return marker;
};

/**
 * PURPOSE: Resolves the absolute path to a ward run-result JSON file inside a workspace's local .ward directory
 *
 * USAGE:
 * locationsWardLocalRunPathFindBroker({
 *   rootPath: '/repo',
 *   runId: WardRunIdStub({ value: '1739625600000-a3f1' }),
 * });
 * // Returns AbsoluteFilePath '/repo/.ward/run-1739625600000-a3f1.json'
 */

import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import type { WardQueueResponse } from '../../../contracts/ward-queue-response/ward-queue-response-contract';

export const locationsWardLocalRunPathFindBroker = ({
  rootPath,
  runId,
}: {
  rootPath: string;
  runId: WardQueueResponse['runId'];
}): string => {
  const joined = join(rootPath, locationsStatics.repoRoot.wardLocalDir, `run-${runId}.json`);

  return joined;
};

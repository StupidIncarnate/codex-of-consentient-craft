/**
 * PURPOSE: Resolves the absolute path to a ward run-result JSON file inside a workspace's local .ward directory
 *
 * USAGE:
 * locationsWardLocalRunPathFindBroker({
 *   rootPath: AbsoluteFilePathStub({ value: '/repo' }),
 *   runId: WardRunIdStub({ value: '1739625600000-a3f1' }),
 * });
 * // Returns AbsoluteFilePath '/repo/.ward/run-1739625600000-a3f1.json'
 */

import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { WardQueueResponse } from '../../../contracts/ward-queue-response/ward-queue-response-contract';

export const locationsWardLocalRunPathFindBroker = ({
  rootPath,
  runId,
}: {
  rootPath: AbsoluteFilePath;
  runId: WardQueueResponse['runId'];
}): AbsoluteFilePath => {
  const joined = join(rootPath, locationsStatics.repoRoot.wardLocalDir, `run-${runId}.json`);

  return absoluteFilePathContract.parse(joined);
};

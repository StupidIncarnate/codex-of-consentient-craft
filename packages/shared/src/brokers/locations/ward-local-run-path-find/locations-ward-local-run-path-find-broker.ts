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

import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { WardRunId } from '../../../contracts/ward-run-id/ward-run-id-contract';

export const locationsWardLocalRunPathFindBroker = ({
  rootPath,
  runId,
}: {
  rootPath: AbsoluteFilePath;
  runId: WardRunId;
}): AbsoluteFilePath => {
  const joined = pathJoinAdapter({
    paths: [rootPath, locationsStatics.repoRoot.wardLocalDir, `run-${runId}.json`],
  });

  return absoluteFilePathContract.parse(joined);
};

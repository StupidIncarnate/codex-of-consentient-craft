/**
 * PURPOSE: Walks up from startPath to find the nearest tsconfig.json
 *
 * USAGE:
 * await locationsTsconfigPathFindBroker({ startPath: FilePathStub({ value: '/project/src/file.ts' }) });
 * // Returns AbsoluteFilePath '/project/tsconfig.json'
 */

import { pathExists } from '#gateway/node/fs__promises';
import { dirname, join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import { ProjectRootNotFoundError } from '../../../errors/project-root-not-found/project-root-not-found-error';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const locationsTsconfigPathFindBroker = async ({
  startPath,
  currentPath,
}: {
  startPath: string;
  currentPath?: string;
}): Promise<AbsoluteFilePath> => {
  const searchPath = currentPath ?? startPath;

  const candidate = join(searchPath, locationsStatics.repoRoot.tsconfig);

  const exists = await pathExists(candidate);
  if (exists) {
    return absoluteFilePathContract.parse(candidate);
  }

  const parentPath = dirname(searchPath);
  if (parentPath === searchPath) {
    throw new ProjectRootNotFoundError({ startPath });
  }

  return locationsTsconfigPathFindBroker({ startPath, currentPath: parentPath });
};

/**
 * PURPOSE: Walks up from startPath to find the nearest tsconfig.json
 *
 * USAGE:
 * await locationsTsconfigPathFindBroker({ startPath: FilePathStub({ value: '/project/src/file.ts' }) });
 * // Returns AbsoluteFilePath '/project/tsconfig.json'
 */

import { fsAccessAdapter } from '../../../adapters/fs/access/fs-access-adapter';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import { ProjectRootNotFoundError } from '../../../errors/project-root-not-found/project-root-not-found-error';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { filePathContract, type FilePath } from '../../../contracts/file-path/file-path-contract';

const R_OK = 4;

export const locationsTsconfigPathFindBroker = async ({
  startPath,
  currentPath,
}: {
  startPath: FilePath;
  currentPath?: FilePath;
}): Promise<AbsoluteFilePath> => {
  const searchPath = currentPath ?? startPath;

  const candidate = pathJoinAdapter({
    paths: [searchPath, locationsStatics.repoRoot.tsconfig],
  });

  try {
    await fsAccessAdapter({ filePath: candidate, mode: R_OK });
    return absoluteFilePathContract.parse(candidate);
  } catch {
    // not here, walk up
  }

  const parentPath = filePathContract.parse(pathDirnameAdapter({ path: searchPath }));
  if (parentPath === searchPath) {
    throw new ProjectRootNotFoundError({ startPath });
  }

  return locationsTsconfigPathFindBroker({ startPath, currentPath: parentPath });
};

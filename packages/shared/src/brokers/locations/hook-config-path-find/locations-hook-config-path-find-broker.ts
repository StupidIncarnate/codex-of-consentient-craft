/**
 * PURPOSE: Walks up from startPath to find the first existing .dungeonmaster-hooks.config.{ts,js,mjs,cjs} file
 *
 * USAGE:
 * await locationsHookConfigPathFindBroker({ startPath: FilePathStub({ value: '/project/src/file.ts' }) });
 * // Returns AbsoluteFilePath '/project/.dungeonmaster-hooks.config.ts' (or .js, .mjs, .cjs — first existing wins)
 */

import { variantWalkLayerBroker } from './variant-walk-layer-broker';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import { ProjectRootNotFoundError } from '../../../errors/project-root-not-found/project-root-not-found-error';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { filePathContract, type FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsHookConfigPathFindBroker = async ({
  startPath,
  currentPath,
}: {
  startPath: FilePath;
  currentPath?: FilePath;
}): Promise<AbsoluteFilePath> => {
  const searchPath = currentPath ?? startPath;

  const matched = await variantWalkLayerBroker({
    searchPath,
    variants: locationsStatics.hooks.configFiles,
  });

  if (matched !== null) {
    return matched;
  }

  const parentPath = filePathContract.parse(pathDirnameAdapter({ path: searchPath }));
  if (parentPath === searchPath) {
    throw new ProjectRootNotFoundError({ startPath });
  }

  return locationsHookConfigPathFindBroker({ startPath, currentPath: parentPath });
};

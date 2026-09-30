/**
 * PURPOSE: Walks up from startPath looking for the first existing eslint.config.{ts,js,mjs,cjs} file
 *
 * USAGE:
 * await locationsEslintConfigPathFindBroker({ startPath: FilePathStub({ value: '/project/src/file.ts' }) });
 * // Returns AbsoluteFilePath '/project/eslint.config.ts' (or .js, .mjs, .cjs — first existing wins)
 */

import { variantWalkLayerBroker } from './variant-walk-layer-broker';
import { dirname } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import { ProjectRootNotFoundError } from '../../../errors/project-root-not-found/project-root-not-found-error';

export const locationsEslintConfigPathFindBroker = async ({
  startPath,
  currentPath,
}: {
  startPath: string;
  currentPath?: string;
}): Promise<string> => {
  const searchPath = currentPath ?? startPath;

  const matched = await variantWalkLayerBroker({
    searchPath,
    variants: locationsStatics.repoRoot.eslintConfig,
  });

  if (matched !== null) {
    return matched;
  }

  const parentPath = dirname(searchPath);
  if (parentPath === searchPath) {
    throw new ProjectRootNotFoundError({ startPath });
  }

  return locationsEslintConfigPathFindBroker({ startPath, currentPath: parentPath });
};

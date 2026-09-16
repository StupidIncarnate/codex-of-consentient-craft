/**
 * PURPOSE: Resolves this repo's `siegelense-recipes` package to its compiled entry path, and tells
 * apart the two ways that resolution can fail — the package directory absent (the convention was
 * never adopted here; `dungeonmaster init` is the fix) versus present but its `dist/index.js`
 * absent (adopted but never compiled; a build is the fix). Reach for this before any dynamic
 * import of the recipes package, since a caller that only checks `dist/index.js` cannot tell those
 * two refusals apart and would send an already-scaffolded repo back through `init` for nothing.
 *
 * USAGE:
 * const entryPath = await recipesLocateBroker();
 * // Returns AbsoluteFilePath — '<repoRoot>/packages/siegelense-recipes/dist/index.js'
 */

import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import {
  processCwdAdapter,
  pathJoinAdapter,
  fsExistsSyncAdapter,
} from '@dungeonmaster/shared/adapters';
import { recipesConventionStatics } from '@dungeonmaster/shared/statics';
import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { RecipesPackageMissingError } from '../../../errors/recipes-package-missing/recipes-package-missing-error';
import { RecipesBuildMissingError } from '../../../errors/recipes-build-missing/recipes-build-missing-error';

export const recipesLocateBroker = async (): Promise<AbsoluteFilePath> => {
  const cwdPath = processCwdAdapter();
  const repoRoot = await cwdResolveBroker({ startPath: cwdPath, kind: 'repo-root' });

  const packagePath = pathJoinAdapter({
    paths: [
      repoRoot,
      recipesConventionStatics.package.workspaceDirName,
      recipesConventionStatics.package.dirName,
    ],
  });

  if (!fsExistsSyncAdapter({ filePath: packagePath })) {
    throw new RecipesPackageMissingError({ packagePath });
  }

  const entryPath = pathJoinAdapter({
    paths: [packagePath, recipesConventionStatics.entry.distRelativePath],
  });

  if (!fsExistsSyncAdapter({ filePath: entryPath })) {
    throw new RecipesBuildMissingError({ distPath: entryPath });
  }

  return absoluteFilePathContract.parse(entryPath);
};

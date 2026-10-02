/**
 * PURPOSE: Resolves this repo's `hydration-recipes` package to its compiled entry path, and tells
 * apart the two ways that resolution can fail — the package directory absent (the convention was
 * never adopted here; `dungeonmaster init` is the fix) versus present but its `dist/index.js`
 * absent (adopted but never compiled; a build is the fix). Reach for this before any dynamic
 * import of the recipes package, since a caller that only checks `dist/index.js` cannot tell those
 * two refusals apart and would send an already-scaffolded repo back through `init` for nothing.
 *
 * USAGE:
 * const entryPath = recipesLocateBroker({ repoRoot });
 * // Returns AbsoluteFilePath — '<repoRoot>/packages/hydration-recipes/dist/index.js'
 */

import { existsSync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';
import { recipesConventionStatics } from '@dungeonmaster/shared/statics';

import { RecipesPackageMissingError } from '../../../errors/recipes-package-missing/recipes-package-missing-error';
import { RecipesBuildMissingError } from '../../../errors/recipes-build-missing/recipes-build-missing-error';

export const recipesLocateBroker = ({ repoRoot }: { repoRoot: string }): string => {
  const packagePath = join(
    repoRoot,
    recipesConventionStatics.package.workspaceDirName,
    recipesConventionStatics.package.dirName,
  );

  if (!existsSync(packagePath)) {
    throw new RecipesPackageMissingError({ packagePath });
  }

  const entryPath = join(packagePath, recipesConventionStatics.entry.distRelativePath);

  if (!existsSync(entryPath)) {
    throw new RecipesBuildMissingError({ distPath: entryPath });
  }

  return entryPath;
};

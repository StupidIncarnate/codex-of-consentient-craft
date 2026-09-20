/**
 * PURPOSE: Creates `packages/hydration-recipes/src/` in the target repo when that package is
 * absent, so `packages/hydration-recipes/` exists in every repo siegelense is installed in — a
 * convention nothing creates is a convention half the repos will not have. An EMPTY folder is a
 * real answer where a MISSING one is not: an empty folder says "no recipes yet", an absent folder
 * can only say "something is wrong", and the tool cannot tell "you have written none" from "you
 * have not installed this". An existing package is left completely untouched — the convention
 * travels, the recipes do not.
 *
 * USAGE:
 * const result = await InstallRecipesScaffoldResponder({ context });
 * // Creates packages/hydration-recipes/src/ when the package is absent; an existing package's
 * // contents are neither read nor written
 */

import {
  fsExistsSyncAdapter,
  fsMkdirAdapter,
  pathResolveAdapter,
} from '@dungeonmaster/shared/adapters';
import {
  type InstallContext,
  type InstallResult,
  filePathContract,
  installMessageContract,
  packageNameContract,
} from '@dungeonmaster/shared/contracts';

const PACKAGE_NAME = '@dungeonmaster/siegelense';
const PACKAGES_DIRNAME = 'packages';
const RECIPES_PACKAGE_DIRNAME = 'hydration-recipes';
const SRC_DIRNAME = 'src';

export const InstallRecipesScaffoldResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const recipesPackagePath = pathResolveAdapter({
    paths: [context.targetProjectRoot, PACKAGES_DIRNAME, RECIPES_PACKAGE_DIRNAME],
  });
  const packagePresent = fsExistsSyncAdapter({
    filePath: filePathContract.parse(recipesPackagePath),
  });

  if (packagePresent) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'skipped',
      message: installMessageContract.parse(
        `${PACKAGES_DIRNAME}/${RECIPES_PACKAGE_DIRNAME}/ already present; left untouched`,
      ),
    };
  }

  const recipesSrcPath = pathResolveAdapter({ paths: [recipesPackagePath, SRC_DIRNAME] });
  await fsMkdirAdapter({ filepath: filePathContract.parse(recipesSrcPath) });

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse(
      `Created ${PACKAGES_DIRNAME}/${RECIPES_PACKAGE_DIRNAME}/${SRC_DIRNAME}/`,
    ),
  };
};

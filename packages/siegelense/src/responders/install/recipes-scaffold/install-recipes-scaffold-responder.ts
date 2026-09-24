/**
 * PURPOSE: Creates a complete, buildable `packages/hydration-recipes/` in the target repo when
 * that package is absent — package.json, tsconfig.json, tsconfig.build.json, and a starter
 * src/index.ts exporting the three names `recipesConventionStatics.exports` requires — so
 * `recipesLocateBroker` finds a package `npm run build` can actually act on instead of a bare
 * `src/` folder nothing can compile (`RecipesBuildMissingError` in every fresh consumer repo
 * otherwise). An existing package is left completely untouched — the convention travels, the
 * recipes do not. The scaffolded package.json's scope matches the target repo's OWN workspace
 * packages, detected off its root package.json the same convention `@dungeonmaster/cli`'s own
 * `create-package` uses.
 *
 * USAGE:
 * const result = await InstallRecipesScaffoldResponder({ context });
 * // Creates packages/hydration-recipes/{package.json,tsconfig.json,tsconfig.build.json,
 * // src/index.ts,src/index.test.ts} when the package is absent; an existing package's contents
 * // are neither read nor written
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
  packageJsonContract,
  packageNameContract,
  pathSegmentContract,
} from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { recipesScaffoldFilesTransformer } from '../../../transformers/recipes-scaffold-files/recipes-scaffold-files-transformer';
import { workspaceScopeDetectTransformer } from '../../../transformers/workspace-scope-detect/workspace-scope-detect-transformer';

const PACKAGE_NAME = '@dungeonmaster/siegelense';
const PACKAGES_DIRNAME = 'packages';
const RECIPES_PACKAGE_DIRNAME = 'hydration-recipes';
const SRC_DIRNAME = 'src';
const ROOT_PACKAGE_JSON_FILENAME = 'package.json';

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

  const rootPackageJsonPath = pathResolveAdapter({
    paths: [context.targetProjectRoot, ROOT_PACKAGE_JSON_FILENAME],
  });

  let workspaceScope = pathSegmentContract.parse('');
  if (fsExistsSyncAdapter({ filePath: filePathContract.parse(rootPackageJsonPath) })) {
    const rootPackageJsonContents = await fsReadFileAdapter({ filePath: rootPackageJsonPath });
    const rawRootPackageJson: unknown = JSON.parse(rootPackageJsonContents);
    workspaceScope = workspaceScopeDetectTransformer({
      rootPackageJson: packageJsonContract.parse(rawRootPackageJson),
    });
  }

  const recipesPackageName = packageNameContract.parse(
    workspaceScope === ''
      ? RECIPES_PACKAGE_DIRNAME
      : `${workspaceScope}/${RECIPES_PACKAGE_DIRNAME}`,
  );

  const scaffoldFiles = recipesScaffoldFilesTransformer({ packageName: recipesPackageName });

  await Promise.all(
    scaffoldFiles.map(async (file) =>
      fsWriteFileAdapter({
        filePath: pathResolveAdapter({ paths: [recipesPackagePath, file.relativePath] }),
        contents: file.contents,
      }),
    ),
  );

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse(
      `Created ${PACKAGES_DIRNAME}/${RECIPES_PACKAGE_DIRNAME}/ (package.json, tsconfig.json, tsconfig.build.json, ${SRC_DIRNAME}/index.ts)`,
    ),
  };
};

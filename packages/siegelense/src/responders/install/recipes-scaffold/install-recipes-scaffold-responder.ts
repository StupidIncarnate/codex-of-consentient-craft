/**
 * PURPOSE: Creates a complete, buildable `packages/hydration-recipes/` in the target repo when
 * that package is absent — package.json, tsconfig.json, tsconfig.build.json, and a starter
 * src/index.ts exporting the three names `recipesConventionStatics.exports` requires — so
 * `recipesLocateBroker` finds a package `npm run build` can actually act on instead of a bare
 * `src/` folder nothing can compile (`RecipesBuildMissingError` in every fresh consumer repo
 * otherwise). An existing package is left completely untouched — the convention travels, the
 * recipes do not. The scaffolded package.json's scope matches the target repo's OWN workspace
 * packages, detected off its root package.json's `name` field (falling back to the target
 * directory's basename) through `workspaceScopeFromRootNameTransformer` — the SAME transformer
 * `dungeonmaster init`'s gateway step and `create-package` use, never a scan of root
 * `dependencies`/`devDependencies` (a consumer's own `devDependencies` carry the tool vendor's
 * `@dungeonmaster/*` scope, not the consumer's own). It also writes its own `#gateway/*` `imports`
 * field at scaffold time, through `gatewayImportsFieldTransformer` — the same builder `init`'s
 * gateway step uses for every package ALREADY on disk when that step runs. This package cannot
 * wait for that step to find it: the gateway step scans `packages/*` once, before this responder
 * ever creates this one.
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
  pathBasenameAdapter,
  pathResolveAdapter,
} from '@dungeonmaster/shared/adapters';
import {
  type InstallContext,
  type InstallResult,
  absoluteFilePathContract,
  filePathContract,
  installMessageContract,
  packageJsonContract,
  packageNameContract,
} from '@dungeonmaster/shared/contracts';
import { workspaceScopeFromRootNameTransformer } from '@dungeonmaster/shared/transformers';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { npmInstallAdapter } from '../../../adapters/npm/install/npm-install-adapter';
import { npmRunBuildAdapter } from '../../../adapters/npm/run-build/npm-run-build-adapter';
import { recipesScaffoldFilesTransformer } from '../../../transformers/recipes-scaffold-files/recipes-scaffold-files-transformer';

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

  const rootPackageJsonExists = fsExistsSyncAdapter({
    filePath: filePathContract.parse(rootPackageJsonPath),
  });
  // A fallback (this repo's OWN gateway-setup step names it the same way — install-setup-gateway-
  // responder.ts) is only offered once the root package.json is confirmed to exist: an ABSENT root
  // package.json means `dungeonmaster init`'s gateway step never scaffolded `packages/@gateway/*`
  // scoped either, so there is no existing scope for this package to match, and it stays unscoped —
  // exactly like every other existing package would in that same repo state.
  const workspaceScope = rootPackageJsonExists
    ? workspaceScopeFromRootNameTransformer({
        rootPackageJsonName: packageJsonContract.parse(
          JSON.parse(await fsReadFileAdapter({ filePath: rootPackageJsonPath })),
        ).name,
        fallbackName: pathBasenameAdapter({ path: context.targetProjectRoot }),
      })
    : undefined;

  const recipesPackageName = packageNameContract.parse(
    workspaceScope === undefined
      ? RECIPES_PACKAGE_DIRNAME
      : `${workspaceScope}/${RECIPES_PACKAGE_DIRNAME}`,
  );

  const scaffoldFiles = recipesScaffoldFilesTransformer({
    packageName: recipesPackageName,
    ...(workspaceScope === undefined ? {} : { scope: workspaceScope }),
  });

  await Promise.all(
    scaffoldFiles.map(async (file) =>
      fsWriteFileAdapter({
        filePath: pathResolveAdapter({ paths: [recipesPackagePath, file.relativePath] }),
        contents: file.contents,
      }),
    ),
  );

  const createdMessage = `Created ${PACKAGES_DIRNAME}/${RECIPES_PACKAGE_DIRNAME}/ (package.json, tsconfig.json, tsconfig.build.json, ${SRC_DIRNAME}/index.ts)`;
  const buildCommand = `npm run build --workspace=${recipesPackageName}`;

  // Until `npm install` links the freshly scaffolded workspace and `npm run build` compiles it,
  // `recipesLocateBroker` throws `RecipesBuildMissingError` on every `siegelense recipes` call — so
  // this ONE run, the run that just created the package, does both itself. Neither failure is
  // fatal to the overall install: the other packages' own installs still need to run, so a failure
  // here is reported through the result rather than thrown, naming the exact command to run by
  // hand.
  const targetProjectRootCwd = absoluteFilePathContract.parse(context.targetProjectRoot);

  const installResult = await npmInstallAdapter({ cwd: targetProjectRootCwd });
  if (installResult.exitCode !== 0) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: false,
      action: 'created',
      message: installMessageContract.parse(
        `${createdMessage}; npm install failed (exit ${String(installResult.exitCode)}): ` +
          `${String(installResult.output)} — run "npm install" at the repo root, then "${buildCommand}" ` +
          'to finish setting it up',
      ),
    };
  }

  const buildResult = await npmRunBuildAdapter({
    cwd: targetProjectRootCwd,
    workspace: recipesPackageName,
  });
  if (buildResult.exitCode !== 0) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: false,
      action: 'created',
      message: installMessageContract.parse(
        `${createdMessage}; ${buildCommand} failed (exit ${String(buildResult.exitCode)}): ` +
          `${String(buildResult.output)} — run "${buildCommand}" to finish setting it up`,
      ),
    };
  }

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse(createdMessage),
  };
};

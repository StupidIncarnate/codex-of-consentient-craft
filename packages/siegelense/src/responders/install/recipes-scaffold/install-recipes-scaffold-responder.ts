/**
 * PURPOSE: Creates a complete, buildable `packages/hydration-recipes/` in the target repo when
 * that package is absent — package.json, tsconfig.json, tsconfig.build.json, jest.config.js, a
 * responders barrel, a startup file, a flow, and two responders (listing and seed) — so
 * `recipesLocateBroker` finds a package `npm run build` can actually act on instead of a bare
 * `src/` folder nothing can compile (`RecipesBuildMissingError` in every fresh consumer repo
 * otherwise), and so `@dungeonmaster/enforce-hydration-recipes-structure` (this repo's own
 * architectural lint rule, which requires those same five files to exist) accepts the fresh
 * scaffold outright. An existing package is left completely untouched — the convention travels, the
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
 * // Creates packages/hydration-recipes/ with a full, lint-clean starter layout when the package is
 * // absent; an existing package's contents are neither read nor written
 */

import { existsSync } from '#gateway/node/fs';
import { ensureDir } from '#gateway/node/fs__promises';
import { basename, dirname, resolve } from '#gateway/node/path';
import {
  type InstallContext,
  type InstallResult,
  absoluteFilePathContract,
  installMessageContract,
  packageJsonContract,
  packageNameContract,
  pathSegmentContract,
} from '@dungeonmaster/shared/contracts';
import { workspaceScopeFromRootNameTransformer } from '@dungeonmaster/shared/transformers';

import { install, runBuild } from '#gateway/bin/npm';
import { readFile } from '#gateway/node/fs__promises';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
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
  const recipesPackagePath = resolve(
    context.targetProjectRoot,
    PACKAGES_DIRNAME,
    RECIPES_PACKAGE_DIRNAME,
  );
  const packagePresent = existsSync(recipesPackagePath);

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

  const rootPackageJsonPath = resolve(context.targetProjectRoot, ROOT_PACKAGE_JSON_FILENAME);

  const rootPackageJsonExists = existsSync(rootPackageJsonPath);
  // A fallback (this repo's OWN gateway-setup step names it the same way — install-setup-gateway-
  // responder.ts) is only offered once the root package.json is confirmed to exist: an ABSENT root
  // package.json means `dungeonmaster init`'s gateway step never scaffolded `packages/@gateway/*`
  // scoped either, so there is no existing scope for this package to match, and it stays unscoped —
  // exactly like every other existing package would in that same repo state.
  const workspaceScope = rootPackageJsonExists
    ? workspaceScopeFromRootNameTransformer({
        rootPackageJsonName: packageJsonContract.parse(
          JSON.parse(await readFile(rootPackageJsonPath)),
        ).name,
        fallbackName: pathSegmentContract.parse(basename(context.targetProjectRoot)),
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

  // Unlike the original flat starter (package.json/tsconfig*/src/index.ts, all one level deep),
  // enforce-hydration-recipes-structure's five required files sit under nested folders
  // (src/startup/, src/flows/recipes/, src/responders/recipes/{listing,seed}/) that never exist
  // yet — `fsWriteFileAdapter` is a bare `fs/promises.writeFile`, with no parent-directory creation
  // of its own, so writing straight to those paths throws ENOENT. Every unique directory the
  // scaffold touches (including the package root itself) is created first, deduped through a Set
  // since `ensureDir` is recursive and idempotent but still one real syscall per call.
  const scaffoldDirs = new Set(
    scaffoldFiles.map((file) => dirname(resolve(recipesPackagePath, file.relativePath))),
  );
  await Promise.all([...scaffoldDirs].map(async (dirPath) => ensureDir(dirPath)));

  await Promise.all(
    scaffoldFiles.map(async (file) =>
      fsWriteFileAdapter({
        filePath: absoluteFilePathContract.parse(resolve(recipesPackagePath, file.relativePath)),
        contents: file.contents,
      }),
    ),
  );

  const createdMessage = `Created ${PACKAGES_DIRNAME}/${RECIPES_PACKAGE_DIRNAME}/ (package.json, tsconfig.json, tsconfig.build.json, jest.config.js, responders.ts, ${SRC_DIRNAME}/index.ts, ${SRC_DIRNAME}/startup/, ${SRC_DIRNAME}/flows/, ${SRC_DIRNAME}/responders/)`;
  const buildCommand = `npm run build --workspace=${recipesPackageName}`;

  // Until `npm install` links the freshly scaffolded workspace and `npm run build` compiles it,
  // `recipesLocateBroker` throws `RecipesBuildMissingError` on every `siegelense recipes` call — so
  // this ONE run, the run that just created the package, does both itself. Neither failure is
  // fatal to the overall install: the other packages' own installs still need to run, so a failure
  // here is reported through the result rather than thrown, naming the exact command to run by
  // hand.
  const targetProjectRootCwd = absoluteFilePathContract.parse(context.targetProjectRoot);

  const installResult = await install({ cwd: targetProjectRootCwd });
  if (installResult.exitCode !== 0) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: false,
      action: 'created',
      message: installMessageContract.parse(
        `${createdMessage}; npm install failed (exit ${String(installResult.exitCode)}): ` +
          `${installResult.output} — run "npm install" at the repo root, then "${buildCommand}" ` +
          'to finish setting it up',
      ),
    };
  }

  const buildResult = await runBuild({
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
          `${buildResult.output} — run "${buildCommand}" to finish setting it up`,
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

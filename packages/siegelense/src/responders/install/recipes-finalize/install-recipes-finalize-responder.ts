/**
 * PURPOSE: Runs `npm install` then `npm run build --workspace=<name>` for a
 * `packages/hydration-recipes/` InstallRecipesScaffoldResponder scaffolded THIS run — split out of
 * that responder (DEF-99) so it runs once every package's `StartInstall` has already finished,
 * instead of racing another package's own `StartInstall` still writing `package.json`
 * (devDependencies another package adds) mid-`readdirSync`-order sequence. `recipesScaffoldState`
 * is the signal: unset, this run scaffolded nothing and the responder is a no-op; set, it carries
 * the exact scoped package name the scaffold step already computed. Neither npm failure is fatal to
 * the overall `dungeonmaster init` run — it is reported through the result, naming the exact
 * command to run by hand, the same way the scaffold step used to.
 *
 * USAGE:
 * const result = await InstallRecipesFinalizeResponder({ context });
 * // Returns a no-op success when nothing was scaffolded this run; otherwise runs npm install then
 * // npm run build and reports success, or the command to run by hand on failure
 */

import {
  type InstallContext,
  type InstallResult,
  absoluteFilePathContract,
  installMessageContract,
  packageNameContract,
} from '@dungeonmaster/shared/contracts';

import { npmInstallAdapter } from '../../../adapters/npm/install/npm-install-adapter';
import { npmRunBuildAdapter } from '../../../adapters/npm/run-build/npm-run-build-adapter';
import { recipesScaffoldState } from '../../../state/recipes-scaffold/recipes-scaffold-state';

const PACKAGE_NAME = '@dungeonmaster/siegelense';

export const InstallRecipesFinalizeResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const { recipesPackageName } = recipesScaffoldState.consumeScaffolded();

  if (recipesPackageName === undefined) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'skipped',
      message: installMessageContract.parse(
        'no freshly scaffolded packages/hydration-recipes/ this run',
      ),
    };
  }

  const buildCommand = `npm run build --workspace=${recipesPackageName}`;
  const targetProjectRootCwd = absoluteFilePathContract.parse(context.targetProjectRoot);

  const installResult = await npmInstallAdapter({ cwd: targetProjectRootCwd });
  if (installResult.exitCode !== 0) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: false,
      action: 'created',
      message: installMessageContract.parse(
        `npm install failed (exit ${String(installResult.exitCode)}): ` +
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
        `${buildCommand} failed (exit ${String(buildResult.exitCode)}): ` +
          `${String(buildResult.output)} — run "${buildCommand}" to finish setting it up`,
      ),
    };
  }

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse(
      `${buildCommand} finished for packages/hydration-recipes/`,
    ),
  };
};

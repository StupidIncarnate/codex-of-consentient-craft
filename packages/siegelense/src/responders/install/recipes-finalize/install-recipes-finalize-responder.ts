/**
 * PURPOSE: Runs `npm install` then `npm run build --workspace=<name>` for a
 * `packages/hydration-recipes/` InstallRecipesScaffoldResponder scaffolded THIS run — split out of
 * that responder so it runs once every package's `StartInstall` has already finished,
 * instead of racing another package's own `StartInstall` still writing `package.json`
 * (devDependencies another package adds) mid-`readdirSync`-order sequence. `recipesScaffoldState`
 * is the signal: unset, this run scaffolded nothing and the responder is a no-op; set, it carries
 * the exact scoped package name the scaffold step already computed. Neither npm failure is fatal to
 * the overall `dungeonmaster init` run — it is reported through the result's `error` (the field the
 * CLI prints for a failed result), naming the command, its exit code, npm's first error line and
 * the command to run by hand.
 *
 * USAGE:
 * const result = await InstallRecipesFinalizeResponder({ context });
 * // Returns a no-op success when nothing was scaffolded this run; otherwise runs npm install then
 * // npm run build and reports success, or the command to run by hand on failure
 */

import {
  type InstallContext,
  type InstallResult,
  installResultContract,
} from '@dungeonmaster/shared/contracts';

import { install, runBuild } from '#gateway/bin/npm';
import { recipesScaffoldState } from '../../../state/recipes-scaffold/recipes-scaffold-state';
import { npmFirstErrorLineTransformer } from '../../../transformers/npm-first-error-line/npm-first-error-line-transformer';

const PACKAGE_NAME = '@dungeonmaster/siegelense';

export const InstallRecipesFinalizeResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const { recipesPackageName } = recipesScaffoldState.consumeScaffolded();

  if (recipesPackageName === undefined) {
    return installResultContract.parse({
      packageName: PACKAGE_NAME,
      success: true,
      action: 'skipped',
      message: 'no freshly scaffolded packages/hydration-recipes/ this run',
    });
  }

  const buildCommand = `npm run build --workspace=${recipesPackageName}`;
  const targetProjectRootCwd = context.targetProjectRoot;

  const installResult = await install({ cwd: targetProjectRootCwd });
  if (installResult.exitCode !== 0) {
    return installResultContract.parse({
      packageName: PACKAGE_NAME,
      success: false,
      action: 'failed',
      error:
        `"npm install" in ${targetProjectRootCwd} exited ${String(installResult.exitCode)}: ` +
        `${npmFirstErrorLineTransformer({ output: installResult.output })} — ` +
        `packages/hydration-recipes/ is scaffolded but not built; fix that, then run "npm install" ` +
        `at the repo root and "${buildCommand}" by hand`,
    });
  }

  const buildResult = await runBuild({
    cwd: targetProjectRootCwd,
    workspace: recipesPackageName,
  });
  if (buildResult.exitCode !== 0) {
    return installResultContract.parse({
      packageName: PACKAGE_NAME,
      success: false,
      action: 'failed',
      error:
        `"${buildCommand}" in ${targetProjectRootCwd} exited ${String(buildResult.exitCode)}: ` +
        `${npmFirstErrorLineTransformer({ output: buildResult.output })} — ` +
        `packages/hydration-recipes/ is scaffolded but not built; fix that, then run "${buildCommand}" by hand`,
    });
  }

  return installResultContract.parse({
    packageName: PACKAGE_NAME,
    success: true,
    action: 'created',
    message: `${buildCommand} finished for packages/hydration-recipes/`,
  });
};

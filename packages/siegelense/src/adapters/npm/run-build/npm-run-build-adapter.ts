/**
 * PURPOSE: `npm run build --workspace=<name>`, scoped to one workspace package — the step that
 * compiles a freshly scaffolded `packages/hydration-recipes` so `recipesLocateBroker`'s
 * `dist/index.js` check stops throwing `RecipesBuildMissingError`. Reach for this over calling
 * `run` from `#gateway/node/child_process` directly, matching every other command-specific adapter
 * this repo composes it into (`gitAddAllAdapter` and its siblings).
 *
 * USAGE:
 * const { exitCode, output } = await npmRunBuildAdapter({
 *   cwd,
 *   workspace: PackageNameStub({ value: '@scope/hydration-recipes' }),
 * });
 * // Runs `npm run build --workspace=@scope/hydration-recipes` from that repo root
 */

import { run, RunNotFoundError } from '#gateway/node/child_process';
import {
  errorMessageContract,
  exitCodeContract,
  type AbsoluteFilePath,
  type ErrorMessage,
  type ExitCode,
  type PackageName,
} from '@dungeonmaster/shared/contracts';

export const npmRunBuildAdapter = async ({
  cwd,
  workspace,
}: {
  cwd: AbsoluteFilePath;
  workspace: PackageName;
}): Promise<{ exitCode: ExitCode; output: ErrorMessage }> => {
  // A missing `npm` binary rejects `run` with RunNotFoundError rather than resolving a result —
  // caught here and folded into the same failed-run shape the old childProcessSpawnCaptureAdapter
  // resolved for an ENOENT, so a caller reading exitCode/output sees no behavior change.
  const { exitCode, output } = await run({
    command: 'npm',
    args: ['run', 'build', `--workspace=${workspace}`],
    cwd,
  }).catch((error: unknown) => {
    if (!(error instanceof RunNotFoundError)) {
      throw error;
    }
    return { exitCode: 1, output: '', signal: null, timedOut: false };
  });

  return {
    exitCode: exitCodeContract.parse(exitCode),
    output: errorMessageContract.parse(output),
  };
};

/**
 * PURPOSE: `npm run build --workspace=<name>`, scoped to one workspace package — the step that
 * compiles a freshly scaffolded `packages/hydration-recipes` so `recipesLocateBroker`'s
 * `dist/index.js` check stops throwing `RecipesBuildMissingError`. Reach for this over calling
 * `childProcessSpawnCaptureAdapter` directly, matching every other command-specific adapter this
 * repo composes it into (`gitAddAllAdapter` and its siblings).
 *
 * USAGE:
 * const { exitCode, output } = await npmRunBuildAdapter({
 *   cwd,
 *   workspace: PackageNameStub({ value: '@scope/hydration-recipes' }),
 * });
 * // Runs `npm run build --workspace=@scope/hydration-recipes` from that repo root
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import {
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
  const { exitCode, output } = await childProcessSpawnCaptureAdapter({
    command: 'npm',
    args: ['run', 'build', `--workspace=${workspace}`],
    cwd,
  });

  return { exitCode: exitCode ?? exitCodeContract.parse(1), output };
};

/**
 * PURPOSE: `npm run build --workspace=<name>`, scoped to one workspace package.
 *
 * USAGE:
 * const { exitCode, output } = await runBuild({ cwd: '/repo', workspace: '@scope/pkg' });
 */

import { npmRun } from '../npm-run/npm-run';

export const runBuild = async ({
  cwd,
  workspace,
}: {
  cwd: string;
  workspace: string;
}): Promise<{ exitCode: number; output: string }> => {
  const { exitCode, output } = await npmRun({
    args: ['run', 'build', `--workspace=${workspace}`],
    cwd,
  });
  return { exitCode, output };
};

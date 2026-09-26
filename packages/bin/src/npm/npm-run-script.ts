/**
 * PURPOSE: Generalizes `npm run <script>` for a caller that is not `install` or a workspace build —
 * ward's own bundle builder hand-rolls an `npm` spawn for exactly this shape today. Reach for this
 * over that pattern so every `npm` invocation in the repo goes through one home.
 *
 * USAGE:
 * await runScript({ cwd: '/repo', script: 'build', args: ['--outDir', '/tmp/out'] });
 * // Runs `npm run build --outDir /tmp/out`
 *
 * await runScript({ cwd: '/repo', workspace: '@scope/pkg', script: 'test' });
 * // Runs `npm run test --workspace=@scope/pkg`
 */

import { npmRun } from './npm-run';

export const runScript = async ({
  cwd,
  workspace,
  script,
  args,
}: {
  cwd: string;
  workspace?: string;
  script: string;
  args?: string[];
}): Promise<{ exitCode: number; output: string }> => {
  const { exitCode, output } = await npmRun({
    args: [
      'run',
      script,
      ...(workspace === undefined ? [] : [`--workspace=${workspace}`]),
      ...(args ?? []),
    ],
    cwd,
  });
  return { exitCode, output };
};

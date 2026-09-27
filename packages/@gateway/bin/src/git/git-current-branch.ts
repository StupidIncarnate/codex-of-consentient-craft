/**
 * PURPOSE: Reconciles orchestrator's async `gitCurrentBranchAdapter` (which passed the literal
 * string `'HEAD'` through for a detached worktree) against siegelense's sync `gitBranchReadAdapter`
 * (which read `null` for detached HEAD but swallowed EVERY failure — missing git, not a repo,
 * permission denied — into that same `null`). This keeps siegelense's null-for-detached convention,
 * stays async like the rest of this module, and throws on a real git failure instead of hiding it —
 * see `scrolls/gateway/followup-sustainability.md` item 33 for the callers this reconciliation affects.
 *
 * USAGE:
 * const branch = await currentBranch({ cwd: '/repo/worktrees/foo' });
 * // Returns 'main', or null when HEAD is detached
 */

import { gitRun } from './git-run';

export const currentBranch = async ({ cwd }: { cwd: string }): Promise<string | null> => {
  const { exitCode, output } = await gitRun({ args: ['rev-parse', '--abbrev-ref', 'HEAD'], cwd });

  if (exitCode !== 0) {
    throw new Error(
      `git rev-parse --abbrev-ref HEAD failed in ${cwd} with exit code ${String(exitCode)}: ${output}`,
    );
  }

  const trimmed = output.trim();

  if (trimmed.length === 0 || trimmed === 'HEAD') {
    return null;
  }

  return trimmed;
};

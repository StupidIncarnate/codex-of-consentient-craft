/**
 * PURPOSE: Reach for this over a ref-specific existence check — answers "does this ref exist
 * locally?" for a base-branch candidate or a quest branch name alike, one boundary call rather than
 * letting two call sites drift into different existence semantics.
 *
 * USAGE:
 * const exists = await verifyRef({ cwd: '/repo', ref: 'main' });
 * // true when `git rev-parse --verify main` succeeds locally
 */

import { gitRun } from '../git-run/git-run';

export const verifyRef = async ({ cwd, ref }: { cwd: string; ref: string }): Promise<boolean> => {
  const { exitCode } = await gitRun({ args: ['rev-parse', '--verify', ref], cwd });
  return exitCode === 0;
};

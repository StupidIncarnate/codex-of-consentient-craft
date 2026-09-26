/**
 * PURPOSE: Returns the changed-file list for a review scope, measured from an explicit base ref.
 * `comparison` picks WHAT the ref is compared against: `merge-base-to-head` (`<ref>...HEAD`) reads
 * committed history; `ref-to-working-tree` (`<ref>`, no range) reads the working tree, which still
 * reports TRACKED files only — pair with `untrackedFiles` for the rest. Throws on a non-zero git
 * exit, preserved from the adapter this replaces.
 *
 * USAGE:
 * const files = await diffFiles({ cwd: '/repo', baseRef: 'a1b2c3d4' });
 * // Returns file paths changed between baseRef and HEAD, in git's reported order
 */

import { gitRun } from './git-run';

export const diffFiles = async ({
  cwd,
  baseRef,
  comparison = 'merge-base-to-head',
}: {
  cwd: string;
  baseRef: string;
  comparison?: 'merge-base-to-head' | 'ref-to-working-tree';
}): Promise<string[]> => {
  const revisionArg = comparison === 'ref-to-working-tree' ? baseRef : `${baseRef}...HEAD`;

  const { exitCode, output } = await gitRun({ args: ['diff', revisionArg, '--name-only'], cwd });

  if (exitCode !== 0) {
    throw new Error(`git diff ${revisionArg} failed with exit code ${String(exitCode)}: ${output}`);
  }

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

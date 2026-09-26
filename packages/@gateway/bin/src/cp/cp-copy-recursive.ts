/**
 * PURPOSE: `cp` for every worktree copy site this repo spawns — a single source onto a destination
 * FILE-or-directory path (`hardlink: false`, `-a`), or several sources onto a trailing destination
 * DIRECTORY, hardlinked rather than byte-copied (`hardlink: true`, `-al`). The two orchestrator call
 * sites this replaces (`populate-one-root-layer-broker.ts`'s node_modules mirror, and
 * `worktree-seed-dist-broker.ts`'s per-package dist copy) use different flags for different reasons
 * — hardlinking a large node_modules tree is cheap and safe to share inodes with; a package's dist
 * output is copied singly per destination — so one function takes the choice as a parameter rather
 * than assuming one flag covers every caller.
 *
 * USAGE:
 * await copyRecursive({ sources: ['/repo/dist/pkg'], destination: '/worktree/dist/pkg', cwd: '/repo' });
 * // Runs `cp -a /repo/dist/pkg /worktree/dist/pkg`
 *
 * await copyRecursive({
 *   sources: ['/repo/node_modules/a', '/repo/node_modules/b'],
 *   destination: '/worktree/node_modules',
 *   cwd: '/repo',
 *   hardlink: true,
 * });
 * // Runs `cp -al /repo/node_modules/a /repo/node_modules/b /worktree/node_modules`
 */

import { cpRun } from './cp-run';

export const copyRecursive = async ({
  sources,
  destination,
  cwd,
  hardlink,
}: {
  sources: string[];
  destination: string;
  cwd: string;
  hardlink?: boolean;
}): Promise<{ exitCode: number; output: string }> => {
  const flag = hardlink === true ? '-al' : '-a';
  const { exitCode, output } = await cpRun({ args: [flag, ...sources, destination], cwd });
  return { exitCode, output };
};

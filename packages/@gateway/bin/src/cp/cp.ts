/**
 * PURPOSE: Curated surface for the `cp` binary — every worktree copy site this repo spawns.
 *
 * USAGE:
 * import { copyRecursive } from '#gateway/bin/cp';
 */

export { copyRecursive } from './copy-recursive/copy-recursive';
export { CpNotInstalledError } from './cp-run/cp-not-installed.error';
export { cpRun } from './cp-run/cp-run';

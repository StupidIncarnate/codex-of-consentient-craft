/**
 * PURPOSE: Curated surface for the `kill` binary — signaling a pid or a process group this process
 * does not hold a live handle for.
 *
 * USAGE:
 * import { killPid, killGroup } from '#gateway/bin/kill';
 */

export { killGroup } from './kill-group/kill-group';
export { KillNotInstalledError } from './kill-not-installed-error/kill-not-installed-error';
export { killPid } from './kill-pid/kill-pid';
export { killRun } from './kill-run/kill-run';

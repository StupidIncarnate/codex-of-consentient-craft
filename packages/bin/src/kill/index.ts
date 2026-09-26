/**
 * PURPOSE: Curated surface for the `kill` binary — signaling a pid or a process group this process
 * does not hold a live handle for.
 *
 * USAGE:
 * import { killPid, killGroup } from '@dungeonmaster/bin/kill';
 */

export * from './kill-not-installed-error';
export * from './kill-pid';
export * from './kill-group';

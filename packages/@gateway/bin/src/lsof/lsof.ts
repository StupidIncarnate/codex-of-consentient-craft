/**
 * PURPOSE: Curated surface for the `lsof` binary. One function: which pids are listening on a port.
 *
 * USAGE:
 * import { listeningPids, LsofNotInstalledError } from '#gateway/bin/lsof';
 */

export { listeningPids } from './listening-pids/listening-pids';
export { LsofNotInstalledError } from './lsof-run/lsof-not-installed.error';
export { lsofRun } from './lsof-run/lsof-run';

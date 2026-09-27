/**
 * PURPOSE: Curated surface for the `npm` binary. Every function is built on
 * `#gateway/node/child_process`'s `run` and throws `NpmNotInstalledError` when npm itself is
 * missing.
 *
 * USAGE:
 * import { install, runBuild, runScript } from '#gateway/bin/npm';
 */

export { install } from './install/install';
export { NpmNotInstalledError } from './npm-not-installed-error/npm-not-installed-error';
export { npmRun } from './npm-run/npm-run';
export { runBuild } from './run-build/run-build';
export { runScript } from './run-script/run-script';

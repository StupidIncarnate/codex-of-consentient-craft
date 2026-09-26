/**
 * PURPOSE: Curated surface for the `npm` binary. Every function is built on
 * `@dungeonmaster/node/child_process`'s `run` and throws `NpmNotInstalledError` when npm itself is
 * missing.
 *
 * USAGE:
 * import { install, runBuild, runScript } from '@dungeonmaster/bin/npm';
 */

export * from './npm-not-installed-error';
export * from './npm-install';
export * from './npm-run-build';
export * from './npm-run-script';

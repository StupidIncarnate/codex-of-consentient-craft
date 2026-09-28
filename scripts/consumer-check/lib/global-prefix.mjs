/**
 * Scenario 4 from repo CLAUDE.md's MCP resolution table: `dungeonmaster` installed globally, no
 * local `node_modules` in the consumer at all. A real `npm install -g` would touch the operator's
 * actual global npm prefix, so this sandboxes one instead: `npm install -g --prefix <scratchDir>`
 * installs every packed tarball together under a throwaway prefix, and callers point `PATH` at its
 * `bin/` and reuse `npm root -g --prefix <scratchDir>` in place of the real one — the same
 * isolation principle as the fixture consumer itself (repo CLAUDE.md's worktrees snippet: physical
 * separation, not a config flag).
 */

import { join } from 'node:path';
import { hermeticEnv, run } from './proc.mjs';

const NPM_INSTALL_TIMEOUT_MS = 5 * 60 * 1000;

export const installTarballsGlobally = async ({ globalPrefixDir, tarballs }) => {
  const result = await run({
    command: 'npm',
    args: [
      'install',
      '-g',
      '--prefix',
      globalPrefixDir,
      '--no-audit',
      '--no-fund',
      ...tarballs.map(({ tarballPath }) => tarballPath),
    ],
    timeoutMs: NPM_INSTALL_TIMEOUT_MS,
  });
  if (result.code !== 0) {
    throw new Error(`npm install -g --prefix ${globalPrefixDir} failed:\n${result.stderr}`);
  }
  return result;
};

export const globalBinDir = ({ globalPrefixDir }) => join(globalPrefixDir, 'bin');

export const globalDungeonmasterBin = ({ globalPrefixDir }) =>
  join(globalBinDir({ globalPrefixDir }), 'dungeonmaster');

// `npm root -g` reads the prefix from `npm config get prefix`, which env `NPM_CONFIG_PREFIX` (or
// `--prefix`) overrides — so a script the harness spawns with THIS env set resolves the sandboxed
// prefix's globally-installed packages, exactly like the real global-install scenario, without
// ever touching the operator's actual global npm root.
export const envWithGlobalPrefix = ({ globalPrefixDir }) => ({
  ...hermeticEnv,
  NPM_CONFIG_PREFIX: globalPrefixDir,
  PATH: `${globalBinDir({ globalPrefixDir })}${':'}${hermeticEnv.PATH}`,
});

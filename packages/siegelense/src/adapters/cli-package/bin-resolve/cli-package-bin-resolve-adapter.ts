/**
 * PURPOSE: Resolves the absolute path to the `dungeonmaster` CLI's own compiled bin script, so the
 * driver is spawned by that exact resolved path rather than by the bare command `dungeonmaster` —
 * a name PATH can resolve to a DIFFERENT checkout entirely (a stale global npm link, a second
 * session's worktree, an older consumer install), which boots an unrelated binary and reads back
 * as a boot timeout rather than as the wrong process. `require.resolve('@dungeonmaster/cli')`
 * finds the SAME sibling package this process is itself installed alongside — the technique
 * `CliServeResponder`/`CliSiegelenseResponder` already use in reverse to load
 * `@dungeonmaster/server`/`@dungeonmaster/siegelense` — so a workspace symlink and a flat consumer
 * `node_modules` both resolve correctly with no PATH lookup at all. `packageRootFindLayerAdapter`
 * walks up from wherever that specifier lands (a different depth under `--conditions=source` than
 * under plain `require` — see its own PURPOSE) to the package root, and the bin script's relative
 * location is read from that root's own `package.json` `bin` field rather than duplicated here as
 * a literal.
 *
 * USAGE:
 * const binPath = cliPackageBinResolveAdapter();
 * // Returns the AbsoluteFilePath to @dungeonmaster/cli's compiled bin script
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { absoluteFilePathContract, packageJsonContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { packageRootFindLayerAdapter } from './package-root-find-layer-adapter';

const CLI_PACKAGE_NAME = '@dungeonmaster/cli';
const CLI_BIN_NAME = 'dungeonmaster';

export const cliPackageBinResolveAdapter = (): AbsoluteFilePath => {
  const entryPath = require.resolve(CLI_PACKAGE_NAME);
  const packageRoot = packageRootFindLayerAdapter({ startDir: dirname(entryPath) });

  if (packageRoot === null) {
    throw new Error(
      `cliPackageBinResolveAdapter: no ancestor package.json found walking up from ` +
        `${dirname(entryPath)} — is ${CLI_PACKAGE_NAME} installed?`,
    );
  }

  const rawManifest: unknown = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  const manifest = packageJsonContract.parse(rawManifest);
  const { bin } = manifest;
  const binEntries = typeof bin === 'object' ? Object.entries(bin) : [];
  const binRelative = binEntries.find(([binName]) => binName === CLI_BIN_NAME)?.[1];

  if (binRelative === undefined) {
    throw new Error(
      `cliPackageBinResolveAdapter: ${CLI_PACKAGE_NAME}'s package.json has no "bin.${CLI_BIN_NAME}" entry`,
    );
  }

  return absoluteFilePathContract.parse(join(packageRoot, binRelative));
};

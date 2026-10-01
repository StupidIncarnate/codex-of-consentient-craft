/**
 * PURPOSE: Works out how to start a dungeonmaster binary for a run in `cwd`: `node <entry script>` of
 * the nearest locally installed package that owns it (walking up from `cwd`, the order Node resolves
 * modules in), or the bare binary name when nothing is installed locally. Reach for this over spawning
 * the bare name, which `PATH` resolves — in a quest worktree to the main checkout's globally linked
 * copy, and in a consumer with only a local install to nothing at all.
 *
 * USAGE:
 * await dungeonmasterBinResolveBroker({ binName: 'dungeonmaster-ward', cwd: '/repo/worktrees/quest-a' });
 * // Returns { command: process.execPath, leadingArgs: ['/repo/worktrees/quest-a/node_modules/@dungeonmaster/ward/dist/bin/ward-entry.js'] }
 */

import { readJsonFileIfExists } from '#gateway/node/fs__promises';
import { dirname, join } from '#gateway/node/path';
import { execPath } from '#gateway/node/process';

import { binCommandContract } from '../../../contracts/bin-command/bin-command-contract';
import type { BinCommand } from '../../../contracts/bin-command/bin-command-contract';
import { packageBinManifestContract } from '../../../contracts/package-bin-manifest/package-bin-manifest-contract';
import { dungeonmasterBinStatics } from '../../../statics/dungeonmaster-bin/dungeonmaster-bin-statics';

export const dungeonmasterBinResolveBroker = async ({
  binName,
  cwd,
}: {
  binName: string;
  cwd: string;
}): Promise<BinCommand> => {
  const bareName = binCommandContract.parse({ command: binName, leadingArgs: [] });
  const owner = Object.entries(dungeonmasterBinStatics.packages).find(([name]) => name === binName);

  if (owner === undefined) {
    return bareName;
  }

  const [, packageName] = owner;
  const { modulesDir, manifest } = dungeonmasterBinStatics.layout;
  const packageDir = join(cwd, modulesDir, packageName);
  const parsed = packageBinManifestContract.safeParse(
    await readJsonFileIfExists(join(packageDir, manifest)),
  );

  if (parsed.success) {
    const { bin } = parsed.data;
    const entry = typeof bin === 'string' ? bin : bin?.[binName];

    if (entry !== undefined) {
      return binCommandContract.parse({
        command: execPath,
        leadingArgs: [join(packageDir, entry)],
      });
    }
  }

  const parent = dirname(cwd);

  if (parent === cwd) {
    return bareName;
  }

  return dungeonmasterBinResolveBroker({ binName, cwd: parent });
};

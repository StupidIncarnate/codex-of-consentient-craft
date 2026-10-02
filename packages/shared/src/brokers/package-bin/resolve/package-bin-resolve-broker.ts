/**
 * PURPOSE: Works out how to start one of our binaries for work done in `repoRoot`: `node <entry
 * script>` of the owning package as the run root resolves it (its own install only when the run
 * root has none). Reach for this over spawning a bare name, which PATH resolves to whatever
 * checkout was linked globally — in a quest worktree, the main checkout's. A binary that cannot be
 * found throws; there is no bare-name fallback.
 *
 * USAGE:
 * await packageBinResolveBroker({ binName: 'dungeonmaster-ward', repoRoot: '/repo/worktrees/quest-a' });
 * // Returns { command: process.execPath, leadingArgs: ['/repo/worktrees/quest-a/node_modules/@dungeonmaster/ward/dist/bin/ward-entry.js'] }
 */

import { readJsonFile } from '#gateway/node/fs__promises';
import { dirname, join } from '#gateway/node/path';
import { execPath } from '#gateway/node/process';

import { binCommandContract } from '../../../contracts/bin-command/bin-command-contract';
import type { BinCommand } from '../../../contracts/bin-command/bin-command-contract';
import { packageBinManifestContract } from '../../../contracts/package-bin-manifest/package-bin-manifest-contract';
import { dungeonmasterBinStatics } from '../../../statics/dungeonmaster-bin/dungeonmaster-bin-statics';
import { moduleResolveBroker } from '../../module/resolve/module-resolve-broker';

export const packageBinResolveBroker = async ({
  binName,
  repoRoot,
}: {
  binName: string;
  repoRoot: string;
}): Promise<BinCommand> => {
  const owner = Object.entries(dungeonmasterBinStatics.packages).find(([name]) => name === binName);

  if (owner === undefined) {
    throw new Error(
      `packageBinResolveBroker: "${binName}" is not a dungeonmaster binary (run root ${repoRoot})`,
    );
  }

  const [, packageName] = owner;
  const specifier = `${packageName}/${dungeonmasterBinStatics.layout.manifest}`;
  const { path: manifestPath } = moduleResolveBroker({ specifier, repoRoot });
  const manifest = packageBinManifestContract.parse(await readJsonFile(manifestPath));
  const { bin } = manifest;
  const entry = typeof bin === 'string' ? bin : bin?.[binName];

  if (entry === undefined) {
    throw new Error(
      `packageBinResolveBroker: ${packageName} at ${manifestPath} declares no bin "${binName}" (run root ${repoRoot})`,
    );
  }

  return binCommandContract.parse({
    command: execPath,
    leadingArgs: [join(dirname(manifestPath), entry)],
  });
};

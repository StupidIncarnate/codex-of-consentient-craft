/**
 * PURPOSE: Lists directories at a given absolute path, hiding hidden directories by default
 *
 * USAGE:
 * const entries = await directoryBrowseBroker({ path: GuildPathStub({ value: '/home/user' }) });
 * // Returns: DirectoryEntry[] sorted alphabetically, directories only
 */

import { readdirEntriesSync } from '#gateway/node/fs';
import { homedir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { directoryEntryContract } from '@dungeonmaster/shared/contracts';
import type { DirectoryEntry } from '@dungeonmaster/shared/contracts';

export const directoryBrowseBroker = ({ path }: { path?: string }): DirectoryEntry[] => {
  const targetPath = path ?? homedir();

  const entries = readdirEntriesSync(targetPath);

  const directories = entries
    .filter((entry) => entry.kind === 'directory')
    .filter((entry) => !entry.name.startsWith('.'))
    .map((entry) =>
      directoryEntryContract.parse({
        name: entry.name,
        path: join(targetPath, entry.name),
        isDirectory: true,
      }),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return directories;
};

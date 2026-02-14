/**
 * PURPOSE: Lists directories at a given absolute path, hiding hidden directories by default
 *
 * USAGE:
 * const entries = await directoryBrowseBroker({ path: GuildPathStub({ value: '/home/user' }) });
 * // Returns: DirectoryEntry[] sorted alphabetically, directories only
 */

import {
  fsReaddirWithTypesAdapter,
  osHomedirAdapter,
  pathJoinAdapter,
} from '@dungeonmaster/shared/adapters';
import { directoryEntryContract } from '@dungeonmaster/shared/contracts';
import type { DirectoryEntry, GuildPath } from '@dungeonmaster/shared/contracts';

export const directoryBrowseBroker = ({ path }: { path?: GuildPath }): DirectoryEntry[] => {
  const targetPath = path ?? osHomedirAdapter();

  const entries = fsReaddirWithTypesAdapter({ dirPath: targetPath as never });

  const directories = entries
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !entry.name.startsWith('.'))
    .map((entry) =>
      directoryEntryContract.parse({
        name: entry.name,
        path: pathJoinAdapter({ paths: [targetPath, entry.name] }),
        isDirectory: true,
      }),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return directories;
};

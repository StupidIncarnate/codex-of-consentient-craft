/**
 * PURPOSE: Lists the monorepo's real package directories under `packages/`, expanded past any
 * `@scope` group folder — a directory starting with `@` mirrors `node_modules/@scope/name` and is
 * never a package itself, so its own children are listed under it instead. Returns [] when
 * `packages/` itself is missing (single-root project mode), which tells the caller to render the
 * project root as the one package.
 *
 * USAGE:
 * const entries = discoverPackagesLayerBroker({ dirPath: absoluteFilePathContract.parse('/repo/packages') });
 * // Returns [{ name: 'shared', relativeDir: 'shared' }, { name: 'npm', relativeDir: '@gateway/npm' }]
 *
 * WHEN-TO-USE: When the project-map composer needs to detect monorepo vs single-root layout, and
 * needs both a package's display name and its real on-disk path relative to `packages/`
 */

import { readdirEntriesSync, type DirEntrySync } from '#gateway/node/fs';

const GROUP_FOLDER_PREFIX = '@';

export const discoverPackagesLayerBroker = ({
  dirPath,
}: {
  dirPath: string;
}): { name: string; relativeDir: string }[] => {
  let topLevelEntries: DirEntrySync[] = [];
  try {
    topLevelEntries = readdirEntriesSync(String(dirPath));
  } catch {
    // Single-root mode (no packages/ directory): the empty initialization above already signals it.
  }

  const directoryEntries = topLevelEntries.filter((entry) => entry.kind === 'directory');

  const directPackages = directoryEntries
    .filter((entry) => !entry.name.startsWith(GROUP_FOLDER_PREFIX))
    .map((entry) => ({
      name: entry.name,
      relativeDir: entry.name,
    }));

  const groupPackages = directoryEntries
    .filter((entry) => entry.name.startsWith(GROUP_FOLDER_PREFIX))
    .flatMap((group) => {
      const groupPath = `${String(dirPath)}/${group.name}`;
      let groupEntries: DirEntrySync[] = [];
      try {
        groupEntries = readdirEntriesSync(String(groupPath));
      } catch {
        // A group folder that vanished between the two reads is treated the same as an empty one.
      }

      return groupEntries
        .filter((child) => child.kind === 'directory')
        .map((child) => ({
          name: child.name,
          relativeDir: `${group.name}/${child.name}`,
        }));
    });

  return [...directPackages, ...groupPackages];
};

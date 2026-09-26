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

import { fsReaddirWithTypesAdapter } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { pathSegmentContract } from '../../../contracts/path-segment/path-segment-contract';
import type { PathSegment } from '../../../contracts/path-segment/path-segment-contract';

const GROUP_FOLDER_PREFIX = '@';

export const discoverPackagesLayerBroker = ({
  dirPath,
}: {
  dirPath: AbsoluteFilePath;
}): { name: ContentText; relativeDir: PathSegment }[] => {
  let topLevelEntries: ReturnType<typeof fsReaddirWithTypesAdapter> = [];
  try {
    topLevelEntries = fsReaddirWithTypesAdapter({ dirPath });
  } catch {
    // Single-root mode (no packages/ directory): the empty initialization above already signals it.
  }

  const directoryEntries = topLevelEntries.filter((entry) => entry.isDirectory());

  const directPackages = directoryEntries
    .filter((entry) => !entry.name.startsWith(GROUP_FOLDER_PREFIX))
    .map((entry) => ({
      name: contentTextContract.parse(entry.name),
      relativeDir: pathSegmentContract.parse(entry.name),
    }));

  const groupPackages = directoryEntries
    .filter((entry) => entry.name.startsWith(GROUP_FOLDER_PREFIX))
    .flatMap((group) => {
      const groupPath = absoluteFilePathContract.parse(`${String(dirPath)}/${group.name}`);
      let groupEntries: ReturnType<typeof fsReaddirWithTypesAdapter> = [];
      try {
        groupEntries = fsReaddirWithTypesAdapter({ dirPath: groupPath });
      } catch {
        // A group folder that vanished between the two reads is treated the same as an empty one.
      }

      return groupEntries
        .filter((child) => child.isDirectory())
        .map((child) => ({
          name: contentTextContract.parse(child.name),
          relativeDir: pathSegmentContract.parse(`${group.name}/${child.name}`),
        }));
    });

  return [...directPackages, ...groupPackages];
};

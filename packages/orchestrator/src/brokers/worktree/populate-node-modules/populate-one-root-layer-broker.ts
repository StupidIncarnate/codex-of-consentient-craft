/**
 * PURPOSE: Mirrors ONE directory's `node_modules` into the matching directory of a worktree, and
 * hands back the workspace packages it found so the parent can mirror their own `node_modules` too.
 * A relative link target is written back verbatim, which is what re-points it at the worktree's own
 * copy of whatever it names; every other entry is linked at the source's copy, so third-party
 * packages stay shared rather than duplicated. Reach for the parent broker instead unless you are
 * populating a single known root — this layer deliberately knows nothing about which roots exist.
 *
 * USAGE:
 * const { workspacePackageRoots } = await populateOneRootLayerBroker({
 *   sourceRoot: AbsoluteFilePathStub({ value: '/repo' }),
 *   targetRoot: AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' }),
 * });
 * // workspacePackageRoots: [{ sourceRoot: '/repo/packages/orchestrator',
 * //                          targetRoot: '/repo/worktrees/quest-slug-a1b2c3d4/packages/orchestrator' }, ...]
 */

import {
  fsMkdirAdapter,
  fsReaddirWithTypesAdapter,
  pathJoinAdapter,
} from '@dungeonmaster/shared/adapters';
import { locationsNodeModulesPathFindBroker } from '@dungeonmaster/shared/brokers';
import {
  absoluteFilePathContract,
  filePathContract,
  type AbsoluteFilePath,
} from '@dungeonmaster/shared/contracts';

import { fsReadlinkAdapter } from '../../../adapters/fs/readlink/fs-readlink-adapter';
import { fsSymlinkAdapter } from '../../../adapters/fs/symlink/fs-symlink-adapter';

const NPM_SCOPE_PREFIX = '@';

export type WorktreeRootPair = Readonly<{
  sourceRoot: AbsoluteFilePath;
  targetRoot: AbsoluteFilePath;
}>;

export const populateOneRootLayerBroker = async ({
  sourceRoot,
  targetRoot,
}: {
  sourceRoot: AbsoluteFilePath;
  targetRoot: AbsoluteFilePath;
}): Promise<{ workspacePackageRoots: readonly WorktreeRootPair[] }> => {
  const sourceNodeModules = locationsNodeModulesPathFindBroker({ rootPath: sourceRoot });
  const targetNodeModules = locationsNodeModulesPathFindBroker({ rootPath: targetRoot });

  await fsMkdirAdapter({ filepath: filePathContract.parse(targetNodeModules) });

  const entries = fsReaddirWithTypesAdapter({ dirPath: sourceNodeModules });

  const perEntry = await Promise.all(
    entries.map(async (entry) => {
      const entrySourcePath = pathJoinAdapter({ paths: [sourceNodeModules, entry.name] });
      const entryTargetPath = pathJoinAdapter({ paths: [targetNodeModules, entry.name] });

      if (!entry.isDirectory() || !entry.name.startsWith(NPM_SCOPE_PREFIX)) {
        await fsSymlinkAdapter({ target: entrySourcePath, linkPath: entryTargetPath });
        return [];
      }

      // A scope directory becomes a REAL directory whose children are linked one by one. Linking
      // the scope itself would resolve its relative children back to the source checkout, which is
      // exactly the divergence this whole mechanism exists to prevent.
      await fsMkdirAdapter({ filepath: entryTargetPath });

      const scopeChildren = fsReaddirWithTypesAdapter({
        dirPath: absoluteFilePathContract.parse(entrySourcePath),
      });

      return Promise.all(
        scopeChildren.map(async (child) => {
          const childSourcePath = pathJoinAdapter({ paths: [entrySourcePath, child.name] });
          const childTargetPath = pathJoinAdapter({ paths: [entryTargetPath, child.name] });

          const storedTarget = child.isSymbolicLink()
            ? await fsReadlinkAdapter({ linkPath: childSourcePath })
            : null;
          const isRelative =
            storedTarget !== null && !absoluteFilePathContract.safeParse(storedTarget).success;

          await fsSymlinkAdapter({
            target: isRelative ? storedTarget : childSourcePath,
            linkPath: childTargetPath,
          });

          if (!isRelative) {
            return null;
          }

          // The stored target is relative to the link's OWN directory, so joining it onto each side's
          // scope directory normalises the `..` segments away and names the same package under each
          // root — which is precisely the pair of roots whose own node_modules must be mirrored next.
          return {
            sourceRoot: absoluteFilePathContract.parse(
              pathJoinAdapter({ paths: [entrySourcePath, storedTarget] }),
            ),
            targetRoot: absoluteFilePathContract.parse(
              pathJoinAdapter({ paths: [entryTargetPath, storedTarget] }),
            ),
          };
        }),
      );
    }),
  );

  return {
    workspacePackageRoots: perEntry
      .flat()
      .filter((value): value is WorktreeRootPair => value !== null),
  };
};

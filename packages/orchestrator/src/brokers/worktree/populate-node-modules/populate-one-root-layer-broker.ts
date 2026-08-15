/**
 * PURPOSE: Mirrors ONE directory's `node_modules` into the matching directory of a worktree, and
 * hands back the workspace packages it found so the parent can mirror their own `node_modules` too.
 * A relative link target is written back verbatim, which is what re-points it at the worktree's own
 * copy of whatever it names; every other entry is linked at the source's copy, so third-party
 * packages stay shared rather than duplicated. Reach for the parent broker instead unless you are
 * populating a single known root — this layer deliberately knows nothing about which roots exist.
 *
 * Re-entrant by design: the riftcarver that drives it is dispatched again after a spiritmender, so
 * this root may already be mirrored. The done-check reads the TARGET directory on disk rather than
 * any record, and demands entries rather than mere existence, because an attempt that died right
 * after `fsMkdirAdapter` leaves an empty directory that would otherwise read as finished. The
 * SOURCE walk runs on both branches: the roots handed back are derived from the source's links, so
 * skipping it would leave a resumed run with nothing to iterate.
 *
 * USAGE:
 * const { workspacePackageRoots } = await populateOneRootLayerBroker({
 *   sourceRoot: AbsoluteFilePathStub({ value: '/repo' }),
 *   targetRoot: AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' }),
 *   onLine: (line) => emit(line),
 * });
 * // workspacePackageRoots: [{ sourceRoot: '/repo/packages/orchestrator',
 * //                          targetRoot: '/repo/worktrees/quest-slug-a1b2c3d4/packages/orchestrator' }, ...]
 * // onLine sees exactly one line for this root — either the mirroring line or the skip line
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

import { fsIsAccessibleAdapter } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter';
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
  onLine,
}: {
  sourceRoot: AbsoluteFilePath;
  targetRoot: AbsoluteFilePath;
  // Required, never optional — see packages/shared/CLAUDE.md, "Streaming Adapters". Mirroring a
  // monorepo's node_modules takes minutes, so a caller that cannot stream must say so out loud
  // with `() => undefined`.
  onLine: (line: string) => void;
}): Promise<{ workspacePackageRoots: readonly WorktreeRootPair[] }> => {
  const sourceNodeModules = locationsNodeModulesPathFindBroker({ rootPath: sourceRoot });
  const targetNodeModules = locationsNodeModulesPathFindBroker({ rootPath: targetRoot });

  // The done-check reads DISK, not a record: a directory with entries in it is proof, and the
  // spiritmender that ran between two riftcarver attempts may have npm-installed or deleted things
  // no ledger knows about. Existence alone is not enough — `fsMkdirAdapter` leaves an EMPTY
  // node_modules behind the moment it runs, so an attempt that died right after the mkdir would
  // otherwise look done and mirror nothing.
  const targetExists = await fsIsAccessibleAdapter({
    filePath: filePathContract.parse(targetNodeModules),
  });
  const alreadyPopulated =
    targetExists && fsReaddirWithTypesAdapter({ dirPath: targetNodeModules }).length > 0;

  onLine(
    alreadyPopulated
      ? `— skip ${targetRoot} (node_modules already populated) —`
      : `— mirroring node_modules: ${targetRoot} —`,
  );

  if (!alreadyPopulated) {
    await fsMkdirAdapter({ filepath: filePathContract.parse(targetNodeModules) });
  }

  // The SOURCE walk runs either way. `workspacePackageRoots` is derived entirely from the source
  // side's links plus path arithmetic, so a skipped root still hands the parent the roots to visit
  // next — skipping the walk instead would leave a resumed run with nothing to iterate.
  const entries = fsReaddirWithTypesAdapter({ dirPath: sourceNodeModules });

  const perEntry = await Promise.all(
    entries.map(async (entry) => {
      const entrySourcePath = pathJoinAdapter({ paths: [sourceNodeModules, entry.name] });
      const entryTargetPath = pathJoinAdapter({ paths: [targetNodeModules, entry.name] });

      if (!entry.isDirectory() || !entry.name.startsWith(NPM_SCOPE_PREFIX)) {
        if (!alreadyPopulated) {
          await fsSymlinkAdapter({ target: entrySourcePath, linkPath: entryTargetPath });
        }
        return [];
      }

      // A scope directory becomes a REAL directory whose children are linked one by one. Linking
      // the scope itself would resolve its relative children back to the source checkout, which is
      // exactly the divergence this whole mechanism exists to prevent.
      if (!alreadyPopulated) {
        await fsMkdirAdapter({ filepath: entryTargetPath });
      }

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

          if (!alreadyPopulated) {
            await fsSymlinkAdapter({
              target: isRelative ? storedTarget : childSourcePath,
              linkPath: childTargetPath,
            });
          }

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

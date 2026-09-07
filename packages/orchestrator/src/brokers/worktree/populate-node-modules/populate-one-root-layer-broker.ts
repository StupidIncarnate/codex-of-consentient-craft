/**
 * PURPOSE: Mirrors ONE directory's `node_modules` into the matching directory of a worktree, and
 * hands back the workspace packages it found so the parent can mirror their own `node_modules` too.
 * Reach for the parent broker instead unless you are populating a single known root — this layer
 * deliberately knows nothing about which roots exist.
 *
 * Exactly ONE kind of entry stays a symlink, and that is the whole design. A `@`-scope directory is
 * made REAL, and a child of it that the source holds as a RELATIVE symlink is written back verbatim
 * — which is what re-points `@dungeonmaster/<pkg>` at the WORKTREE's own `packages/<pkg>`, since a
 * relative target resolves from the link's own directory. Linking the scope itself would resolve
 * those children back to the source checkout instead, and nothing would say so: the run is green and
 * it graded the wrong tree.
 *
 * EVERYTHING ELSE is `cp -al` — a real directory tree whose regular files are HARDLINKS. A symlink
 * at the source's copy is cheaper and wrong twice over:
 *
 *   - `node_modules/.bin` holds npm's own shims, and they are RELATIVE
 *     (`../@dungeonmaster/ward/dist/bin/ward-entry.js`), so where they land depends only on whether
 *     `.bin` is a real directory or a link to the main checkout's. Link it and every worktree on
 *     disk runs the MAIN checkout's ward, hooks and CLI — grading code it never changed.
 *   - An npm upgrade in the main checkout REMOVES and re-extracts a package directory. That breaks a
 *     hardlink and leaves the worktree holding its own inode; a symlink follows the replacement and
 *     silently changes versions under a session already running against the old code.
 *
 * `.vite-*` is excluded: those are Vite's per-PORT dependency caches, so two trees sharing one would
 * each be served the other's pre-bundled modules.
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
  childProcessSpawnCaptureAdapter,
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
const VITE_CACHE_PREFIX = '.vite-';
const COPY_COMMAND = 'cp';
// `-a` archives — recursive, preserving mode, timestamps and symlinks VERBATIM. `-l` HARDLINKS
// every regular file rather than copying its bytes, which keeps a worktree at ~20 MB and ~0.65s
// instead of ~530 MB and ~6.6s.
const COPY_HARDLINK_FLAGS = '-al';
const COPY_GREEN_EXIT_CODE = 0;

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
  const entries = fsReaddirWithTypesAdapter({ dirPath: sourceNodeModules }).filter(
    (entry) => !entry.name.startsWith(VITE_CACHE_PREFIX),
  );

  const scopeEntries = entries.filter(
    (entry) => entry.isDirectory() && entry.name.startsWith(NPM_SCOPE_PREFIX),
  );
  const plainEntries = entries.filter(
    (entry) => !entry.isDirectory() || !entry.name.startsWith(NPM_SCOPE_PREFIX),
  );

  if (!alreadyPopulated && plainEntries.length > 0) {
    // ONE invocation for the whole set, because `cp` copies every source into a trailing
    // destination DIRECTORY. A root holds 500-odd of these, and spawning a process per entry would
    // cost several times what the hardlinking itself does.
    const copied = await childProcessSpawnCaptureAdapter({
      command: COPY_COMMAND,
      args: [
        COPY_HARDLINK_FLAGS,
        ...plainEntries.map((entry) =>
          String(pathJoinAdapter({ paths: [sourceNodeModules, entry.name] })),
        ),
        String(targetNodeModules),
      ],
      cwd: sourceRoot,
    });

    if (copied.exitCode !== COPY_GREEN_EXIT_CODE) {
      // `cp -al` cannot cross filesystems, so a worktree placed on another mount fails here rather
      // than degrading into a mechanism nobody chose.
      throw new Error(
        `node_modules hardlink populate failed for ${String(targetRoot)}: ${String(copied.output)}`,
      );
    }
  }

  const perEntry = await Promise.all(
    scopeEntries.map(async (entry) => {
      const entrySourcePath = pathJoinAdapter({ paths: [sourceNodeModules, entry.name] });
      const entryTargetPath = pathJoinAdapter({ paths: [targetNodeModules, entry.name] });

      // A scope directory becomes a REAL directory whose children are handled one by one. Linking
      // the scope itself would resolve its relative children back to the source checkout, which is
      // exactly the divergence this whole mechanism exists to prevent.
      if (!alreadyPopulated) {
        await fsMkdirAdapter({ filepath: entryTargetPath });
      }

      const scopeChildren = fsReaddirWithTypesAdapter({
        dirPath: absoluteFilePathContract.parse(entrySourcePath),
      });

      const inspected = await Promise.all(
        scopeChildren.map(async (child) => {
          const childSourcePath = pathJoinAdapter({ paths: [entrySourcePath, child.name] });
          const storedTarget = child.isSymbolicLink()
            ? await fsReadlinkAdapter({ linkPath: childSourcePath })
            : null;

          return {
            name: child.name,
            childSourcePath,
            relativeTarget:
              storedTarget !== null && !absoluteFilePathContract.safeParse(storedTarget).success
                ? storedTarget
                : null,
          };
        }),
      );

      const workspaceChildren = inspected.flatMap((item) =>
        item.relativeTarget === null
          ? []
          : [{ name: item.name, relativeTarget: item.relativeTarget }],
      );
      const vendoredSources = inspected
        .filter((item) => item.relativeTarget === null)
        .map((item) => String(item.childSourcePath));

      if (!alreadyPopulated) {
        await Promise.all(
          workspaceChildren.map(async (item) =>
            fsSymlinkAdapter({
              target: item.relativeTarget,
              linkPath: pathJoinAdapter({ paths: [entryTargetPath, item.name] }),
            }),
          ),
        );

        if (vendoredSources.length > 0) {
          // Hardlinked like every other third-party package, NOT linked at the source copy: an
          // absolute link here is the shape `worktreeVerifyLinksBroker` refuses, because it points
          // the worktree's own dependency tree back at the main checkout.
          const copiedChildren = await childProcessSpawnCaptureAdapter({
            command: COPY_COMMAND,
            args: [COPY_HARDLINK_FLAGS, ...vendoredSources, String(entryTargetPath)],
            cwd: sourceRoot,
          });

          if (copiedChildren.exitCode !== COPY_GREEN_EXIT_CODE) {
            throw new Error(
              `node_modules hardlink populate failed for ${String(entryTargetPath)}: ${String(copiedChildren.output)}`,
            );
          }
        }
      }

      // The stored target is relative to the link's OWN directory, so joining it onto each side's
      // scope directory normalises the `..` segments away and names the same package under each
      // root — which is precisely the pair of roots whose own node_modules must be mirrored next.
      return workspaceChildren.map((item) => ({
        sourceRoot: absoluteFilePathContract.parse(
          pathJoinAdapter({ paths: [entrySourcePath, item.relativeTarget] }),
        ),
        targetRoot: absoluteFilePathContract.parse(
          pathJoinAdapter({ paths: [entryTargetPath, item.relativeTarget] }),
        ),
      }));
    }),
  );

  return { workspacePackageRoots: perEntry.flat() };
};

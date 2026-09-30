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
 * after `ensureDir` leaves an empty directory that would otherwise read as finished. The
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

import { populateOneRootLayerResultContract } from '../../../contracts/populate-one-root-layer-result/populate-one-root-layer-result-contract';
import type { PopulateOneRootLayerResult } from '../../../contracts/populate-one-root-layer-result/populate-one-root-layer-result-contract';
import { locationsNodeModulesPathFindBroker } from '@dungeonmaster/shared/brokers';
import { cpRun, CpNotInstalledError } from '#gateway/bin/cp';
import { readdirEntriesSync } from '#gateway/node/fs';
import { ensureDir, pathExists, readlinkIfLink, symlink } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';

const NPM_SCOPE_PREFIX = '@';
const VITE_CACHE_PREFIX = '.vite-';
// `-a` archives — recursive, preserving mode, timestamps and symlinks VERBATIM. `-l` HARDLINKS
// every regular file rather than copying its bytes, which keeps a worktree at ~20 MB and ~0.65s
// instead of ~530 MB and ~6.6s.
const COPY_HARDLINK_FLAGS = '-al';
const COPY_GREEN_EXIT_CODE = 0;
// A missing `cp` binary rejects `cpRun` with CpNotInstalledError rather than resolving a result —
// folded into a failed-run shape, so the two exit-code checks below still see a real (non-zero)
// result to report.
const RUN_NOT_FOUND_RESULT = { exitCode: 1, output: '', signal: null, timedOut: false } as const;

export const populateOneRootLayerBroker = async ({
  sourceRoot,
  targetRoot,
  onLine,
}: {
  sourceRoot: string;
  targetRoot: string;
  // Required, never optional — see packages/shared/CLAUDE.md, "Streaming Adapters". Mirroring a
  // monorepo's node_modules takes minutes, so a caller that cannot stream must say so out loud
  // with `() => undefined`.
  onLine: (line: string) => void;
}): Promise<PopulateOneRootLayerResult> => {
  const sourceNodeModules = locationsNodeModulesPathFindBroker({ rootPath: sourceRoot });
  const targetNodeModules = locationsNodeModulesPathFindBroker({ rootPath: targetRoot });

  // The done-check reads DISK, not a record: a directory with entries in it is proof, and the
  // spiritmender that ran between two riftcarver attempts may have npm-installed or deleted things
  // no ledger knows about. Existence alone is not enough — `ensureDir` leaves an EMPTY
  // node_modules behind the moment it runs, so an attempt that died right after the mkdir would
  // otherwise look done and mirror nothing.
  const targetExists = await pathExists(targetNodeModules);
  const alreadyPopulated = targetExists && readdirEntriesSync(targetNodeModules).length > 0;

  onLine(
    alreadyPopulated
      ? `— skip ${targetRoot} (node_modules already populated) —`
      : `— mirroring node_modules: ${targetRoot} —`,
  );

  if (!alreadyPopulated) {
    await ensureDir(targetNodeModules);
  }

  // The SOURCE walk runs either way. `workspacePackageRoots` is derived entirely from the source
  // side's links plus path arithmetic, so a skipped root still hands the parent the roots to visit
  // next — skipping the walk instead would leave a resumed run with nothing to iterate.
  const entries = readdirEntriesSync(sourceNodeModules).filter(
    (entry) => !entry.name.startsWith(VITE_CACHE_PREFIX),
  );

  const scopeEntries = entries.filter(
    (entry) => entry.kind === 'directory' && entry.name.startsWith(NPM_SCOPE_PREFIX),
  );
  const plainEntries = entries.filter(
    (entry) => entry.kind !== 'directory' || !entry.name.startsWith(NPM_SCOPE_PREFIX),
  );

  if (!alreadyPopulated && plainEntries.length > 0) {
    // ONE invocation for the whole set, because `cp` copies every source into a trailing
    // destination DIRECTORY. A root holds 500-odd of these, and spawning a process per entry would
    // cost several times what the hardlinking itself does.
    const copied = await cpRun({
      args: [
        COPY_HARDLINK_FLAGS,
        ...plainEntries.map((entry) => join(sourceNodeModules, entry.name)),
        targetNodeModules,
      ],
      cwd: sourceRoot,
    }).catch((error: unknown) => {
      if (!(error instanceof CpNotInstalledError)) {
        throw error;
      }
      return RUN_NOT_FOUND_RESULT;
    });

    if (copied.exitCode !== COPY_GREEN_EXIT_CODE) {
      // `cp -al` cannot cross filesystems, so a worktree placed on another mount fails here rather
      // than degrading into a mechanism nobody chose.
      throw new Error(`node_modules hardlink populate failed for ${targetRoot}: ${copied.output}`);
    }
  }

  const perEntry = await Promise.all(
    scopeEntries.map(async (entry) => {
      const entrySourcePath = join(sourceNodeModules, entry.name);
      const entryTargetPath = join(targetNodeModules, entry.name);

      // A scope directory becomes a REAL directory whose children are handled one by one. Linking
      // the scope itself would resolve its relative children back to the source checkout, which is
      // exactly the divergence this whole mechanism exists to prevent.
      if (!alreadyPopulated) {
        await ensureDir(entryTargetPath);
      }

      const scopeChildren = readdirEntriesSync(entrySourcePath);

      const inspected = await Promise.all(
        scopeChildren.map(async (child) => {
          const childSourcePath = join(entrySourcePath, child.name);
          const rawTarget = child.kind === 'symlink' ? await readlinkIfLink(childSourcePath) : null;
          // Only a target leading with `./` or `../` is a workspace link; any other stored target
          // (a bare relative path, an absolute one) is hardlinked like any vendored child.
          const relativeTarget =
            rawTarget !== null && (rawTarget.startsWith('./') || rawTarget.startsWith('../'))
              ? rawTarget
              : null;

          return {
            name: child.name,
            childSourcePath,
            relativeTarget,
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
        .map((item) => item.childSourcePath);

      if (!alreadyPopulated) {
        await Promise.all(
          workspaceChildren.map(async (item) =>
            symlink({
              target: item.relativeTarget,
              path: join(entryTargetPath, item.name),
            }),
          ),
        );

        if (vendoredSources.length > 0) {
          // Hardlinked like every other third-party package, NOT linked at the source copy: an
          // absolute link here is the shape `worktreeVerifyLinksBroker` refuses, because it points
          // the worktree's own dependency tree back at the main checkout.
          const copiedChildren = await cpRun({
            args: [COPY_HARDLINK_FLAGS, ...vendoredSources, entryTargetPath],
            cwd: sourceRoot,
          }).catch((error: unknown) => {
            if (!(error instanceof CpNotInstalledError)) {
              throw error;
            }
            return RUN_NOT_FOUND_RESULT;
          });

          if (copiedChildren.exitCode !== COPY_GREEN_EXIT_CODE) {
            throw new Error(
              `node_modules hardlink populate failed for ${entryTargetPath}: ${copiedChildren.output}`,
            );
          }
        }
      }

      // The stored target is relative to the link's OWN directory, so joining it onto each side's
      // scope directory normalises the `..` segments away and names the same package under each
      // root — which is precisely the pair of roots whose own node_modules must be mirrored next.
      return workspaceChildren.map((item) => ({
        sourceRoot: join(entrySourcePath, item.relativeTarget),
        targetRoot: join(entryTargetPath, item.relativeTarget),
      }));
    }),
  );

  return populateOneRootLayerResultContract.parse({ workspacePackageRoots: perEntry.flat() });
};

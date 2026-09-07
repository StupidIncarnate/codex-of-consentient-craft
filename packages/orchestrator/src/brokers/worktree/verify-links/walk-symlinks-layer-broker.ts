/**
 * PURPOSE: Enumerates every symlink under one directory tree and records, per link, the two facts
 * that decide whether a worktree is graded against itself: whether the stored target is RELATIVE,
 * and whether following it lands inside the worktree. It judges nothing — the parent broker owns
 * the verdict — so the audit stays readable as evidence even on a tree that passes. Reach for the
 * parent instead unless you want the raw audit rows.
 *
 * A symlinked directory is never descended into. Following one walks out of the tree being audited
 * and, on a cycle, never comes back — and the link itself is already recorded as a row, which is
 * the thing under audit.
 *
 * USAGE:
 * const audits = await walkSymlinksLayerBroker({
 *   worktreePath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe' }),
 *   dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
 * });
 * // [{ linkPath, storedTarget, resolvedTarget, relative: true, inside: true }, ...]
 */

import {
  fsReaddirWithTypesAdapter,
  pathJoinAdapter,
  pathResolveAdapter,
} from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  filePathContract,
  type AbsoluteFilePath,
  type FilePath,
} from '@dungeonmaster/shared/contracts';

import { fsReadlinkAdapter } from '../../../adapters/fs/readlink/fs-readlink-adapter';

const PATH_SEPARATOR = '/';

export type WorktreeLinkAudit = Readonly<{
  linkPath: AbsoluteFilePath;
  storedTarget: FilePath;
  resolvedTarget: AbsoluteFilePath;
  relative: boolean;
  inside: boolean;
}>;

export const walkSymlinksLayerBroker = async ({
  worktreePath,
  dirPath,
}: {
  worktreePath: AbsoluteFilePath;
  dirPath: AbsoluteFilePath;
}): Promise<readonly WorktreeLinkAudit[]> => {
  const entries = fsReaddirWithTypesAdapter({ dirPath });

  const perEntry = await Promise.all(
    entries.map(async (entry): Promise<readonly WorktreeLinkAudit[]> => {
      const entryPath = absoluteFilePathContract.parse(
        pathJoinAdapter({ paths: [dirPath, entry.name] }),
      );

      if (entry.isSymbolicLink()) {
        const storedTarget = await fsReadlinkAdapter({
          linkPath: filePathContract.parse(entryPath),
        });

        // `null` is a target `filePathContract` cannot brand, which is exactly one shape: a bare
        // relative path with no `./` or `../` lead. That shape is relative by construction and a
        // relative path cannot climb out of the tree it starts in without a `../` this one lacks,
        // so it is safe and there is nothing to record.
        if (storedTarget === null) {
          return [];
        }

        // Resolved against the LINK'S OWN directory, which is what a relative target means on disk.
        const resolvedTarget = pathResolveAdapter({ paths: [dirPath, storedTarget] });
        const resolved = String(resolvedTarget);
        const root = String(worktreePath);

        return [
          {
            linkPath: entryPath,
            storedTarget,
            resolvedTarget,
            relative: !absoluteFilePathContract.safeParse(storedTarget).success,
            // The trailing separator matters: a bare prefix test would read a sibling worktree
            // named `probe-two` as living inside `probe`.
            inside: resolved === root || resolved.startsWith(`${root}${PATH_SEPARATOR}`),
          },
        ];
      }

      if (!entry.isDirectory()) {
        return [];
      }

      return walkSymlinksLayerBroker({ worktreePath, dirPath: entryPath });
    }),
  );

  return perEntry.flat();
};

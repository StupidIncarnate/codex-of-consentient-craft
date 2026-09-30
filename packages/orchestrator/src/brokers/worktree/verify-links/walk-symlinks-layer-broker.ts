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

import { absoluteFilePathContract, filePathContract } from '@dungeonmaster/shared/contracts';
import { readdirEntriesSync } from '#gateway/node/fs';
import { readlinkIfLink } from '#gateway/node/fs__promises';
import { join, resolve } from '#gateway/node/path';

const PATH_SEPARATOR = '/';

export type WorktreeLinkAudit = Readonly<{
  linkPath: string;
  storedTarget: string;
  resolvedTarget: string;
  relative: boolean;
  inside: boolean;
}>;

export const walkSymlinksLayerBroker = async ({
  worktreePath,
  dirPath,
}: {
  worktreePath: string;
  dirPath: string;
}): Promise<readonly WorktreeLinkAudit[]> => {
  const entries = readdirEntriesSync(dirPath);

  const perEntry = await Promise.all(
    entries.map(async (entry): Promise<readonly WorktreeLinkAudit[]> => {
      const entryPath = join(dirPath, entry.name);

      if (entry.kind === 'symlink') {
        const rawTarget = await readlinkIfLink(entryPath);
        const parsedTarget = filePathContract.safeParse(rawTarget);

        // Nothing readable, or a target `filePathContract` cannot brand — exactly one shape: a bare
        // relative path with no `./` or `../` lead. That shape is relative by construction and a
        // relative path cannot climb out of the tree it starts in without a `../` this one lacks,
        // so it is safe and there is nothing to record.
        if (!parsedTarget.success) {
          return [];
        }

        const storedTarget = parsedTarget.data;

        // Resolved against the LINK'S OWN directory, which is what a relative target means on disk.
        const resolvedTarget = resolve(dirPath, storedTarget);
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

      if (entry.kind !== 'directory') {
        return [];
      }

      return walkSymlinksLayerBroker({ worktreePath, dirPath: entryPath });
    }),
  );

  return perEntry.flat();
};

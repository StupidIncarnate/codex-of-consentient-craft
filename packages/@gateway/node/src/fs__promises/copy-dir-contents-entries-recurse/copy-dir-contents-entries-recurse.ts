/**
 * PURPOSE: Copies `remaining` entries of `from` into `to` one at a time, in order. When a copy
 * fails it removes every path in `copiedPaths` (what earlier calls already copied) before
 * rethrowing, so `to` is never left half-filled. `copyDirContents` is the entry point a caller
 * wants; reach for this only to copy an entry list already read and filtered.
 *
 * USAGE:
 * await copyDirContentsEntriesRecurse({
 *   from: '/tmp/inst_1',
 *   to: '/tmp/inst_1/.snapshots/1',
 *   remaining: ['a.json', 'b.json'],
 *   copiedPaths: [],
 * });
 * // Copies a.json then b.json; on a failure removes whatever was already copied, then rejects
 */

import { cp, rm } from 'fs/promises';

export const copyDirContentsEntriesRecurse = async ({
  from,
  to,
  remaining,
  copiedPaths,
}: {
  from: string;
  to: string;
  remaining: readonly string[];
  copiedPaths: readonly string[];
}): Promise<void> => {
  const [entry, ...rest] = remaining;
  if (entry === undefined) {
    return;
  }

  const destinationEntry = `${to}/${entry}`;

  try {
    await cp(`${from}/${entry}`, destinationEntry, { recursive: true, force: true });
  } catch (error: unknown) {
    await Promise.all(
      copiedPaths.map(async (copiedPath) => rm(copiedPath, { recursive: true, force: true })),
    );
    throw error;
  }

  await copyDirContentsEntriesRecurse({
    from,
    to,
    remaining: rest,
    copiedPaths: [...copiedPaths, destinationEntry],
  });
};

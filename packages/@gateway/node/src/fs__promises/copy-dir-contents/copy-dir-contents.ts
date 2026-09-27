/**
 * PURPOSE: Copies the CONTENTS of one directory into another, entry by entry, skipping the names in
 * `excludeNames`. Never a single whole-tree `fs.cp`: cp refuses a destination that sits inside its
 * own source, which a directory copying itself into its own subdirectory (a snapshot store living
 * inside the tree it snapshots) needs. A failure partway REMOVES what this call already copied into
 * `to` — the sad path a hand-rolled `Promise.all` version leaves as a half-copied tree, because a
 * later reader trusts `to` completely once this call resolves.
 *
 * USAGE:
 * await copyDirContents({
 *   from: '/tmp/dm-siege-inst_1',
 *   to: '/tmp/dm-siege-inst_1/.siegelense-snapshots/1',
 *   excludeNames: ['.siegelense-snapshots'],
 * });
 * // Copies every child of from except the excluded names; removes what it copied if any child fails
 */

import { readdir } from 'fs/promises';
import { copyDirContentsEntriesRecurse } from '../copy-dir-contents-entries-recurse/copy-dir-contents-entries-recurse';

export const copyDirContents = async ({
  from,
  to,
  excludeNames,
}: {
  from: string;
  to: string;
  excludeNames: readonly string[];
}): Promise<void> => {
  const entries = (await readdir(from)).filter((entry) => !excludeNames.includes(entry));

  await copyDirContentsEntriesRecurse({ from, to, remaining: entries, copiedPaths: [] });
};

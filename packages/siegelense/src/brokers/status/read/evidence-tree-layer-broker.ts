/**
 * PURPOSE: Walks one instance's evidence directory on disk and lists EVERY file under it, at any
 * depth, each with its size — the file tree `status --instance` prints under EVIDENCE DIR. It reads
 * `homeDir` (the real directory under the siegelense home) but names each file under
 * `repoLocalDir` (the same directory as a reader's `Read` reaches it), so every path it hands back is
 * absolute and pasteable. A directory that does not exist answers `[]` rather than throwing: a
 * pruned instance's evidence is gone, and an empty tree is the true answer for it.
 *
 * USAGE:
 * await evidenceTreeLayerBroker({
 *   homeDir: '/home/u/.dungeonmaster/siegelense/unowned/instances/inst_1',
 *   repoLocalDir: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_1',
 * });
 * // Returns [{ path: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_1/api-server.log', bytes: 2048 }, ...]
 */

import { pathExists, readdirEntries, statIfExists } from '#gateway/node/fs__promises';

import { evidenceFileEntryContract } from '../../../contracts/evidence-file-entry/evidence-file-entry-contract';
import type { EvidenceFileEntry } from '../../../contracts/evidence-file-entry/evidence-file-entry-contract';

export const evidenceTreeLayerBroker = async ({
  homeDir,
  repoLocalDir,
}: {
  homeDir: string;
  repoLocalDir: string;
}): Promise<readonly EvidenceFileEntry[]> => {
  if (!(await pathExists(homeDir))) {
    return [];
  }

  const entries = [...(await readdirEntries(homeDir))].sort((left, right) =>
    left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
  );

  const perEntry = await Promise.all(
    entries.map(async (entry): Promise<readonly EvidenceFileEntry[]> => {
      const homeChild = `${homeDir}/${entry.name}`;
      const repoLocalChild = `${repoLocalDir}/${entry.name}`;

      if (entry.kind === 'directory') {
        return evidenceTreeLayerBroker({ homeDir: homeChild, repoLocalDir: repoLocalChild });
      }

      const fileStat = await statIfExists(homeChild);

      return fileStat === null
        ? []
        : [evidenceFileEntryContract.parse({ path: repoLocalChild, bytes: fileStat.sizeBytes })];
    }),
  );

  return perEntry.flat();
};

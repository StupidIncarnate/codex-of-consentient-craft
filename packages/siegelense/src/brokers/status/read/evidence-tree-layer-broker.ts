/**
 * PURPOSE: Walks one instance's evidence directory on disk and lists EVERY file under it, at any
 * depth, each with its size — the file tree `status --instance` prints under EVIDENCE DIR. It reads
 * `homeDir` (the real directory under the siegelense home) but names each file under
 * `repoLocalDir` (the same directory as a reader's `Read` reaches it), so every path it hands back is
 * absolute and pasteable. A directory that does not exist answers `[]` rather than throwing: a
 * pruned instance's evidence is gone, and an empty tree is the true answer for it. Paths are joined
 * with template literals, NEVER `pathJoinAdapter` — that adapter's mock is one call-ordered queue
 * shared by every proxy `instanceEntryLayerBroker` composes, and a walk whose join count depends on
 * the tree would consume entries staged for other calls.
 *
 * USAGE:
 * await evidenceTreeLayerBroker({
 *   homeDir: AbsoluteFilePathStub({ value: '/home/u/.dungeonmaster/siegelense/unowned/instances/inst_1' }),
 *   repoLocalDir: AbsoluteFilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_1' }),
 * });
 * // Returns [{ path: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_1/api-server.log', bytes: 2048 }, ...]
 */

import { fsExistsSyncAdapter, fsReaddirWithTypesAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, filePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import { evidenceFileEntryContract } from '../../../contracts/evidence-file-entry/evidence-file-entry-contract';
import type { EvidenceFileEntry } from '../../../contracts/evidence-file-entry/evidence-file-entry-contract';

export const evidenceTreeLayerBroker = async ({
  homeDir,
  repoLocalDir,
}: {
  homeDir: AbsoluteFilePath;
  repoLocalDir: AbsoluteFilePath;
}): Promise<readonly EvidenceFileEntry[]> => {
  if (!fsExistsSyncAdapter({ filePath: filePathContract.parse(homeDir) })) {
    return [];
  }

  const entries = [...fsReaddirWithTypesAdapter({ dirPath: homeDir })].sort((left, right) =>
    left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
  );

  const perEntry = await Promise.all(
    entries.map(async (entry): Promise<readonly EvidenceFileEntry[]> => {
      const homeChild = absoluteFilePathContract.parse(`${homeDir}/${entry.name}`);
      const repoLocalChild = absoluteFilePathContract.parse(`${repoLocalDir}/${entry.name}`);

      if (entry.isDirectory()) {
        return evidenceTreeLayerBroker({ homeDir: homeChild, repoLocalDir: repoLocalChild });
      }

      const fileStat = await fsStatAdapter({ filePath: homeChild });

      return fileStat === null
        ? []
        : [evidenceFileEntryContract.parse({ path: repoLocalChild, bytes: fileStat.sizeBytes })];
    }),
  );

  return perEntry.flat();
};

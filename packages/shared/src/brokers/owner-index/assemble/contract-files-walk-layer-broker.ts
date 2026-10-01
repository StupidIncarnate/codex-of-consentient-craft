/**
 * PURPOSE: Lists every production contract file under one folder, layer contracts included — the
 * cheap step the owner index runs every time to learn which files exist. A folder named in
 * ownerIndexStatics.walk.skipFolderNames is never entered, since nothing under it can be a
 * production contract, and nothing is stat'ed. Files come out in the order walkFilesSync yields
 * them (a folder's own files, then its subfolders last-listed first), so the index keeps the order
 * an uncached build gives it. A folder that vanishes mid-walk is left out.
 *
 * USAGE:
 * contractFilesWalkLayerBroker({ rootDir: '/repo', dirPath: '/repo/packages/shared' });
 * // Returns ['/repo/packages/shared/src/contracts/x/x-contract.ts', ...]
 */
import { isFsError, readdirEntriesSync } from '#gateway/node/fs';
import type { DirEntrySync } from '#gateway/node/fs';

import { isContractSourceFileGuard } from '../../../guards/is-contract-source-file/is-contract-source-file-guard';
import { ownerIndexStatics } from '../../../statics/owner-index/owner-index-statics';

export const contractFilesWalkLayerBroker = ({
  rootDir,
  dirPath,
}: {
  rootDir: string;
  dirPath: string;
}): string[] => {
  const entries: DirEntrySync[] = [];
  try {
    entries.push(...readdirEntriesSync(dirPath));
  } catch (error: unknown) {
    if (!isFsError({ error, code: 'ENOENT' })) {
      throw error;
    }
  }

  const files = entries
    .filter((entry) => entry.kind === 'file')
    .map((entry) => `${dirPath}/${entry.name}`)
    .filter((filePath) =>
      isContractSourceFileGuard({ relativePath: filePath.slice(rootDir.length + 1) }),
    );

  const subfolders = entries
    .filter(
      (entry) =>
        entry.kind === 'directory' &&
        !ownerIndexStatics.walk.skipFolderNames.some((name) => name === entry.name),
    )
    .map((entry) => `${dirPath}/${entry.name}`)
    .reverse();

  return [
    ...files,
    ...subfolders.flatMap((subfolder) =>
      contractFilesWalkLayerBroker({ rootDir, dirPath: subfolder }),
    ),
  ];
};

/**
 * PURPOSE: Lists the files under one folder that a caller's guard wants, by repo-relative path,
 * never entering a folder named in `skipFolderNames` and stat'ing nothing — the cheap step a cached
 * index runs every time to learn which files exist. Files come out in the order walkFilesSync yields
 * them (a folder's own files, then its subfolders last-listed first), so a cached index keeps the
 * order an uncached build gives it. A folder that vanishes mid-walk is left out. The owner index
 * walks with isContractSourceFileGuard, the contract index with isContractParseSourceFileGuard.
 *
 * USAGE:
 * sourceFileWalkBroker({ rootDir: '/repo', dirPath: '/repo/packages/shared', skipFolderNames: ['node_modules'], isWantedFile: isContractSourceFileGuard });
 * // Returns ['/repo/packages/shared/src/contracts/x/x-contract.ts', ...]
 */
import { isFsError, readdirEntriesSync } from '#gateway/node/fs';
import type { DirEntrySync } from '#gateway/node/fs';

export const sourceFileWalkBroker = ({
  rootDir,
  dirPath,
  skipFolderNames,
  isWantedFile,
}: {
  rootDir: string;
  dirPath: string;
  skipFolderNames: readonly string[];
  isWantedFile: ({ relativePath }: { relativePath?: string }) => boolean;
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
    .filter((filePath) => isWantedFile({ relativePath: filePath.slice(rootDir.length + 1) }));

  const subfolders = entries
    .filter(
      (entry) => entry.kind === 'directory' && !skipFolderNames.some((name) => name === entry.name),
    )
    .map((entry) => `${dirPath}/${entry.name}`)
    .reverse();

  return [
    ...files,
    ...subfolders.flatMap((subfolder) =>
      sourceFileWalkBroker({ rootDir, dirPath: subfolder, skipFolderNames, isWantedFile }),
    ),
  ];
};

/**
 * PURPOSE: Recursively lists all non-test TypeScript source files under a given directory.
 * Returns an empty array when the directory does not exist.
 *
 * USAGE:
 * const files = listTsFilesRecursiveLayerBroker({
 *   dirPath: absoluteFilePathContract.parse('/repo/packages/shared/src'),
 * });
 * // Returns AbsoluteFilePath[] for every .ts/.tsx that passes isNonTestFileGuard
 *
 * WHEN-TO-USE: architecture-import-edges-broker collecting source files to scan for imports
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { listTsFilesSkipDirsStatics } from '../../../statics/list-ts-files-skip-dirs/list-ts-files-skip-dirs-statics';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const listTsFilesRecursiveLayerBroker = ({
  dirPath,
}: {
  dirPath: AbsoluteFilePath;
}): AbsoluteFilePath[] => {
  const entries = safeReaddirLayerBroker({ dirPath });

  const results: AbsoluteFilePath[] = [];
  for (const entry of entries) {
    const entryPath = absoluteFilePathContract.parse(`${String(dirPath)}/${entry.name}`);
    if (entry.isDirectory()) {
      if (listTsFilesSkipDirsStatics.skipDirNames.some((n) => n === entry.name)) continue;
      const children = listTsFilesRecursiveLayerBroker({ dirPath: entryPath });
      for (const child of children) {
        results.push(child);
      }
    } else if (
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
      isNonTestFileGuard({ filePath: entryPath })
    ) {
      results.push(entryPath);
    }
  }
  return results;
};

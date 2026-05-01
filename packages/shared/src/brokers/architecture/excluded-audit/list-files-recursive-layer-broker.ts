/**
 * PURPOSE: Recursively lists all non-test source files under a given directory
 *
 * USAGE:
 * const files = listFilesRecursiveLayerBroker({
 *   dirPath: absoluteFilePathContract.parse('/repo/packages/shared/src/guards'),
 * });
 * // Returns AbsoluteFilePath[] for every non-test file found at any depth
 *
 * WHEN-TO-USE: Excluded-audit broker collecting files from each excluded category folder
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const listFilesRecursiveLayerBroker = ({
  dirPath,
}: {
  dirPath: AbsoluteFilePath;
}): AbsoluteFilePath[] => {
  const entries = safeReaddirLayerBroker({ dirPath });
  const results: AbsoluteFilePath[] = [];
  for (const entry of entries) {
    const entryPath = absoluteFilePathContract.parse(`${String(dirPath)}/${entry.name}`);
    if (entry.isDirectory()) {
      const children = listFilesRecursiveLayerBroker({ dirPath: entryPath });
      for (const child of children) {
        results.push(child);
      }
    } else if (isNonTestFileGuard({ filePath: entryPath })) {
      results.push(entryPath);
    }
  }
  return results;
};

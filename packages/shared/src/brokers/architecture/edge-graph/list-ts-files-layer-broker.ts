/**
 * PURPOSE: Recursively lists all non-test TypeScript source files under a given directory
 *
 * USAGE:
 * const files = listTsFilesLayerBroker({
 *   dirPath: absoluteFilePathContract.parse('/repo/packages/server/src/flows'),
 * });
 * // Returns AbsoluteFilePath[] for every .ts file passing isNonTestFileGuard
 *
 * WHEN-TO-USE: Edge-graph broker collecting flow files and web broker files to scan
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const listTsFilesLayerBroker = ({
  dirPath,
}: {
  dirPath: AbsoluteFilePath;
}): AbsoluteFilePath[] => {
  const entries = safeReaddirLayerBroker({ dirPath });
  const results: AbsoluteFilePath[] = [];
  for (const entry of entries) {
    const entryPath = absoluteFilePathContract.parse(`${String(dirPath)}/${entry.name}`);
    if (entry.isDirectory()) {
      const children = listTsFilesLayerBroker({ dirPath: entryPath });
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

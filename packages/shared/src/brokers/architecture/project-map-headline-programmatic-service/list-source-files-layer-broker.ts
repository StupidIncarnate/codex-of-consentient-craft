/**
 * PURPOSE: Recursively lists all non-test source files under a given directory
 *
 * USAGE:
 * const files = listSourceFilesLayerBroker({
 *   dirPath: absoluteFilePathContract.parse('/repo/packages/orchestrator/src'),
 * });
 * // Returns AbsoluteFilePath[] for every .ts/.tsx that passes isNonTestFileGuard
 *
 * WHEN-TO-USE: programmatic-service headline broker collecting source files for WS emission scan
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { isSourceFileGuard } from '../../../guards/is-source-file/is-source-file-guard';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const listSourceFilesLayerBroker = ({
  dirPath,
}: {
  dirPath: AbsoluteFilePath;
}): AbsoluteFilePath[] => {
  const entries = safeReaddirLayerBroker({ dirPath });
  const results: AbsoluteFilePath[] = [];
  for (const entry of entries) {
    const entryPath = absoluteFilePathContract.parse(`${String(dirPath)}/${entry.name}`);
    if (entry.isDirectory()) {
      const children = listSourceFilesLayerBroker({ dirPath: entryPath });
      for (const child of children) {
        results.push(child);
      }
    } else if (
      isSourceFileGuard({ filePath: entryPath }) &&
      isNonTestFileGuard({ filePath: entryPath })
    ) {
      results.push(entryPath);
    }
  }
  return results;
};

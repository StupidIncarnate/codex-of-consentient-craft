/**
 * PURPOSE: Recursively lists all non-test source files under a given directory
 *
 * USAGE:
 * const files = listSourceFilesLayerBroker({
 *   dirPath: absoluteFilePathContract.parse('/repo/packages/server/src'),
 * });
 * // Returns AbsoluteFilePath[] for every .ts/.tsx/.js/.jsx that passes isNonTestFileGuard
 *
 * WHEN-TO-USE: State-writes broker collecting the full source file set to scan for adapter callers
 * and browser-storage usage
 */

import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { isSourceFileGuard } from '../../../guards/is-source-file/is-source-file-guard';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const listSourceFilesLayerBroker = ({ dirPath }: { dirPath: string }): string[] => {
  const entries = safeReaddirLayerBroker({ dirPath });
  const results: string[] = [];
  for (const entry of entries) {
    const entryPath = `${dirPath}/${entry.name}`;
    if (entry.kind === 'directory') {
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

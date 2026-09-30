/**
 * PURPOSE: Recursively collects all non-test source files from a directory tree
 *
 * USAGE:
 * const files = collectFolderFilesLayerBroker({
 *   dirPath: '/repo/packages/web/src/responders',
 * });
 * // Returns AbsoluteFilePath[] for every non-test file in the directory tree
 *
 * WHEN-TO-USE: Widget-tree broker scanning responders/ and flows/ to find widget root imports
 */

import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const collectFolderFilesLayerBroker = ({ dirPath }: { dirPath: string }): string[] => {
  const entries = safeReaddirLayerBroker({ dirPath });
  const results: string[] = [];

  for (const entry of entries) {
    const entryPath = `${dirPath}/${entry.name}`;
    if (entry.kind === 'directory') {
      const children = collectFolderFilesLayerBroker({ dirPath: entryPath });
      for (const child of children) {
        results.push(child);
      }
    } else if (isNonTestFileGuard({ filePath: entryPath })) {
      results.push(entryPath);
    }
  }

  return results;
};

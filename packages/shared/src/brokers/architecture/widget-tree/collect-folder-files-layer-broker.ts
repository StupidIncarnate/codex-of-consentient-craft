/**
 * PURPOSE: Recursively collects all non-test source files from a directory tree
 *
 * USAGE:
 * const files = collectFolderFilesLayerBroker({
 *   dirPath: absoluteFilePathContract.parse('/repo/packages/web/src/responders'),
 * });
 * // Returns AbsoluteFilePath[] for every non-test file in the directory tree
 *
 * WHEN-TO-USE: Widget-tree broker scanning responders/ and flows/ to find widget root imports
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const collectFolderFilesLayerBroker = ({
  dirPath,
}: {
  dirPath: AbsoluteFilePath;
}): AbsoluteFilePath[] => {
  const entries = safeReaddirLayerBroker({ dirPath });
  const results: AbsoluteFilePath[] = [];

  for (const entry of entries) {
    const entryPath = absoluteFilePathContract.parse(`${String(dirPath)}/${entry.name}`);
    if (entry.isDirectory()) {
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

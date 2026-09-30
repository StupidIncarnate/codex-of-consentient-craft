/**
 * PURPOSE: Recursively counts all files within a directory tree
 *
 * USAGE:
 * const count = countFilesRecursiveLayerBroker({ dirPath: absoluteFilePathContract.parse('/project/src/brokers') });
 * // Returns total file count across all subdirectories
 *
 * WHEN-TO-USE: When building the project map and need total file counts per folder type
 */

import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const countFilesRecursiveLayerBroker = ({
  dirPath,
}: {
  dirPath: AbsoluteFilePath;
}): number => {
  const entries = safeReaddirLayerBroker({ dirPath });
  let count = 0;

  for (const entry of entries) {
    if (entry.kind === 'directory') {
      count += countFilesRecursiveLayerBroker({
        dirPath: absoluteFilePathContract.parse(`${dirPath}/${entry.name}`),
      });
    } else {
      count += 1;
    }
  }

  return count;
};

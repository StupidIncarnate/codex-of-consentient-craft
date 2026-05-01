/**
 * PURPOSE: Recursively counts non-test TypeScript source files under a directory,
 * filtering via isNonTestFileGuard. Returns 0 when the directory does not exist.
 *
 * USAGE:
 * const count = countBarrelFilesLayerBroker({
 *   dirPath: absoluteFilePathContract.parse('/repo/packages/shared/src/contracts'),
 * });
 * // Returns FileCount — the count of non-test .ts/.tsx files recursively under dirPath
 *
 * WHEN-TO-USE: Library headline renderer counting files per barrel export folder
 */

import {
  fileCountContract,
  type FileCount,
} from '../../../contracts/file-count/file-count-contract';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const countBarrelFilesLayerBroker = ({
  dirPath,
}: {
  dirPath: AbsoluteFilePath;
}): FileCount => {
  const entries = safeReaddirLayerBroker({ dirPath });

  let count = 0;
  for (const entry of entries) {
    const entryPath = absoluteFilePathContract.parse(`${String(dirPath)}/${entry.name}`);
    if (entry.isDirectory()) {
      count += countBarrelFilesLayerBroker({ dirPath: entryPath });
    } else if (
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
      isNonTestFileGuard({ filePath: entryPath })
    ) {
      count += 1;
    }
  }
  return fileCountContract.parse(count);
};

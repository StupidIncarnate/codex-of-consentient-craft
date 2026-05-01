/**
 * PURPOSE: Finds all non-test startup files (start-*.ts) in a package's startup/ directory
 *
 * USAGE:
 * const files = startupFilesFindLayerBroker({
 *   packageSrcPath: absoluteFilePathContract.parse('/repo/packages/server/src'),
 * });
 * // Returns AbsoluteFilePath[] of all start-*.ts files in startup/
 *
 * WHEN-TO-USE: First step in boot-tree rendering — locate the package's startup entry points
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { matchesStartupFileNameGuard } from '../../../guards/matches-startup-file-name/matches-startup-file-name-guard';
import { listDirEntriesLayerBroker } from './list-dir-entries-layer-broker';

export const startupFilesFindLayerBroker = ({
  packageSrcPath,
}: {
  packageSrcPath: AbsoluteFilePath;
}): AbsoluteFilePath[] => {
  const startupDir = absoluteFilePathContract.parse(`${String(packageSrcPath)}/startup`);
  const entries = listDirEntriesLayerBroker({ dirPath: startupDir });

  const result: AbsoluteFilePath[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) continue;
    if (!matchesStartupFileNameGuard({ name: entry.name })) continue;
    const filePath = absoluteFilePathContract.parse(`${String(startupDir)}/${entry.name}`);
    if (!isNonTestFileGuard({ filePath })) continue;
    result.push(filePath);
  }
  return result;
};

/**
 * PURPOSE: Finds all non-test startup files (start-*.ts) in a package's src/startup/
 * directory. Mirrors the boot-tree variant — kept local so the orphan-detect domain
 * does not import a layer file from another domain (lint forbids cross-domain layer
 * imports).
 *
 * USAGE:
 * const files = findStartupFilesLayerBroker({
 *   packageSrcPath: absoluteFilePathContract.parse('/repo/packages/server/src'),
 * });
 * // Returns AbsoluteFilePath[] of every start-*.ts file directly inside src/startup/
 *
 * WHEN-TO-USE: orphan-detect's reachability walker seeding its BFS queue.
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

const STARTUP_PREFIX = 'start-';
const TS_SUFFIX = '.ts';
const TSX_SUFFIX = '.tsx';

export const findStartupFilesLayerBroker = ({
  packageSrcPath,
}: {
  packageSrcPath: AbsoluteFilePath;
}): AbsoluteFilePath[] => {
  const startupDir = absoluteFilePathContract.parse(`${String(packageSrcPath)}/startup`);
  const entries = safeReaddirLayerBroker({ dirPath: startupDir });
  const result: AbsoluteFilePath[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) continue;
    if (!entry.name.startsWith(STARTUP_PREFIX)) continue;
    if (!entry.name.endsWith(TS_SUFFIX) && !entry.name.endsWith(TSX_SUFFIX)) continue;
    const filePath = absoluteFilePathContract.parse(`${String(startupDir)}/${entry.name}`);
    if (!isNonTestFileGuard({ filePath })) continue;
    result.push(filePath);
  }
  return result;
};

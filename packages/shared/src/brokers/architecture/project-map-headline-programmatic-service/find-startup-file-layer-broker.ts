/**
 * PURPOSE: Finds the primary startup file for a programmatic-service package by listing
 * files in src/startup/ and returning the first non-test file that matches *-startup.ts or
 * start-*.ts naming (excludes integration tests, proxy files, and stubs).
 *
 * USAGE:
 * const path = findStartupFileLayerBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/orchestrator'),
 * });
 * // Returns AbsoluteFilePath or undefined when no startup file is found
 *
 * WHEN-TO-USE: project-map-headline-programmatic-service-broker locating the namespace export source
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const findStartupFileLayerBroker = ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): AbsoluteFilePath | undefined => {
  const startupDir = absoluteFilePathContract.parse(`${String(packageRoot)}/src/startup`);
  const entries = safeReaddirLayerBroker({ dirPath: startupDir });

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const entryPath = absoluteFilePathContract.parse(`${String(startupDir)}/${entry.name}`);
    if (!isNonTestFileGuard({ filePath: entryPath })) continue;
    // Match start-*.ts files (the main export namespace file)
    if (entry.name.startsWith('start-') && entry.name.endsWith('.ts')) {
      return entryPath;
    }
  }

  return undefined;
};

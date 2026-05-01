/**
 * PURPOSE: Finds the startup file that exports the programmatic-service namespace
 * (an object literal with async methods) by scanning every non-test startup file in src/startup/.
 *
 * USAGE:
 * const path = findStartupFileLayerBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/orchestrator'),
 * });
 * // Returns AbsoluteFilePath of the file containing `export const StartOrchestrator = { ... }`
 * // or undefined when no namespace-exporting startup file is found
 *
 * WHEN-TO-USE: project-map-headline-programmatic-service-broker locating the namespace export source
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { startupExportsAsyncNamespaceGuard } from '../../../guards/startup-exports-async-namespace/startup-exports-async-namespace-guard';
import { readSourceLayerBroker } from './read-source-layer-broker';
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
    if (!entry.name.startsWith('start-') || !entry.name.endsWith('.ts')) continue;
    const entryPath = absoluteFilePathContract.parse(`${String(startupDir)}/${entry.name}`);
    if (!isNonTestFileGuard({ filePath: entryPath })) continue;
    const source = readSourceLayerBroker({ filePath: entryPath });
    if (source === undefined) continue;
    if (startupExportsAsyncNamespaceGuard({ startupFileContent: String(source) })) {
      return entryPath;
    }
  }

  return undefined;
};

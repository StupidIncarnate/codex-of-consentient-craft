/**
 * PURPOSE: BFS through the import graph starting from each startup file in a package's
 * src/startup/ directory, collecting every in-package source file (resolved through
 * relative imports) that is reachable. Handles `.ts` ↔ `.tsx` swap when the resolved
 * path lands on disk under the alternate extension.
 *
 * USAGE:
 * const reachable = walkReachableFilesLayerBroker({
 *   packageSrcPath: absoluteFilePathContract.parse('/repo/packages/server/src'),
 * });
 * // Returns Set<AbsoluteFilePath> of every reachable in-package source file
 *
 * WHEN-TO-USE: orphan-detect broker computing the reachable set for diff against the
 * candidate-set returned by listWalkedFolderFilesLayerBroker.
 */

import { existsSync } from '#gateway/node/fs';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';
import { findStartupFilesLayerBroker } from './find-startup-files-layer-broker';
import { readSourceTextLayerBroker } from './read-source-text-layer-broker';

const TS_SUFFIX = '.ts';
const TSX_SUFFIX = '.tsx';

export const walkReachableFilesLayerBroker = ({
  packageSrcPath,
}: {
  packageSrcPath: string;
}): Set<string> => {
  const reachable = new Set<string>();
  const startupFiles = findStartupFilesLayerBroker({ packageSrcPath });

  const queue: string[] = [];
  for (const startupFile of startupFiles) {
    if (!reachable.has(startupFile)) {
      reachable.add(startupFile);
      queue.push(startupFile);
    }
  }

  const srcPrefix = `${packageSrcPath}/`;

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;

    const source = readSourceTextLayerBroker({ filePath: current });
    if (source === undefined) continue;

    const importPaths = importStatementsExtractTransformer({ source });
    for (const importPath of importPaths) {
      const resolved = relativeImportResolveTransformer({
        sourceFile: current,
        importPath,
      });
      if (resolved === null) continue;

      const resolvedStr = resolved;
      const tsxCandidate = resolvedStr.endsWith(TS_SUFFIX)
        ? `${resolvedStr.slice(0, -TS_SUFFIX.length)}${TSX_SUFFIX}`
        : null;
      const tsExists = existsSync(resolved);
      const onDisk =
        tsExists || tsxCandidate === null
          ? resolved
          : existsSync(tsxCandidate)
            ? tsxCandidate
            : resolved;

      // Restrict the walk to in-package source files.
      if (!onDisk.startsWith(srcPrefix)) continue;
      if (reachable.has(onDisk)) continue;

      reachable.add(onDisk);
      queue.push(onDisk);
    }
  }

  return reachable;
};

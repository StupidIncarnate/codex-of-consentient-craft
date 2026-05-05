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

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';
import { findStartupFilesLayerBroker } from './find-startup-files-layer-broker';
import { readSourceTextLayerBroker } from './read-source-text-layer-broker';

const TS_SUFFIX = '.ts';
const TSX_SUFFIX = '.tsx';

export const walkReachableFilesLayerBroker = ({
  packageSrcPath,
}: {
  packageSrcPath: AbsoluteFilePath;
}): Set<AbsoluteFilePath> => {
  const reachable = new Set<AbsoluteFilePath>();
  const startupFiles = findStartupFilesLayerBroker({ packageSrcPath });

  const queue: AbsoluteFilePath[] = [];
  for (const startupFile of startupFiles) {
    if (!reachable.has(startupFile)) {
      reachable.add(startupFile);
      queue.push(startupFile);
    }
  }

  const srcPrefix = `${String(packageSrcPath)}/`;

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

      const resolvedStr = String(resolved);
      const tsxCandidate = resolvedStr.endsWith(TS_SUFFIX)
        ? absoluteFilePathContract.parse(`${resolvedStr.slice(0, -TS_SUFFIX.length)}${TSX_SUFFIX}`)
        : null;
      const tsExists = fsExistsSyncAdapter({ filePath: filePathContract.parse(resolved) });
      const onDisk =
        tsExists || tsxCandidate === null
          ? resolved
          : fsExistsSyncAdapter({ filePath: filePathContract.parse(tsxCandidate) })
            ? tsxCandidate
            : resolved;

      // Restrict the walk to in-package source files.
      if (!String(onDisk).startsWith(srcPrefix)) continue;
      if (reachable.has(onDisk)) continue;

      reachable.add(onDisk);
      queue.push(onDisk);
    }
  }

  return reachable;
};

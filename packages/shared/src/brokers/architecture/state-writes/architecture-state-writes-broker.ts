/**
 * PURPOSE: Scans a package for state-write operations — in-memory stores, file writes, and browser storage
 *
 * USAGE:
 * const result = architectureStateWritesBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/orchestrator'),
 * });
 * // Returns StateWritesResult with inMemoryStores, fileWrites, browserStorageWrites
 *
 * WHEN-TO-USE: Building per-type project-map BOUNDARY boxes that list what each package writes
 * WHEN-NOT-TO-USE: For library-type packages that perform no writes
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import {
  stateWritesResultContract,
  type StateWritesResult,
} from '../../../contracts/state-writes-result/state-writes-result-contract';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { fileWriteCallsExtractTransformer } from '../../../transformers/file-write-calls-extract/file-write-calls-extract-transformer';
import { browserStorageCallsExtractTransformer } from '../../../transformers/browser-storage-calls-extract/browser-storage-calls-extract-transformer';
import { listSourceFilesLayerBroker } from './list-source-files-layer-broker';
import { stateDirsFindLayerBroker } from './state-dirs-find-layer-broker';
import { readSourceFileLayerBroker } from './read-source-file-layer-broker';

export const architectureStateWritesBroker = ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): StateWritesResult => {
  const srcPath = absoluteFilePathContract.parse(`${String(packageRoot)}/src`);

  // Collect all non-test source files
  const sourceFiles = listSourceFilesLayerBroker({ dirPath: srcPath });

  // Collect all source file contents (skip missing files silently)
  const fileContents: ContentText[] = [];
  for (const filePath of sourceFiles) {
    const content = readSourceFileLayerBroker({ filePath });
    if (content !== undefined) {
      fileContents.push(content);
    }
  }

  // In-memory stores: state/* folders imported by any source file
  const stateDirs = stateDirsFindLayerBroker({ packageRoot });
  const allImportPaths: ContentText[] = [];
  for (const content of fileContents) {
    const imports = importStatementsExtractTransformer({ source: content });
    for (const imp of imports) {
      allImportPaths.push(imp);
    }
  }
  const inMemoryStores = stateDirs.filter((dirName) =>
    allImportPaths.some((importPath) => importPath.includes(String(dirName))),
  );

  // File writes: scan all source files for fs adapter callers
  const literalWrites: ContentText[] = [];
  const computedWrites: ContentText[] = [];
  for (const content of fileContents) {
    const calls = fileWriteCallsExtractTransformer({ source: content });
    for (const call of calls) {
      const arg = call.filePathArg;
      if (String(arg).startsWith('<computed:')) {
        if (!computedWrites.some((w) => String(w) === String(arg))) {
          computedWrites.push(arg);
        }
      } else if (!literalWrites.some((w) => String(w) === String(arg))) {
        literalWrites.push(arg);
      }
    }
  }
  literalWrites.sort((a, b) => String(a).localeCompare(String(b)));
  const fileWrites = [...literalWrites, ...computedWrites];

  // Browser storage: scan all source files for localStorage/sessionStorage/indexedDB
  const browserStorageWrites: ContentText[] = [];
  for (const content of fileContents) {
    const writes = browserStorageCallsExtractTransformer({ source: content });
    for (const write of writes) {
      if (browserStorageWrites.some((w) => String(w) === String(write))) {
        continue;
      }
      browserStorageWrites.push(write);
    }
  }

  return stateWritesResultContract.parse({
    inMemoryStores,
    fileWrites,
    browserStorageWrites,
  });
};

/**
 * PURPOSE: Reads a source file and partitions its resolved imports into entry files and layer
 * files within a given folder type — both buckets exclude test files; the call-chain renderer
 * uses entries as siblings and recurses into layers at depth+1 to expose layer-helper internals
 *
 * USAGE:
 * const { entries, layers } = importsInFolderTypeFindLayerBroker({
 *   sourceFile: absoluteFilePathContract.parse('/repo/packages/server/src/startup/start-server.ts'),
 *   packageSrcPath: absoluteFilePathContract.parse('/repo/packages/server/src'),
 *   folderType: 'flows',
 * });
 * // Returns { entries: AbsoluteFilePath[]; layers: AbsoluteFilePath[] }
 *
 * WHEN-TO-USE: Boot-tree broker walking startup → flows, flow → responders, responder → adapters,
 * and call-chain renderer expanding broker → broker / broker → adapter
 */

import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { isFileInFolderTypeGuard } from '../../../guards/is-file-in-folder-type/is-file-in-folder-type-guard';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';
import { layerFileParentResolveTransformer } from '../../../transformers/layer-file-parent-resolve/layer-file-parent-resolve-transformer';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { readFileContentsLayerBroker } from './read-file-contents-layer-broker';

export const importsInFolderTypeFindLayerBroker = ({
  sourceFile,
  packageSrcPath,
  folderType,
}: {
  sourceFile: AbsoluteFilePath;
  packageSrcPath: AbsoluteFilePath;
  folderType: string;
}): { entries: AbsoluteFilePath[]; layers: AbsoluteFilePath[] } => {
  const source = readFileContentsLayerBroker({ filePath: sourceFile });
  if (source === undefined) {
    return { entries: [], layers: [] };
  }

  const importPaths = importStatementsExtractTransformer({ source });
  const entries: AbsoluteFilePath[] = [];
  const layers: AbsoluteFilePath[] = [];

  for (const importPath of importPaths) {
    const resolved = relativeImportResolveTransformer({ sourceFile, importPath });
    if (resolved === null) continue;

    // The transformer hardcodes .ts; if the file is actually .tsx (web flows/responders),
    // swap the extension so downstream reads find the real file on disk.
    const resolvedStr = String(resolved);
    const tsSuffix = '.ts';
    const tsxSuffix = '.tsx';
    const tsxCandidate = resolvedStr.endsWith(tsSuffix)
      ? absoluteFilePathContract.parse(`${resolvedStr.slice(0, -tsSuffix.length)}${tsxSuffix}`)
      : null;
    const tsExists = fsExistsSyncAdapter({ filePath: filePathContract.parse(resolved) });
    const onDisk =
      tsExists || tsxCandidate === null
        ? resolved
        : fsExistsSyncAdapter({ filePath: filePathContract.parse(tsxCandidate) })
          ? tsxCandidate
          : resolved;

    if (!isFileInFolderTypeGuard({ filePath: onDisk, packageSrcPath, folderType })) continue;
    if (!isNonTestFileGuard({ filePath: onDisk })) continue;

    const parentOrNull = layerFileParentResolveTransformer({
      layerFilePath: filePathContract.parse(onDisk),
    });
    if (parentOrNull !== null) {
      layers.push(onDisk);
      continue;
    }

    entries.push(onDisk);
  }

  return { entries, layers };
};

/**
 * PURPOSE: Reads a source file and returns all resolved import paths that fall under a given
 * folder type within the same package — filters out test files and layer files
 *
 * USAGE:
 * const flows = importsInFolderTypeFindLayerBroker({
 *   sourceFile: absoluteFilePathContract.parse('/repo/packages/server/src/startup/start-server.ts'),
 *   packageSrcPath: absoluteFilePathContract.parse('/repo/packages/server/src'),
 *   folderType: 'flows',
 * });
 * // Returns AbsoluteFilePath[] of all flow entry files imported by the source file
 *
 * WHEN-TO-USE: Boot-tree broker walking startup → flows, flow → responders, responder → adapters
 * using the same extraction logic for each layer
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { isFileInFolderTypeGuard } from '../../../guards/is-file-in-folder-type/is-file-in-folder-type-guard';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';
import { layerFileParentResolveTransformer } from '../../../transformers/layer-file-parent-resolve/layer-file-parent-resolve-transformer';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { readFileContentsLayerBroker } from './read-file-contents-layer-broker';

export const importsInFolderTypeFindLayerBroker = ({
  sourceFile,
  packageSrcPath,
  folderType,
}: {
  sourceFile: AbsoluteFilePath;
  packageSrcPath: AbsoluteFilePath;
  folderType: string;
}): AbsoluteFilePath[] => {
  const source = readFileContentsLayerBroker({ filePath: sourceFile });
  if (source === undefined) {
    return [];
  }

  const importPaths = importStatementsExtractTransformer({ source });
  const result: AbsoluteFilePath[] = [];

  for (const importPath of importPaths) {
    const resolved = relativeImportResolveTransformer({ sourceFile, importPath });
    if (resolved === null) continue;
    if (!isFileInFolderTypeGuard({ filePath: resolved, packageSrcPath, folderType })) continue;
    if (!isNonTestFileGuard({ filePath: resolved })) continue;

    // Skip layer files — they are inlined under their parent entry file
    const parentOrNull = layerFileParentResolveTransformer({
      layerFilePath: filePathContract.parse(resolved),
    });
    if (parentOrNull !== null) continue;

    result.push(resolved);
  }

  return result;
};

/**
 * PURPOSE: Reads a source file and returns all adapter imports found within the same package,
 * annotating each with whether it is a WS subscriber (terminal node)
 *
 * USAGE:
 * const adapters = adapterImportsFindLayerBroker({
 *   sourceFile: absoluteFilePathContract.parse('/repo/packages/server/src/responders/server/init/server-init-responder.ts'),
 *   packageSrcPath: absoluteFilePathContract.parse('/repo/packages/server/src'),
 * });
 * // Returns array of { filePath, isWsSubscriber } for each adapter import
 *
 * WHEN-TO-USE: Boot-tree broker rendering the → adapters lines under each responder, with
 * WS subscribers rendered as terminal nodes with a side-channel note
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { isWsSubscriberNameGuard } from '../../../guards/is-ws-subscriber-name/is-ws-subscriber-name-guard';
import { filePathToSymbolNameTransformer } from '../../../transformers/file-path-to-symbol-name/file-path-to-symbol-name-transformer';
import { importsInFolderTypeFindLayerBroker } from './imports-in-folder-type-find-layer-broker';

export const adapterImportsFindLayerBroker = ({
  sourceFile,
  packageSrcPath,
}: {
  sourceFile: AbsoluteFilePath;
  packageSrcPath: AbsoluteFilePath;
}): { filePath: AbsoluteFilePath; isWsSubscriber: boolean }[] => {
  const adapterFiles = importsInFolderTypeFindLayerBroker({
    sourceFile,
    packageSrcPath,
    folderType: 'adapters',
  });

  return adapterFiles.map((filePath) => {
    const symbolName = filePathToSymbolNameTransformer({ filePath });
    return {
      filePath,
      isWsSubscriber: isWsSubscriberNameGuard({ name: String(symbolName) }),
    };
  });
};

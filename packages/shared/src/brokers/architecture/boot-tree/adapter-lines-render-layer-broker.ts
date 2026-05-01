/**
 * PURPOSE: Renders the → adapter lines for a single responder in the boot-tree output
 *
 * USAGE:
 * const lines = adapterLinesRenderLayerBroker({
 *   responderFile: absoluteFilePathContract.parse('/repo/packages/server/src/responders/server/init/server-init-responder.ts'),
 *   packageSrcPath: absoluteFilePathContract.parse('/repo/packages/server/src'),
 *   renderingFilePath: absoluteFilePathContract.parse('/repo/packages/server/src/startup/start-server.ts'),
 * });
 * // Returns ContentText[] of rendered adapter lines with → prefix or WS side-channel note
 *
 * WHEN-TO-USE: bootTreeRenderLayerBroker composing adapter lines under each responder
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { importPathToPackagePrefixTransformer } from '../../../transformers/import-path-to-package-prefix/import-path-to-package-prefix-transformer';
import { filePathToDisplayNameTransformer } from '../../../transformers/file-path-to-display-name/file-path-to-display-name-transformer';
import { filePathToSymbolNameTransformer } from '../../../transformers/file-path-to-symbol-name/file-path-to-symbol-name-transformer';
import { adapterImportsFindLayerBroker } from './adapter-imports-find-layer-broker';

export const adapterLinesRenderLayerBroker = ({
  responderFile,
  packageSrcPath,
  renderingFilePath,
}: {
  responderFile: AbsoluteFilePath;
  packageSrcPath: AbsoluteFilePath;
  renderingFilePath: AbsoluteFilePath;
}): ContentText[] => {
  const adapters = adapterImportsFindLayerBroker({ sourceFile: responderFile, packageSrcPath });
  const lines: ContentText[] = [];

  for (const { filePath, isWsSubscriber } of adapters) {
    const displayName = filePathToDisplayNameTransformer({ filePath, packageSrcPath });
    const symbolName = filePathToSymbolNameTransformer({ filePath });

    if (isWsSubscriber) {
      lines.push(
        contentTextContract.parse(
          `      + ${String(displayName)}    ← runtime FLOW shown in Side-channel`,
        ),
      );
      continue;
    }

    let renderName: ContentText = displayName;
    try {
      renderName = importPathToPackagePrefixTransformer({
        renderingFilePath,
        referencedFilePath: filePath,
        symbolName: String(symbolName),
      });
    } catch {
      // keep displayName as fallback
    }

    lines.push(contentTextContract.parse(`      → ${String(renderName)}`));
  }

  return lines;
};

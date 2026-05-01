/**
 * PURPOSE: Renders the ↳ responder lines and their nested adapter lines for a single flow file
 * in the boot-tree output
 *
 * USAGE:
 * const lines = responderLinesRenderLayerBroker({
 *   flowFile: absoluteFilePathContract.parse('/repo/packages/server/src/flows/server/server-flow.ts'),
 *   packageSrcPath: absoluteFilePathContract.parse('/repo/packages/server/src'),
 *   renderingFilePath: absoluteFilePathContract.parse('/repo/packages/server/src/startup/start-server.ts'),
 * });
 * // Returns ContentText[] with ↳ responder lines and nested → adapter lines
 *
 * WHEN-TO-USE: boot-tree rendering composing the responder+adapter subtree for each flow
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { importPathToPackagePrefixTransformer } from '../../../transformers/import-path-to-package-prefix/import-path-to-package-prefix-transformer';
import { filePathToDisplayNameTransformer } from '../../../transformers/file-path-to-display-name/file-path-to-display-name-transformer';
import { filePathToSymbolNameTransformer } from '../../../transformers/file-path-to-symbol-name/file-path-to-symbol-name-transformer';
import { importsInFolderTypeFindLayerBroker } from './imports-in-folder-type-find-layer-broker';
import { adapterLinesRenderLayerBroker } from './adapter-lines-render-layer-broker';

export const responderLinesRenderLayerBroker = ({
  flowFile,
  packageSrcPath,
  renderingFilePath,
}: {
  flowFile: AbsoluteFilePath;
  packageSrcPath: AbsoluteFilePath;
  renderingFilePath: AbsoluteFilePath;
}): ContentText[] => {
  const responders = importsInFolderTypeFindLayerBroker({
    sourceFile: flowFile,
    packageSrcPath,
    folderType: 'responders',
  });
  const lines: ContentText[] = [];

  for (const responderFile of responders) {
    const symbolName = filePathToSymbolNameTransformer({ filePath: responderFile });

    let renderName: ContentText = filePathToDisplayNameTransformer({
      filePath: responderFile,
      packageSrcPath,
    });
    try {
      renderName = importPathToPackagePrefixTransformer({
        renderingFilePath,
        referencedFilePath: responderFile,
        symbolName: String(symbolName),
      });
    } catch {
      // keep displayName as fallback
    }

    lines.push(contentTextContract.parse(`  ↳ ${String(renderName)}`));

    const adapterLines = adapterLinesRenderLayerBroker({
      responderFile,
      packageSrcPath,
      renderingFilePath,
    });
    for (const al of adapterLines) {
      lines.push(al);
    }
  }

  return lines;
};

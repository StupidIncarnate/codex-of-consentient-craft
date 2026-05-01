/**
 * PURPOSE: Reads a widget source file and extracts its outgoing edges — child widget imports
 * and binding imports — by resolving relative import paths
 *
 * USAGE:
 * const edges = extractWidgetEdgesLayerBroker({
 *   widgetFilePath: absoluteFilePathContract.parse('/repo/packages/web/src/widgets/quest-chat/quest-chat-widget.tsx'),
 *   packageSrcPath: absoluteFilePathContract.parse('/repo/packages/web/src'),
 *   widgetFileSet: new Set([...widgetFilePaths.map(String)]),
 * });
 * // Returns { childWidgetPaths, bindingNames } for this widget
 *
 * WHEN-TO-USE: Widget-tree broker building the widget composition graph, called once per widget file
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import type { WidgetEdges } from '../../../contracts/widget-edges/widget-edges-contract';
import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';
import { widgetTreeStatics } from '../../../statics/widget-tree/widget-tree-statics';
import { readWidgetSourceLayerBroker } from './read-widget-source-layer-broker';

export const extractWidgetEdgesLayerBroker = ({
  widgetFilePath,
  packageSrcPath,
  widgetFileSet,
}: {
  widgetFilePath: AbsoluteFilePath;
  packageSrcPath: AbsoluteFilePath;
  widgetFileSet: Set<AbsoluteFilePath>;
}): WidgetEdges => {
  const content = readWidgetSourceLayerBroker({ filePath: widgetFilePath });
  if (content === undefined) {
    return { childWidgetPaths: [], bindingNames: [] };
  }

  const importPaths = importStatementsExtractTransformer({ source: content });
  const childWidgetPaths: AbsoluteFilePath[] = [];
  const bindingNames: ContentText[] = [];
  const bindingsFolder = `${String(packageSrcPath)}/${widgetTreeStatics.bindingsFolderName}/`;

  for (const importPath of importPaths) {
    const resolved = relativeImportResolveTransformer({ sourceFile: widgetFilePath, importPath });
    if (resolved === null) continue;

    // Check if resolved is a widget (with .ts or .tsx)
    if (widgetFileSet.has(resolved)) {
      childWidgetPaths.push(resolved);
      continue;
    }
    if (resolved.endsWith(widgetTreeStatics.tsSuffix)) {
      const withTsx = absoluteFilePathContract.parse(
        `${String(resolved).slice(0, -widgetTreeStatics.tsSuffix.length)}${widgetTreeStatics.tsxSuffix}`,
      );
      if (widgetFileSet.has(withTsx)) {
        childWidgetPaths.push(withTsx);
        continue;
      }
    }

    // Check if resolved is a binding
    if (String(resolved).startsWith(bindingsFolder)) {
      const parts = String(importPath).split('/');
      const lastName = parts[parts.length - 1];
      if (lastName !== undefined) {
        bindingNames.push(contentTextContract.parse(lastName));
      }
    }
  }

  return { childWidgetPaths, bindingNames };
};

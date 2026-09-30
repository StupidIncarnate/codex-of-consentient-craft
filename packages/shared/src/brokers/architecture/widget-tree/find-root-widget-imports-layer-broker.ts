/**
 * PURPOSE: Scans a package's responders/ and flows/ directories to find which widget files
 * are imported (i.e., are root entry points in the widget composition graph)
 *
 * USAGE:
 * const rootPaths = findRootWidgetImportsLayerBroker({
 *   packageSrcPath: '/repo/packages/web/src',
 *   widgetFilePaths: ['/repo/.../quest-chat-widget.tsx'],
 * });
 * // Returns the subset of widgetFilePaths imported by any file in responders/ or flows/
 *
 * WHEN-TO-USE: Widget-tree broker identifying root widgets (UI entry points) for the composition tree
 */

import { importStatementsExtractTransformer } from '../../../transformers/import-statements-extract/import-statements-extract-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';
import { widgetTreeStatics } from '../../../statics/widget-tree/widget-tree-statics';
import { collectFolderFilesLayerBroker } from './collect-folder-files-layer-broker';
import { readWidgetSourceLayerBroker } from './read-widget-source-layer-broker';

export const findRootWidgetImportsLayerBroker = ({
  packageSrcPath,
  widgetFilePaths,
}: {
  packageSrcPath: string;
  widgetFilePaths: string[];
}): string[] => {
  if (widgetFilePaths.length === 0) {
    return [];
  }

  // Build a lookup map: widget path string → AbsoluteFilePath
  const widgetByPath = new Map<string, string>();
  for (const fp of widgetFilePaths) {
    widgetByPath.set(fp, fp);
  }

  // Collect all source files from responders/ and flows/
  const sourceFiles: string[] = [];
  for (const folder of widgetTreeStatics.rootSourceFolders) {
    const folderPath = `${packageSrcPath}/${folder}`;
    const files = collectFolderFilesLayerBroker({ dirPath: folderPath });
    for (const f of files) {
      sourceFiles.push(f);
    }
  }

  // Find which widget files are imported
  const rootPaths = new Set<string>();
  for (const sourceFile of sourceFiles) {
    const content = readWidgetSourceLayerBroker({ filePath: sourceFile });
    if (content === undefined) continue;

    const importPaths = importStatementsExtractTransformer({ source: content });
    for (const importPath of importPaths) {
      const resolved = relativeImportResolveTransformer({ sourceFile, importPath });
      if (resolved === null) continue;

      // Try as-is (.ts resolved)
      if (widgetByPath.has(resolved)) {
        rootPaths.add(resolved);
        continue;
      }

      // Try swapping .ts → .tsx for widget files (relativeImportResolveTransformer appends .ts)
      if (resolved.endsWith(widgetTreeStatics.tsSuffix)) {
        const withTsx = `${resolved.slice(0, -widgetTreeStatics.tsSuffix.length)}${widgetTreeStatics.tsxSuffix}`;
        if (widgetByPath.has(withTsx)) {
          rootPaths.add(withTsx);
        }
      }
    }
  }

  return widgetFilePaths.filter((p) => rootPaths.has(p));
};

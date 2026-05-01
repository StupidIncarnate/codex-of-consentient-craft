/**
 * PURPOSE: Builds a widget composition tree for the frontend-react project-map headline renderer
 *
 * USAGE:
 * const result = architectureWidgetTreeBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/web'),
 * });
 * // Returns WidgetTreeResult with roots[] (2-level tree) and hubs[] (in-degree >= 5)
 *
 * WHEN-TO-USE: Frontend-react project-map renderer that needs the widget composition tree
 * WHEN-NOT-TO-USE: Non-frontend-react packages (no widgets/ directory)
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { fileCountContract } from '../../../contracts/file-count/file-count-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import {
  widgetTreeResultContract,
  type WidgetTreeResult,
} from '../../../contracts/widget-tree-result/widget-tree-result-contract';
import { layerFileParentResolveTransformer } from '../../../transformers/layer-file-parent-resolve/layer-file-parent-resolve-transformer';
import { widgetFileNameExtractTransformer } from '../../../transformers/widget-file-name-extract/widget-file-name-extract-transformer';
import { widgetTreeStatics } from '../../../statics/widget-tree/widget-tree-statics';
import { listWidgetFilesLayerBroker } from './list-widget-files-layer-broker';
import { findRootWidgetImportsLayerBroker } from './find-root-widget-imports-layer-broker';
import { extractWidgetEdgesLayerBroker } from './extract-widget-edges-layer-broker';
import { buildWidgetNodeLayerBroker } from './build-widget-node-layer-broker';
import type { FileCount } from '../../../contracts/file-count/file-count-contract';

export const architectureWidgetTreeBroker = ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): WidgetTreeResult => {
  const packageSrcPath = absoluteFilePathContract.parse(`${String(packageRoot)}/src`);
  const widgetsDirPath = absoluteFilePathContract.parse(
    `${String(packageSrcPath)}/${widgetTreeStatics.widgetsFolderName}`,
  );

  // Step 1: Collect all widget files (non-test)
  const allWidgetFiles = listWidgetFilesLayerBroker({ widgetsDirPath });

  // Step 2: Separate layer files from entry widget files (layer files inlined under parents)
  const entryWidgetFiles: AbsoluteFilePath[] = [];
  for (const widgetFile of allWidgetFiles) {
    const parentOrNull = layerFileParentResolveTransformer({
      layerFilePath: filePathContract.parse(widgetFile),
    });
    if (parentOrNull === null) {
      entryWidgetFiles.push(widgetFile);
    }
  }

  if (entryWidgetFiles.length === 0) {
    return widgetTreeResultContract.parse({ roots: [], hubs: [] });
  }

  const widgetFileSet = new Set<AbsoluteFilePath>(entryWidgetFiles);

  // Step 3: Extract edges for each entry widget
  const edgesMap = new Map<AbsoluteFilePath, ReturnType<typeof extractWidgetEdgesLayerBroker>>();
  for (const widgetFile of entryWidgetFiles) {
    edgesMap.set(
      widgetFile,
      extractWidgetEdgesLayerBroker({
        widgetFilePath: widgetFile,
        packageSrcPath,
        widgetFileSet,
      }),
    );
  }

  // Step 4: Compute in-degree for each widget
  const inDegree = new Map<AbsoluteFilePath, FileCount>();
  for (const widgetFile of entryWidgetFiles) {
    if (!inDegree.has(widgetFile)) {
      inDegree.set(widgetFile, fileCountContract.parse(0));
    }
    const edges = edgesMap.get(widgetFile);
    if (edges === undefined) continue;
    for (const childPath of edges.childWidgetPaths) {
      inDegree.set(childPath, fileCountContract.parse((inDegree.get(childPath) ?? 0) + 1));
    }
  }

  // Step 5: Identify hubs (in-degree >= threshold)
  const hubPaths = new Set<AbsoluteFilePath>();
  for (const [widgetFile, degree] of inDegree) {
    if (degree >= widgetTreeStatics.hubInDegreeThreshold) {
      hubPaths.add(widgetFile);
    }
  }

  // Step 6: Find roots (widgets imported by responders/ or flows/)
  const rootPaths = findRootWidgetImportsLayerBroker({
    packageSrcPath,
    widgetFilePaths: entryWidgetFiles,
  });

  // Step 7: Build the tree from roots (up to maxChildDepth levels)
  const roots = rootPaths.map((rootPath) =>
    buildWidgetNodeLayerBroker({
      filePath: rootPath,
      widgetFileSet,
      edgesMap,
      hubPaths,
      depth: 0,
    }),
  );

  // Step 8: Collect hub names for the hubs list
  const hubs = [...hubPaths].map((fp) => widgetFileNameExtractTransformer({ filePath: fp }));

  return widgetTreeResultContract.parse({ roots, hubs });
};

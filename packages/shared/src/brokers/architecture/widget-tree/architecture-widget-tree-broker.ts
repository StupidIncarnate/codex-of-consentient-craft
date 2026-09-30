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

export const architectureWidgetTreeBroker = ({
  packageRoot,
}: {
  packageRoot: string;
}): WidgetTreeResult => {
  const packageSrcPath = `${packageRoot}/src`;
  const widgetsDirPath = `${packageSrcPath}/${widgetTreeStatics.widgetsFolderName}`;

  // Step 1: Collect all widget files (non-test)
  const allWidgetFiles = listWidgetFilesLayerBroker({ widgetsDirPath });

  // Step 2: Separate layer files from entry widget files (layer files inlined under parents)
  const entryWidgetFiles: string[] = [];
  for (const widgetFile of allWidgetFiles) {
    const parentOrNull = layerFileParentResolveTransformer({
      layerFilePath: widgetFile,
    });
    if (parentOrNull === null) {
      entryWidgetFiles.push(widgetFile);
    }
  }

  if (entryWidgetFiles.length === 0) {
    return widgetTreeResultContract.parse({ roots: [], hubs: [] });
  }

  const widgetFileSet = new Set<string>(entryWidgetFiles);

  // Step 3: Extract edges for each entry widget
  const edgesMap = new Map<string, ReturnType<typeof extractWidgetEdgesLayerBroker>>();
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
  const inDegree = new Map<string, number>();
  for (const widgetFile of entryWidgetFiles) {
    if (!inDegree.has(widgetFile)) {
      inDegree.set(widgetFile, 0);
    }
    const edges = edgesMap.get(widgetFile);
    if (edges === undefined) continue;
    for (const childPath of edges.childWidgetPaths) {
      inDegree.set(childPath, (inDegree.get(childPath) ?? 0) + 1);
    }
  }

  // Step 5: Identify hubs (in-degree >= threshold)
  const hubPaths = new Set<string>();
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

  // Step 7: Build the tree from roots. Shared visited set across roots prevents cycles and
  // duplicates a widget reused under multiple roots — first appearance fully expanded,
  // subsequent appearances render as stub leaves.
  const visited = new Set<string>();
  const roots = rootPaths.map((rootPath) =>
    buildWidgetNodeLayerBroker({
      filePath: rootPath,
      widgetFileSet,
      edgesMap,
      hubPaths,
      visited,
    }),
  );

  // Step 8: Collect hub names for the hubs list
  const hubs = [...hubPaths].map((fp) => widgetFileNameExtractTransformer({ filePath: fp }));

  return widgetTreeResultContract.parse({ roots, hubs });
};

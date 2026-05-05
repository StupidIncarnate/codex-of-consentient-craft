/**
 * PURPOSE: Recursively builds a WidgetNode from pre-fetched edge data, walking the full widget
 * composition tree. Hub children (in-degree ≥ hubInDegreeThreshold) appear as stub leaf nodes
 * for noise control. Already-visited widgets also appear as stub leaves to prevent cycles.
 *
 * USAGE:
 * const node = buildWidgetNodeLayerBroker({
 *   filePath,
 *   widgetFileSet,
 *   edgesMap,
 *   hubPaths,
 *   visited: new Set(),
 * });
 * // Returns a fully constructed WidgetNode tree
 *
 * WHEN-TO-USE: Widget-tree broker building root trees after edges and hubs are computed
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  widgetNodeContract,
  type WidgetNode,
} from '../../../contracts/widget-node/widget-node-contract';
import { widgetFileNameExtractTransformer } from '../../../transformers/widget-file-name-extract/widget-file-name-extract-transformer';
import type { WidgetEdges } from '../../../contracts/widget-edges/widget-edges-contract';

export const buildWidgetNodeLayerBroker = ({
  filePath,
  widgetFileSet,
  edgesMap,
  hubPaths,
  visited,
}: {
  filePath: AbsoluteFilePath;
  widgetFileSet: Set<AbsoluteFilePath>;
  edgesMap: Map<AbsoluteFilePath, WidgetEdges>;
  hubPaths: Set<AbsoluteFilePath>;
  visited: Set<AbsoluteFilePath>;
}): WidgetNode => {
  if (visited.has(filePath)) {
    return widgetNodeContract.parse({
      widgetName: widgetFileNameExtractTransformer({ filePath }),
      filePath,
      bindingsAttached: [],
      children: [],
    });
  }
  visited.add(filePath);

  const edges = edgesMap.get(filePath) ?? { childWidgetPaths: [], bindingNames: [] };
  const widgetName = widgetFileNameExtractTransformer({ filePath });

  const children: WidgetNode[] = [];
  for (const childPath of edges.childWidgetPaths) {
    if (hubPaths.has(childPath)) {
      children.push(
        widgetNodeContract.parse({
          widgetName: widgetFileNameExtractTransformer({ filePath: childPath }),
          filePath: childPath,
          bindingsAttached: [],
          children: [],
        }),
      );
    } else {
      children.push(
        buildWidgetNodeLayerBroker({
          filePath: childPath,
          widgetFileSet,
          edgesMap,
          hubPaths,
          visited,
        }),
      );
    }
  }

  return widgetNodeContract.parse({
    widgetName,
    filePath,
    bindingsAttached: edges.bindingNames,
    children,
  });
};

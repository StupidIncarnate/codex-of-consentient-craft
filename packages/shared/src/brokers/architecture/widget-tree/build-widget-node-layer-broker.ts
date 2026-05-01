/**
 * PURPOSE: Recursively builds a WidgetNode from pre-fetched edge data, expanding children up to
 * maxChildDepth levels and replacing hub children with stub leaf nodes
 *
 * USAGE:
 * const node = buildWidgetNodeLayerBroker({
 *   filePath,
 *   widgetFileSet,
 *   edgesMap,
 *   hubPaths,
 *   depth: 0,
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
import { widgetTreeStatics } from '../../../statics/widget-tree/widget-tree-statics';
import { widgetFileNameExtractTransformer } from '../../../transformers/widget-file-name-extract/widget-file-name-extract-transformer';
import type { WidgetEdges } from '../../../contracts/widget-edges/widget-edges-contract';

export const buildWidgetNodeLayerBroker = ({
  filePath,
  widgetFileSet,
  edgesMap,
  hubPaths,
  depth,
}: {
  filePath: AbsoluteFilePath;
  widgetFileSet: Set<AbsoluteFilePath>;
  edgesMap: Map<AbsoluteFilePath, WidgetEdges>;
  hubPaths: Set<AbsoluteFilePath>;
  depth: number;
}): WidgetNode => {
  const edges = edgesMap.get(filePath) ?? { childWidgetPaths: [], bindingNames: [] };
  const widgetName = widgetFileNameExtractTransformer({ filePath });

  const children: WidgetNode[] = [];
  if (depth < widgetTreeStatics.maxChildDepth) {
    for (const childPath of edges.childWidgetPaths) {
      if (hubPaths.has(childPath)) {
        // Hub children appear as stub leaf nodes (not expanded further)
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
            depth: depth + 1,
          }),
        );
      }
    }
  }

  return widgetNodeContract.parse({
    widgetName,
    filePath,
    bindingsAttached: edges.bindingNames,
    children,
  });
};

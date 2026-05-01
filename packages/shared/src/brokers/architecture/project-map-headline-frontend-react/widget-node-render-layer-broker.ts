/**
 * PURPOSE: Renders a single WidgetNode as tree-style ASCII lines (used recursively for children
 * in the widget composition section). Each node shows its name and bindings, followed by
 * recursively rendered grandchildren.
 *
 * USAGE:
 * const lines = widgetNodeRenderLayerBroker({
 *   node,
 *   prefix: contentTextContract.parse(''),
 *   isLast: true,
 * });
 * // Returns ContentText[] with tree connector lines for the node and its descendants
 *
 * WHEN-TO-USE: widget-tree-section-render-layer-broker building the composition tree
 */

import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import type { WidgetNode } from '../../../contracts/widget-node/widget-node-contract';
import { projectMapHeadlineFrontendReactStatics } from '../../../statics/project-map-headline-frontend-react/project-map-headline-frontend-react-statics';

export const widgetNodeRenderLayerBroker = ({
  node,
  prefix,
  isLast,
}: {
  node: WidgetNode;
  prefix: ContentText;
  isLast: boolean;
}): ContentText[] => {
  const { pipe, branch, last, indent } = projectMapHeadlineFrontendReactStatics.treeConnectors;
  const connector = isLast ? last : branch;
  const lines: ContentText[] = [];

  lines.push(contentTextContract.parse(`${String(prefix)}${connector} ${String(node.widgetName)}`));

  const childIndentStr = isLast ? `${String(prefix)}${indent}` : `${String(prefix)}${pipe}  `;

  if (node.bindingsAttached.length > 0) {
    lines.push(
      contentTextContract.parse(
        `${childIndentStr}bindings: ${node.bindingsAttached.map(String).join(', ')}`,
      ),
    );
  }

  const grandChildPrefix = contentTextContract.parse(childIndentStr);
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child === undefined) continue;
    const childIsLast = i === node.children.length - 1;
    lines.push(
      ...widgetNodeRenderLayerBroker({
        node: child,
        prefix: grandChildPrefix,
        isLast: childIsLast,
      }),
    );
  }

  return lines;
};

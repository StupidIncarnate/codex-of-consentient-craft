/**
 * PURPOSE: Renders the ## Widget composition section for a frontend-react package in the
 * project-map connection-graph view. Produces a tree-style ASCII tree (2 levels) with
 * binding names listed per widget.
 *
 * USAGE:
 * const section = widgetTreeSectionRenderLayerBroker({
 *   widgetTree: { roots: [...], hubs: [] },
 * });
 * // Returns ContentText with ## Widget composition header and tree lines
 *
 * WHEN-TO-USE: project-map-headline-frontend-react-broker building the composition section
 */

import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import type { WidgetTreeResult } from '../../../contracts/widget-tree-result/widget-tree-result-contract';
import { projectMapHeadlineFrontendReactStatics } from '../../../statics/project-map-headline-frontend-react/project-map-headline-frontend-react-statics';
import { widgetNodeRenderLayerBroker } from './widget-node-render-layer-broker';

export const widgetTreeSectionRenderLayerBroker = ({
  widgetTree,
}: {
  widgetTree: WidgetTreeResult;
}): ContentText => {
  const { compositionSectionHeader, compositionSectionEmpty } =
    projectMapHeadlineFrontendReactStatics;

  if (widgetTree.roots.length === 0) {
    return contentTextContract.parse(`${compositionSectionHeader}\n\n${compositionSectionEmpty}`);
  }

  const lines: ContentText[] = [
    contentTextContract.parse(compositionSectionHeader),
    contentTextContract.parse(''),
  ];

  const emptyPrefix = contentTextContract.parse('');

  for (const root of widgetTree.roots) {
    lines.push(contentTextContract.parse(String(root.widgetName)));

    if (root.bindingsAttached.length > 0) {
      lines.push(
        contentTextContract.parse(
          `${projectMapHeadlineFrontendReactStatics.bindingsPrefix}${root.bindingsAttached.map(String).join(', ')}`,
        ),
      );
    }

    for (let i = 0; i < root.children.length; i++) {
      const child = root.children[i];
      if (child === undefined) continue;
      const childIsLast = i === root.children.length - 1;
      lines.push(
        ...widgetNodeRenderLayerBroker({ node: child, prefix: emptyPrefix, isLast: childIsLast }),
      );
    }
  }

  return contentTextContract.parse(lines.map(String).join('\n'));
};

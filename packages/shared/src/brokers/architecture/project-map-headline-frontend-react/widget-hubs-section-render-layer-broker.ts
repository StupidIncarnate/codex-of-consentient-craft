/**
 * PURPOSE: Renders the ## Widget hubs section for a frontend-react package in the
 * project-map connection-graph view. Lists all hub widgets (in-degree >= 5) by name.
 *
 * USAGE:
 * const section = widgetHubsSectionRenderLayerBroker({
 *   widgetTree: { roots: [], hubs: ['chat-entry-list-widget', 'pixel-btn-widget'] },
 * });
 * // Returns ContentText with ## Widget hubs header and hub names comma-separated
 *
 * WHEN-TO-USE: project-map-headline-frontend-react-broker building the hubs section
 */

import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import type { WidgetTreeResult } from '../../../contracts/widget-tree-result/widget-tree-result-contract';
import { projectMapHeadlineFrontendReactStatics } from '../../../statics/project-map-headline-frontend-react/project-map-headline-frontend-react-statics';

export const widgetHubsSectionRenderLayerBroker = ({
  widgetTree,
}: {
  widgetTree: WidgetTreeResult;
}): ContentText => {
  const { hubsSectionHeader, hubsSectionEmpty } = projectMapHeadlineFrontendReactStatics;

  if (widgetTree.hubs.length === 0) {
    return contentTextContract.parse(`${hubsSectionHeader}\n\n${hubsSectionEmpty}`);
  }

  const hubNames = widgetTree.hubs.map(String).join(', ');
  return contentTextContract.parse(`${hubsSectionHeader}\n\n${hubNames}`);
};

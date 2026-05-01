/**
 * PURPOSE: Renders the Widget composition tree and Detailed exemplar sections for a
 * frontend-react package in the project-map connection-graph view. Outputs a 2-level
 * widget tree with bindings, a hubs list, and one user-interaction exemplar trace
 * (click → broker → HTTP edge → state writes → re-render).
 *
 * USAGE:
 * const markdown = architectureProjectMapHeadlineFrontendReactBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/web'),
 * });
 * // Returns ContentText markdown with ## Widget composition, ## Widget hubs,
 * // and ## Detailed exemplar sections
 *
 * WHEN-TO-USE: As the headline renderer for packages detected as frontend-react type
 * WHEN-NOT-TO-USE: For non-frontend-react packages (no widgets/ directory)
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { architectureWidgetTreeBroker } from '../widget-tree/architecture-widget-tree-broker';
import { architectureEdgeGraphBroker } from '../edge-graph/architecture-edge-graph-broker';
import { architectureStateWritesBroker } from '../state-writes/architecture-state-writes-broker';
import { widgetTreeSectionRenderLayerBroker } from './widget-tree-section-render-layer-broker';
import { widgetHubsSectionRenderLayerBroker } from './widget-hubs-section-render-layer-broker';
import { widgetExemplarSectionRenderLayerBroker } from './widget-exemplar-section-render-layer-broker';

export const architectureProjectMapHeadlineFrontendReactBroker = ({
  projectRoot,
  packageRoot,
}: {
  projectRoot: AbsoluteFilePath;
  packageRoot: AbsoluteFilePath;
}): ContentText => {
  const widgetTree = architectureWidgetTreeBroker({ packageRoot });
  const httpEdges = architectureEdgeGraphBroker({ projectRoot });
  const stateResult = architectureStateWritesBroker({ packageRoot });

  const compositionSection = widgetTreeSectionRenderLayerBroker({ widgetTree });
  const hubsSection = widgetHubsSectionRenderLayerBroker({ widgetTree });
  const exemplarSection = widgetExemplarSectionRenderLayerBroker({
    widgetTree,
    httpEdges,
    stateResult,
    packageRoot,
  });

  return contentTextContract.parse(
    [String(compositionSection), '---', String(hubsSection), '---', String(exemplarSection)].join(
      '\n\n',
    ),
  );
};

/**
 * PURPOSE: Renders the Routes table section for an http-backend package in the project-map
 * connection-graph view. Routes are grouped by flow file.
 *
 * USAGE:
 * const markdown = architectureProjectMapHeadlineHttpBackendBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/server'),
 * });
 * // Returns ContentText markdown with ## Routes section
 *
 * WHEN-TO-USE: As the headline renderer for packages detected as http-backend type
 * WHEN-NOT-TO-USE: For non-http-backend packages
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { architectureEdgeGraphBroker } from '../edge-graph/architecture-edge-graph-broker';
import { routesForPackageFilterLayerBroker } from './routes-for-package-filter-layer-broker';
import { routesSectionRenderLayerBroker } from './routes-section-render-layer-broker';

export const architectureProjectMapHeadlineHttpBackendBroker = ({
  projectRoot,
  packageRoot,
}: {
  projectRoot: AbsoluteFilePath;
  packageRoot: AbsoluteFilePath;
}): ContentText => {
  const allEdges = architectureEdgeGraphBroker({ projectRoot });
  const packageEdges = routesForPackageFilterLayerBroker({ allEdges, packageRoot });

  const routesSection = routesSectionRenderLayerBroker({
    edges: packageEdges,
    packageRoot,
    projectRoot,
  });

  return contentTextContract.parse(`${String(routesSection)}\n\n---`);
};

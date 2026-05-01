/**
 * PURPOSE: Filters an HttpEdge array to only edges whose serverFlowFile belongs to the
 * given packageRoot directory
 *
 * USAGE:
 * const edges = routesForPackageFilterLayerBroker({
 *   allEdges: httpEdges,
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/server'),
 * });
 * // Returns HttpEdge[] where serverFlowFile starts with packageRoot
 *
 * WHEN-TO-USE: http-backend headline broker isolating server edges for the current package
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { HttpEdge } from '../../../contracts/http-edge/http-edge-contract';

export const routesForPackageFilterLayerBroker = ({
  allEdges,
  packageRoot,
}: {
  allEdges: HttpEdge[];
  packageRoot: AbsoluteFilePath;
}): HttpEdge[] => {
  const packageRootStr = String(packageRoot);
  return allEdges.filter(
    (e) => e.serverFlowFile !== null && String(e.serverFlowFile).startsWith(packageRootStr),
  );
};

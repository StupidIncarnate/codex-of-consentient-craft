/**
 * PURPOSE: Entry point for the edge-graph layer — returns all HTTP edges for a project by
 * scanning server flow files and web broker files for route registrations and fetch calls.
 *
 * USAGE:
 * const edges = architectureEdgeGraphBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 * });
 * // Returns HttpEdge[] with paired=true for server+web matches, paired=false for orphans
 *
 * WHEN-TO-USE: Project-map headline renderers that need HTTP edge records
 * WHEN-NOT-TO-USE: When TypeScript AST-level accuracy is required (regex v1 heuristic)
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { HttpEdge } from '../../../contracts/http-edge/http-edge-contract';
import { httpEdgesLayerBroker } from './http-edges-layer-broker';

export const architectureEdgeGraphBroker = ({
  projectRoot,
}: {
  projectRoot: AbsoluteFilePath;
}): HttpEdge[] => httpEdgesLayerBroker({ projectRoot });

/**
 * PURPOSE: Filters a WsEdge array to those edges where the emitter file is under the given
 * package root, or where at least one consumer file is under the package root.
 *
 * USAGE:
 * const { emitterEdges, consumerEdges } = wsEdgesFilterLayerBroker({
 *   wsEdges,
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/orchestrator'),
 * });
 * // emitterEdges — edges emitted by this package
 * // consumerEdges — edges consumed by this package (excluding those also emitted here)
 *
 * WHEN-TO-USE: Side-channel broker filtering WS edges relevant to a specific package
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { WsEdge } from '../../../contracts/ws-edge/ws-edge-contract';

export const wsEdgesFilterLayerBroker = ({
  wsEdges,
  packageRoot,
}: {
  wsEdges: WsEdge[];
  packageRoot: AbsoluteFilePath;
}): { emitterEdges: WsEdge[]; consumerEdges: WsEdge[] } => {
  const pkgPrefix = `${String(packageRoot)}/`;

  const emitterEdges = wsEdges.filter(
    (edge) => edge.emitterFile !== null && String(edge.emitterFile).startsWith(pkgPrefix),
  );

  const emitterEventTypes = new Set(emitterEdges.map((e) => String(e.eventType)));

  const consumerEdges = wsEdges.filter(
    (edge) =>
      !emitterEventTypes.has(String(edge.eventType)) &&
      edge.consumerFiles.some((cf) => String(cf).startsWith(pkgPrefix)),
  );

  return { emitterEdges, consumerEdges };
};

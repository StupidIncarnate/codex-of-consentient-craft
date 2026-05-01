/**
 * PURPOSE: Filters a FileBusEdge array to those edges where the writer file or watcher file
 * is under the given package root.
 *
 * USAGE:
 * const { writerEdges, watcherEdges } = fileBusEdgesFilterLayerBroker({
 *   fileBusEdges,
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/orchestrator'),
 * });
 * // writerEdges — edges written by this package
 * // watcherEdges — edges watched (consumed) by this package
 *
 * WHEN-TO-USE: Side-channel broker filtering file-bus edges relevant to a specific package
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { FileBusEdge } from '../../../contracts/file-bus-edge/file-bus-edge-contract';

export const fileBusEdgesFilterLayerBroker = ({
  fileBusEdges,
  packageRoot,
}: {
  fileBusEdges: FileBusEdge[];
  packageRoot: AbsoluteFilePath;
}): { writerEdges: FileBusEdge[]; watcherEdges: FileBusEdge[] } => {
  const pkgPrefix = `${String(packageRoot)}/`;

  const writerEdges = fileBusEdges.filter(
    (edge) => edge.writerFile !== null && String(edge.writerFile).startsWith(pkgPrefix),
  );

  const watcherEdges = fileBusEdges.filter(
    (edge) => edge.watcherFile !== null && String(edge.watcherFile).startsWith(pkgPrefix),
  );

  return { writerEdges, watcherEdges };
};

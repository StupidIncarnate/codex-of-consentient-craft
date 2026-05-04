/**
 * PURPOSE: Builds a responder-annotation Map for an http-backend package — for each route
 * registered under the package, emits a `[METHOD url]` suffix on the responder line plus
 * `← packages/web (brokerName)` child lines for every consuming web broker (fan-in).
 *
 * USAGE:
 * const annotations = httpEdgesToAnnotationsLayerBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/server'),
 * });
 * // Returns ResponderAnnotationMap keyed by responder file path
 *
 * WHEN-TO-USE: Inside architecture-responder-annotations-broker for http-backend packages
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import type { HttpEdge } from '../../../contracts/http-edge/http-edge-contract';
import {
  responderAnnotationMapContract,
  type ResponderAnnotationMap,
} from '../../../contracts/responder-annotation-map/responder-annotation-map-contract';
import type { ResponderAnnotation } from '../../../contracts/responder-annotation/responder-annotation-contract';
import { architectureEdgeGraphBroker } from '../edge-graph/architecture-edge-graph-broker';
import { architectureBackRefBroker } from '../back-ref/architecture-back-ref-broker';

export const httpEdgesToAnnotationsLayerBroker = ({
  projectRoot,
  packageRoot,
}: {
  projectRoot: AbsoluteFilePath;
  packageRoot: AbsoluteFilePath;
}): ResponderAnnotationMap => {
  const allEdges = architectureEdgeGraphBroker({ projectRoot });
  const packageRootStr = String(packageRoot);

  // Collect edges that have a server responder file under this package.
  const grouped = new Map<AbsoluteFilePath, HttpEdge[]>();
  for (const edge of allEdges) {
    if (edge.serverResponderFile === null) continue;
    if (!String(edge.serverResponderFile).startsWith(packageRootStr)) continue;
    const existing = grouped.get(edge.serverResponderFile);
    if (existing === undefined) {
      grouped.set(edge.serverResponderFile, [edge]);
    } else {
      existing.push(edge);
    }
  }

  const result = new Map<AbsoluteFilePath, ResponderAnnotation>();

  for (const [responderFile, edges] of grouped) {
    // Build suffix: deduplicate (method, url) pairs so the same route isn't repeated.
    const routeKeys: ContentText[] = [];
    for (const edge of edges) {
      const routeKey = contentTextContract.parse(
        `${String(edge.method)} ${String(edge.urlPattern)}`,
      );
      const alreadyAdded = routeKeys.some((k) => String(k) === String(routeKey));
      if (!alreadyAdded) {
        routeKeys.push(routeKey);
      }
    }
    const suffix: ContentText | null =
      routeKeys.length === 0
        ? null
        : contentTextContract.parse(`[${routeKeys.map(String).join('; ')}]`);

    // Build childLines: deduplicate webBrokerFile entries, render each as ← packages/<pkg> (Symbol).
    const childLines: ContentText[] = [];
    const seenConsumerPaths: AbsoluteFilePath[] = [];
    for (const edge of edges) {
      if (edge.webBrokerFile === null) continue;
      const alreadySeen = seenConsumerPaths.some((p) => String(p) === String(edge.webBrokerFile));
      if (alreadySeen) continue;
      seenConsumerPaths.push(edge.webBrokerFile);
      const ref = architectureBackRefBroker({ filePath: edge.webBrokerFile, projectRoot });
      if (ref === null) continue;
      childLines.push(contentTextContract.parse(`← ${String(ref)}`));
    }

    result.set(responderFile, { suffix, childLines });
  }

  return responderAnnotationMapContract.parse(result);
};

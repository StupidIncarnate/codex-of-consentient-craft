/**
 * PURPOSE: Builds a responder-annotation Map for an http-backend package — for each route
 * registered under the package, emits a `[METHOD url]` suffix on the responder line plus
 * `← packages/<consuming-package> (brokerName)` child lines for every consuming frontend broker
 * (fan-in). The consuming package name is resolved per edge via architectureBackRefBroker, never
 * assumed.
 *
 * USAGE:
 * const annotations = httpEdgesToAnnotationsLayerBroker({
 *   projectRoot: '/repo',
 *   packageRoot: '/repo/packages/server',
 * });
 * // Returns ResponderAnnotationMap keyed by responder file path
 *
 * WHEN-TO-USE: Inside architecture-responder-annotations-broker for http-backend packages
 */

import type { HttpEdge } from '../../../contracts/http-edge/http-edge-contract';
import {
  responderAnnotationMapContract,
  type ResponderAnnotationMap,
} from '../../../contracts/responder-annotation-map/responder-annotation-map-contract';
import type { ResponderAnnotation } from '../../../contracts/responder-annotation/responder-annotation-contract';
import { architectureEdgeGraphBroker } from '../edge-graph/architecture-edge-graph-broker';
import { architectureBackRefBroker } from '../back-ref/architecture-back-ref-broker';
import { responderAnnotationContract } from '../../../contracts/responder-annotation/responder-annotation-contract';

export const httpEdgesToAnnotationsLayerBroker = ({
  projectRoot,
  packageRoot,
}: {
  projectRoot: string;
  packageRoot: string;
}): ResponderAnnotationMap => {
  const allEdges = architectureEdgeGraphBroker({ projectRoot });
  const packageRootStr = packageRoot;

  // Collect edges that have a server responder file under this package.
  const grouped = new Map<string, HttpEdge[]>();
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

  const result = new Map<string, ResponderAnnotation>();

  for (const [responderFile, edges] of grouped) {
    // Build suffix: deduplicate (method, url) pairs so the same route isn't repeated.
    const routeKeys: string[] = [];
    for (const edge of edges) {
      const routeKey = `${String(edge.method)} ${String(edge.urlPattern)}`;
      const alreadyAdded = routeKeys.some((k) => k === routeKey);
      if (!alreadyAdded) {
        routeKeys.push(routeKey);
      }
    }
    const suffix: string | null =
      routeKeys.length === 0 ? null : `[${routeKeys.map(String).join('; ')}]`;

    // Build childLines: deduplicate webBrokerFile entries, render each as ← packages/<pkg> (Symbol).
    const childLines: string[] = [];
    const seenConsumerPaths: string[] = [];
    for (const edge of edges) {
      if (edge.webBrokerFile === null) continue;
      const alreadySeen = seenConsumerPaths.some((p) => p === String(edge.webBrokerFile));
      if (alreadySeen) continue;
      seenConsumerPaths.push(edge.webBrokerFile);
      const ref = architectureBackRefBroker({ filePath: edge.webBrokerFile, projectRoot });
      if (ref === null) continue;
      childLines.push(`← ${ref}`);
    }

    result.set(responderFile, responderAnnotationContract.parse({ suffix, childLines }));
  }

  return responderAnnotationMapContract.parse(result);
};

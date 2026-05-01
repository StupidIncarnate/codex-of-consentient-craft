/**
 * PURPOSE: Picks the best exemplar HttpEdge from a list of package edges.
 * Prefers POST /api/quests/:questId/start when present; falls back to the first
 * non-trivial route (URL with more than minUrlSegmentsForNonTrivial segments), then
 * the first edge in the list.
 *
 * USAGE:
 * const edge = exemplarEdgePickLayerBroker({ edges: packageEdges });
 * // Returns HttpEdge or null if edges is empty
 *
 * WHEN-TO-USE: http-backend headline broker selecting which route to use as the detailed exemplar
 */

import type { HttpEdge } from '../../../contracts/http-edge/http-edge-contract';
import { projectMapHeadlineHttpBackendStatics } from '../../../statics/project-map-headline-http-backend/project-map-headline-http-backend-statics';
import { urlSegmentsExtractTransformer } from '../../../transformers/url-segments-extract/url-segments-extract-transformer';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';

export const exemplarEdgePickLayerBroker = ({ edges }: { edges: HttpEdge[] }): HttpEdge | null => {
  const startRoute = edges.find(
    (e) =>
      String(e.method) === projectMapHeadlineHttpBackendStatics.exemplarMethod &&
      String(e.urlPattern) === projectMapHeadlineHttpBackendStatics.exemplarPostUrl,
  );
  if (startRoute !== undefined) {
    return startRoute;
  }

  const nonTrivial = edges.find((e) => {
    const segments = urlSegmentsExtractTransformer({
      urlPattern: contentTextContract.parse(String(e.urlPattern)),
    });
    return segments.length >= projectMapHeadlineHttpBackendStatics.minUrlSegmentsForNonTrivial;
  });
  if (nonTrivial !== undefined) {
    return nonTrivial;
  }

  return edges[0] ?? null;
};

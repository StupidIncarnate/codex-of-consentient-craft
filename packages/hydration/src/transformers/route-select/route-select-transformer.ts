/**
 * PURPOSE: Picks the one route this target can actually run for one ingredient, or `null` when it
 * can run none. Reach for this over reading `routes` directly anywhere: the listing's `runs` line
 * and the pre-flight's refusal are the same rule asked twice, and two implementations of it can
 * disagree.
 *
 * USAGE:
 * routeSelectTransformer({ routes: HydrationRoutesStub({ write: fn }), hasBaseUrl: false });
 * // Returns 'write'
 */
import { hydrationRouteContract } from '../../contracts/hydration-route/hydration-route-contract';
import type { HydrationRoute } from '../../contracts/hydration-route/hydration-route-contract';
import type { HydrationRoutes } from '../../contracts/hydration-routes/hydration-routes-contract';

export const routeSelectTransformer = ({
  routes,
  hasBaseUrl,
}: {
  routes: HydrationRoutes;
  hasBaseUrl: boolean;
}): HydrationRoute | null => {
  if (hasBaseUrl && routes.api !== undefined) {
    return hydrationRouteContract.parse('api');
  }
  if (routes.write !== undefined) {
    return hydrationRouteContract.parse('write');
  }
  if (routes.recording !== undefined) {
    return hydrationRouteContract.parse('recording');
  }
  return null;
};

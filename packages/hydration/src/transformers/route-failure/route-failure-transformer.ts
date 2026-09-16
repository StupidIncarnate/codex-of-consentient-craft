/**
 * PURPOSE: Reads the three things `HydrationRouteFailedError` needs off whatever a route actually
 * threw. Reach for this rather than requiring every repo's route to throw a framework type: a
 * route is the repo's own code, and the runner has to name the URL and carry the body verbatim
 * whether or not that route used the framework's own `fetchPostAdapter`. A refused connection never
 * reaches a status, so `url` is mined on its own the moment it is present — `fetchPostAdapter`
 * attaches it to exactly that shape.
 *
 * USAGE:
 * routeFailureTransformer({ cause: new Error('connect ECONNREFUSED') });
 * // Returns { url: null, status: null, responseBody: null } — no url was ever attached
 */
import { routeFailureContract } from '../../contracts/route-failure/route-failure-contract';
import type { RouteFailure } from '../../contracts/route-failure/route-failure-contract';

export const routeFailureTransformer = ({ cause }: { cause: unknown }): RouteFailure => {
  if (
    typeof cause === 'object' &&
    cause !== null &&
    'url' in cause &&
    typeof cause.url === 'string'
  ) {
    if ('status' in cause && typeof cause.status === 'number') {
      if ('body' in cause && typeof cause.body === 'string') {
        return routeFailureContract.parse({
          url: cause.url,
          status: cause.status,
          responseBody: cause.body,
        });
      }
      return routeFailureContract.parse({
        url: cause.url,
        status: cause.status,
        responseBody: null,
      });
    }
    return routeFailureContract.parse({ url: cause.url, status: null, responseBody: null });
  }

  return routeFailureContract.parse({ url: null, status: null, responseBody: null });
};

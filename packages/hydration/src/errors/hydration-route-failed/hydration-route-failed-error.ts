/**
 * PURPOSE: Halts a plan whose `api` route threw or answered badly when the runner actually invoked
 * it — a refused connection, or a 4xx/5xx status — carrying the response body VERBATIM, because that
 * body is usually the real diagnosis. Reach for this over `HydrationRouteUnavailableError`: this
 * fires only once a route has actually run; the other fires from the plan's shape before anything
 * runs at all.
 *
 * `url` is nullable, honestly: a route built on the framework's own `fetchPostAdapter` always knows
 * it, but an ingredient's bespoke route can throw a bare value carrying no address at all, and
 * `routeFailureTransformer` then mines `url: null`. Naming a fabricated placeholder in that case
 * would look like data and carry none, so the message says plainly that no URL is known instead.
 *
 * USAGE:
 * throw new HydrationRouteFailedError({
 *   recipeName: 'guild-mid-execution',
 *   ingredientName: 'guild',
 *   route: 'api',
 *   url: 'http://localhost:3737/api/guilds',
 *   status: 500,
 *   responseBody: '{"error":"database unavailable"}',
 *   cause: null,
 * });
 * // Throws error naming the route, the URL, the status and the response body verbatim
 *
 * WHEN-TO-USE: From the runner, once an `api` route's call either rejects (connection refused,
 * `status: null`) or resolves with a non-2xx status.
 * WHEN-NOT-TO-USE: When a route resolves 2xx but the body it returns fails `record`'s own shape —
 * that is `HydrationRecordShapeError`, a different diagnosis pointing at a different fix.
 */
export class HydrationRouteFailedError extends Error {
  public constructor({
    recipeName,
    ingredientName,
    route,
    url,
    status,
    responseBody,
    cause,
  }: {
    recipeName: string;
    ingredientName: string;
    route: string;
    url: string | null;
    status: number | null;
    responseBody: string | null;
    cause: unknown;
  }) {
    const outcome =
      url === null
        ? `refused the connection with no URL known: ${String(cause)}`
        : status === null
          ? `at ${url} refused the connection: ${String(cause)}`
          : `at ${url} answered ${String(status)} with body: ${responseBody === null ? '(empty)' : responseBody}`;
    super(`recipe "${recipeName}": ingredient "${ingredientName}"'s "${route}" route ${outcome}`);
    this.name = 'HydrationRouteFailedError';
  }
}

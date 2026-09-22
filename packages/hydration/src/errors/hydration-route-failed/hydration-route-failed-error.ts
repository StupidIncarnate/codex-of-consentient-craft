/**
 * PURPOSE: Halts a plan whose `api` route threw or answered badly when the runner actually invoked
 * it, carrying the response body VERBATIM, because that body is usually the real diagnosis. Reach
 * for this over `HydrationRouteUnavailableError`: this fires only once a route has actually run; the
 * other fires from the plan's shape before anything runs at all.
 *
 * `url` and `status` are nullable, honestly, and the wording asserts only what their nullness
 * actually proves. `fetchPostAdapter` is the ONE producer of a `cause` carrying a `url` but no
 * `status` — it rejects ONLY on a transport failure (a refused connection, a DNS failure) — so that
 * combination really is a connection refusal and reads as one. A `url: null` proves far less: an
 * ingredient's bespoke route (one not built on `fetchPostAdapter`) can throw ANYTHING with no `url`
 * attached — a genuine transport error, or something with nothing to do with a network at all, such
 * as a status-transition gate refusing for lack of content. `routeFailureTransformer` mines
 * `url: null` for both alike, so this class cannot tell them apart there and must not guess one: it
 * names the route and defers to the cause's own message instead of asserting a connection problem it
 * does not know it had.
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
 * WHEN-TO-USE: From the runner, once an `api` route's call either rejects or resolves with a
 * non-2xx status.
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
        ? `failed with no URL known: ${String(cause)}`
        : status === null
          ? `at ${url} refused the connection: ${String(cause)}`
          : `at ${url} answered ${String(status)} with body: ${responseBody === null ? '(empty)' : responseBody}`;
    super(`recipe "${recipeName}": ingredient "${ingredientName}"'s "${route}" route ${outcome}`);
    this.name = 'HydrationRouteFailedError';
  }
}

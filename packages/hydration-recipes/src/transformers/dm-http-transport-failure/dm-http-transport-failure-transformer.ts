/**
 * PURPOSE: Decorates a transport-level rejection from `dmHttpRequestAdapter` with the URL the
 * caller was reaching, so `routeFailureTransformer` (`@dungeonmaster/hydration`) can mine it instead
 * of falling back to "no URL known". `dmHttpRequestAdapter` itself never attaches one — its raw
 * `fetch(...)` call has no try/catch around it, unlike the framework's own `fetchPostAdapter`, which
 * this repo's routes do not call — so every `api`-route broker that calls it decorates the rejection
 * at its own call site instead. Reach for this over `Object.assign`ing the raw cause: mining stays
 * consistent (`'url' in cause`) whether the decorated error wraps a `TypeError: fetch failed` or a
 * bare `Error` from `target.request` throwing.
 *
 * USAGE:
 * dmHttpTransportFailureTransformer({ cause: new TypeError('fetch failed'), url: 'http://x/api/guilds' });
 * // Returns an Error whose .url is 'http://x/api/guilds' and whose .cause is the original TypeError
 */

export const dmHttpTransportFailureTransformer = ({
  cause,
  url,
}: {
  cause: unknown;
  url: string;
}): Error => Object.assign(new Error(String(cause), { cause }), { url });

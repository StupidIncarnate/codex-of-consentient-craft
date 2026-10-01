/**
 * PURPOSE: Decorates a transport-level rejection from `dmHttpRequestBroker` with the URL the
 * caller was reaching, so `routeFailureTransformer` (`@dungeonmaster/hydration`) can mine it instead
 * of falling back to "no URL known". `dmHttpRequestBroker` attaches this in one place for both
 * its `fetchWithStatus` and `target.request` branches, so individual route callers do not have to
 * catch and decorate rejections themselves. Reach for this over `Object.assign`ing the raw cause:
 * mining stays consistent (`'url' in cause`) whether the decorated error wraps a `TypeError: fetch
 * failed` or a bare `Error` from `target.request` throwing.
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

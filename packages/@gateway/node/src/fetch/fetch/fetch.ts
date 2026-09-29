/**
 * PURPOSE: Performs one HTTP request through `globalThis.fetch` and hands back the raw `Response`
 * — status, headers and body stream untouched — for a caller that needs more than
 * `fetchWithStatus`'s `{status, ok, body}` (a header, a streamed or binary body, its own
 * `Request`). No timeout, no error rewriting: a refused connection rejects with Node's own
 * `TypeError: fetch failed`. Reads the global when called, so an interceptor installed after this
 * module loads is seen.
 *
 * USAGE:
 * const response = await fetch('http://127.0.0.1:4173/api/guilds', { method: 'POST' });
 * // response.headers.get('content-type'), await response.arrayBuffer(), ...
 */

export const fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> =>
  globalThis.fetch(input, init);

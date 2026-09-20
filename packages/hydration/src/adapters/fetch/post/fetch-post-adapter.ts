/**
 * PURPOSE: The `api` route helper an ingredient's `routes.api` calls — one POST of JSON fields,
 * returning the status and the raw body TEXT rather than a parsed object. Reach for this over
 * calling `fetch` inside a route directly: the verbatim body is what `HydrationRouteFailedError`
 * carries, and a route that parses the body first has already thrown the diagnosis away.
 *
 * Does NOT throw on a 4xx/5xx status — it returns it. Only a transport failure (a refused
 * connection, a DNS failure) rejects, and this is the one place `url` is still in scope when that
 * happens — `globalThis.fetch`'s own rejection carries no URL at all, so the rejection this adapter
 * throws instead carries `url` as a property. `routeFailureTransformer` mines it off that shape.
 *
 * `globalThis.fetch` itself rejects with a generic `TypeError: fetch failed` whose real reason —
 * `connect ECONNREFUSED …`, measured directly against a real closed socket — sits down its `.cause`
 * chain, not at a fixed depth: a refused socket and a DNS failure both nest one level on this Node,
 * but a multi-attempt (Happy Eyeballs) failure can nest an `AggregateError` there instead, and a
 * future Node is free to nest deeper still. Reading `cause.message` alone would surface "fetch
 * failed" for every transport failure and lose the one detail sad-path row 1 requires, so this walks
 * `.cause` to the DEEPEST error-shaped value it finds, however many levels that takes.
 *
 * Duck-typed with `in`/`typeof`, never `instanceof Error` — measured directly against a real
 * refused socket, `cause instanceof Error` is FALSE here: Jest's per-test-file VM context hands the
 * test its own `Error` constructor, distinct from the one Node's built-in `fetch` used to build the
 * rejection, so an identity check silently never matches and this whole unwrap becomes a no-op.
 *
 * USAGE:
 * await fetchPostAdapter({ url: someUrl, fields: { name: 'Test Guild' } });
 * // Returns { url, status, body } — body is the raw response text, unparsed
 */
import { httpResponseContract } from '../../../contracts/http-response/http-response-contract';
import type { HttpResponse } from '../../../contracts/http-response/http-response-contract';
import type { Url } from '../../../contracts/hydration-target/hydration-target-contract';

export const fetchPostAdapter = async ({
  url,
  fields,
}: {
  url: Url;
  fields: Record<string, unknown>;
}): Promise<HttpResponse> => {
  const response = await (async (): Promise<Response> => {
    try {
      return await globalThis.fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
    } catch (cause) {
      let deepest: unknown = cause;
      while (
        typeof deepest === 'object' &&
        deepest !== null &&
        'cause' in deepest &&
        typeof deepest.cause === 'object' &&
        deepest.cause !== null &&
        'message' in deepest.cause &&
        typeof deepest.cause.message === 'string'
      ) {
        deepest = deepest.cause;
      }
      const reason =
        typeof deepest === 'object' &&
        deepest !== null &&
        'message' in deepest &&
        typeof deepest.message === 'string'
          ? deepest.message
          : String(deepest);
      throw Object.assign(new Error(`POST ${url} refused: ${reason}`, { cause }), { url });
    }
  })();

  const body = await response.text();

  return httpResponseContract.parse({ url, status: response.status, body });
};

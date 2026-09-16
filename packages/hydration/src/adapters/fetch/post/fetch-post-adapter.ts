/**
 * PURPOSE: The `api` route helper an ingredient's `routes.api` calls — one POST of JSON fields,
 * returning the status and the raw body TEXT rather than a parsed object. Reach for this over
 * calling `fetch` inside a route directly: the verbatim body is what `HydrationRouteFailedError`
 * carries, and a route that parses the body first has already thrown the diagnosis away.
 *
 * Does NOT throw on a 4xx/5xx status — it returns it. Only a transport failure (a refused
 * connection, a DNS failure) rejects, with the original cause intact, so `routeFailureTransformer`
 * can mine `code: 'ECONNREFUSED'` off it.
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
  const response = await globalThis.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });

  const body = await response.text();

  return httpResponseContract.parse({ url, status: response.status, body });
};

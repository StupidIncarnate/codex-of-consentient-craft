/**
 * PURPOSE: Sends one HTTP request to the app under test, through `target.request` when the
 * caller supplied one and the global `fetch` against `target.baseUrl` otherwise. Reach for
 * this rather than calling `fetch` directly in a route — it is the seam that lets an
 * ingredient test drive the real handler in process, with no port at all, by supplying a
 * `target.request` that dispatches into an in-process Hono sub-app.
 *
 * A target's own `request` function must resolve to the same `DmHttpResponse` shape this
 * adapter returns for its `fetch` branch — `dmTargetContract`'s own test already stubs one as
 * `{ status: 201, body: {} }`, which is what keeps a route's assertions identical whichever
 * branch answered it.
 *
 * USAGE:
 * await dmHttpRequestAdapter({ target, method: 'POST', path: '/api/guilds', body: { name, path } });
 * // Returns { status, body } — the calling route's own contract parses `body` further
 */
import { dmHttpResponseContract } from '../../../contracts/dm-http-response/dm-http-response-contract';
import type { DmHttpResponse } from '../../../contracts/dm-http-response/dm-http-response-contract';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

const JSON_CONTENT_TYPE = 'application/json';

export const dmHttpRequestAdapter = async ({
  target,
  method,
  path,
  body,
}: {
  target: DmTarget;
  method: string;
  path: string;
  body?: unknown;
}): Promise<DmHttpResponse> => {
  if (target.request !== undefined) {
    const raw = await target.request(
      body === undefined ? { method, path } : { method, path, body },
    );
    return dmHttpResponseContract.parse(raw);
  }

  if (target.baseUrl === undefined) {
    throw new Error(
      `dmHttpRequestAdapter: target carries no request function and no baseUrl for ${method} ${path}`,
    );
  }

  const response = await fetch(`${target.baseUrl}${path}`, {
    method,
    ...(body === undefined
      ? {}
      : { body: JSON.stringify(body), headers: { 'Content-Type': JSON_CONTENT_TYPE } }),
  });

  const responseBody: unknown = await response.json();

  return dmHttpResponseContract.parse({ status: response.status, body: responseBody });
};

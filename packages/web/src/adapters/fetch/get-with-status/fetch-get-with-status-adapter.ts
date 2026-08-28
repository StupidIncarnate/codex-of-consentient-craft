/**
 * PURPOSE: Wraps browser fetch API for GET requests without throwing on non-2xx, so the caller
 * can tell a server's error response from a connection failure that never reached it. Reach for
 * this over fetchGetAdapter when that distinction matters (e.g. rendering a different message for
 * "server answered 500" vs "server unreachable"); reach for fetchPostWithStatusAdapter when the
 * request needs a JSON body.
 *
 * USAGE:
 * const result = await fetchGetWithStatusAdapter({ url: '/api/health/status' });
 * // result = { status, ok, body } — body is JSON-parsed when possible, else raw text.
 */

import { fetchWithStatusResultContract } from '../../../contracts/fetch-with-status-result/fetch-with-status-result-contract';
import type { FetchWithStatusResult } from '../../../contracts/fetch-with-status-result/fetch-with-status-result-contract';

export const fetchGetWithStatusAdapter = async ({
  url,
}: {
  url: string;
}): Promise<FetchWithStatusResult> => {
  const response = await globalThis.fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const text = await response.text();
  let parsedBody: unknown = null;
  if (text.length > 0) {
    try {
      parsedBody = JSON.parse(text) as unknown;
    } catch {
      parsedBody = text;
    }
  }

  return fetchWithStatusResultContract.parse({
    status: response.status,
    ok: response.ok,
    body: parsedBody,
  });
};

/**
 * PURPOSE: Wraps browser fetch API for POST requests with JSON body, returning the response
 * status, ok flag, and parsed body without throwing on non-2xx. Lets the caller branch on
 * status (e.g. surface a 409 denial body to the user instead of throwing). Connection-level
 * failures (`TypeError: fetch failed`) still throw — the caller catches them.
 *
 * USAGE:
 * const result = await fetchPostWithStatusAdapter({ url: '/api/orchestration/dispatch/play', body: {} });
 * // result = { status, ok, body } — body is JSON-parsed when possible, else raw text.
 */

import { fetchPostWithStatusResultContract } from '../../../contracts/fetch-post-with-status-result/fetch-post-with-status-result-contract';
import type { FetchPostWithStatusResult } from '../../../contracts/fetch-post-with-status-result/fetch-post-with-status-result-contract';

export const fetchPostWithStatusAdapter = async ({
  url,
  body,
}: {
  url: string;
  body: unknown;
}): Promise<FetchPostWithStatusResult> => {
  const response = await globalThis.fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
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

  return fetchPostWithStatusResultContract.parse({
    status: response.status,
    ok: response.ok,
    body: parsedBody,
  });
};

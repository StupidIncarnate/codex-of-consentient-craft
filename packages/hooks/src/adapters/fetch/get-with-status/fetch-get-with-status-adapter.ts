/**
 * PURPOSE: Wraps Node's global fetch API for GET requests, returning the response status,
 * ok flag, and parsed body without throwing on non-2xx. Lets the caller branch on status
 * (e.g. silently no-op a 404 vs. loudly fail on 5xx). Connection-level failures
 * (`TypeError: fetch failed`) still throw — the caller catches them.
 *
 * USAGE:
 * const result = await fetchGetWithStatusAdapter({ url: 'http://localhost:4800/api/quests/by-session/abc' });
 * // result = { status, ok, body } — body is JSON-parsed when possible, else raw text.
 */

import {
  fetchGetWithStatusResultContract,
  type FetchGetWithStatusResult,
} from '../../../contracts/fetch-get-with-status-result/fetch-get-with-status-result-contract';

export const fetchGetWithStatusAdapter = async ({
  url,
}: {
  url: string;
}): Promise<FetchGetWithStatusResult> => {
  const response = await globalThis.fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const text = await response.text();
  let body: unknown = null;
  if (text.length > 0) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = text;
    }
  }

  return fetchGetWithStatusResultContract.parse({
    status: response.status,
    ok: response.ok,
    body,
  });
};

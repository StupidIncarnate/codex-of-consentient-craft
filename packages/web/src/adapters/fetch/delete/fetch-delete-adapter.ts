/**
 * PURPOSE: Wraps browser fetch API for DELETE requests, returning parsed JSON. On a non-ok response carrying a JSON {error} body, throws an Error whose message is that server error so callers can surface it verbatim (e.g. the delete error toast).
 *
 * USAGE:
 * const data = await fetchDeleteAdapter({url: '/api/guilds/guild-123'});
 * // Returns parsed JSON response body; throws the server's {error} message on a 4xx, else a status fallback
 */

import { errorBodyContract } from '../../../contracts/error-body/error-body-contract';

export const fetchDeleteAdapter = async <TResponse>({
  url,
}: {
  url: string;
}): Promise<TResponse> => {
  const response = await globalThis.fetch(url, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const rawBody: unknown = await response.json().catch(() => null);
    const parsedBody = errorBodyContract.safeParse(rawBody);
    if (parsedBody.success) {
      throw new Error(parsedBody.data.error);
    }
    throw new Error(`DELETE ${url} failed with status ${String(response.status)}`);
  }

  return (await response.json()) as TResponse;
};

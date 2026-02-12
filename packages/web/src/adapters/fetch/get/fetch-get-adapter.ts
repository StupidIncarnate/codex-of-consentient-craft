/**
 * PURPOSE: Wraps browser fetch API for GET requests, returning parsed JSON
 *
 * USAGE:
 * const data = await fetchGetAdapter({url: '/api/quests'});
 * // Returns parsed JSON response body
 */

export const fetchGetAdapter = async <TResponse>({ url }: { url: string }): Promise<TResponse> => {
  const response = await globalThis.fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`GET ${url} failed with status ${String(response.status)}`);
  }

  return (await response.json()) as TResponse;
};

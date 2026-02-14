/**
 * PURPOSE: Wraps browser fetch API for DELETE requests, returning parsed JSON
 *
 * USAGE:
 * const data = await fetchDeleteAdapter({url: '/api/guilds/guild-123'});
 * // Returns parsed JSON response body
 */

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
    throw new Error(`DELETE ${url} failed with status ${String(response.status)}`);
  }

  return (await response.json()) as TResponse;
};

/**
 * PURPOSE: Wraps browser fetch API for PATCH requests with JSON body, returning parsed JSON
 *
 * USAGE:
 * const data = await fetchPatchAdapter({url: '/api/quests/quest-123', body: {status: 'approved'}});
 * // Returns parsed JSON response body
 */

export const fetchPatchAdapter = async <TResponse>({
  url,
  body,
}: {
  url: string;
  body: unknown;
}): Promise<TResponse> => {
  const response = await globalThis.fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`PATCH ${url} failed with status ${String(response.status)}`);
  }

  return (await response.json()) as TResponse;
};

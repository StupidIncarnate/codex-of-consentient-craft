/**
 * PURPOSE: Wraps browser fetch API for POST requests with JSON body, returning parsed JSON
 *
 * USAGE:
 * const data = await fetchPostAdapter({url: '/api/quests/start', body: {questId: 'quest-123'}});
 * // Returns parsed JSON response body
 */

export const fetchPostAdapter = async <TResponse>({
  url,
  body,
}: {
  url: string;
  body: unknown;
}): Promise<TResponse> => {
  const response = await globalThis.fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`POST ${url} failed with status ${String(response.status)}`);
  }

  return (await response.json()) as TResponse;
};

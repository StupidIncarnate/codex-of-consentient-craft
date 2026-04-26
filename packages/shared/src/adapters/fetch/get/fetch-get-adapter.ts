/**
 * PURPOSE: Wraps Node's global fetch API for GET requests, returning parsed JSON
 *
 * USAGE:
 * const data = await fetchGetAdapter<{ status: string }>({ url: 'http://localhost:4750/api/process/abc' });
 * // Returns parsed JSON response body. Throws Error with URL, status, and body text on non-OK responses.
 */

export const fetchGetAdapter = async <TResponse>({ url }: { url: string }): Promise<TResponse> => {
  const response = await globalThis.fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    throw new Error(`GET ${url} failed with status ${String(response.status)}: ${bodyText}`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text) as TResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`GET ${url} returned invalid JSON: ${message} (body: ${text})`, {
      cause: error,
    });
  }
};

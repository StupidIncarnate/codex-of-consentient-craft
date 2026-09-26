/**
 * PURPOSE: Performs one JSON HTTP request via the browser's `fetch`. Body-serializes an object,
 * resolves a relative URL against the page (the platform's own behaviour — no base URL is
 * constructed here), and throws with url/status/body context on anything short of a 2xx. Reach for
 * this whenever a caller wants "throw on anything unready"; unlike the Node gateway's version, no
 * internal timeout is applied — a caller that wants one composes its own `AbortController` and
 * passes `signal`, since no browser caller in this codebase needed one yet.
 *
 * USAGE:
 * await fetchJson({ url: '/api/quests', method: 'POST', body: { name: 'quest-1' } });
 * // Returns the parsed JSON response body; throws naming url, status and body text otherwise
 */

export const fetchJson = async <TResponse>({
  url,
  method,
  headers,
  body,
  signal,
}: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}): Promise<TResponse> => {
  const requestHeaders: Record<string, string> = { ...headers };
  const isObjectBody = body !== undefined && typeof body !== 'string';
  const requestBody: BodyInit | undefined =
    body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body);

  if (
    isObjectBody &&
    !Object.keys(requestHeaders).some((key) => key.toLowerCase() === 'content-type')
  ) {
    requestHeaders['content-type'] = 'application/json';
  }

  const response = await globalThis.fetch(url, {
    method: method ?? 'GET',
    headers: requestHeaders,
    ...(requestBody === undefined ? {} : { body: requestBody }),
    ...(signal === undefined ? {} : { signal }),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `${method ?? 'GET'} ${url} failed with status ${String(response.status)}: ${text}`,
    );
  }

  try {
    return JSON.parse(text) as TResponse;
  } catch (parseError) {
    const message = parseError instanceof Error ? parseError.message : String(parseError);
    throw new Error(`${method ?? 'GET'} ${url} returned invalid JSON: ${message} (body: ${text})`, {
      cause: parseError,
    });
  }
};

/**
 * PURPOSE: Performs one JSON HTTP request via `globalThis.fetch` — auto-serializes an object
 * body, always applies a timeout via an internal `AbortController`, and throws with url/status/
 * body context on anything short of success. Reach for this over a bare `fetch` call whenever
 * the caller wants "throw on anything unready"; reach for `fetchOk` instead when polling for
 * readiness, since that one never throws for the three "still booting" shapes a poll loop
 * expects. Returns `unknown`, never a caller-picked type: the gateway cannot import the caller's
 * contracts, so it cannot check what it hands back — the caller parses the result through one.
 *
 * USAGE:
 * const parsed = await fetchJson({ url: 'http://127.0.0.1:4173/api/guilds', method: 'POST', body: { name: 'guild-1' } });
 * const guild = guildContract.parse(parsed);
 * // fetchJson resolves the parsed JSON response body as `unknown`; throws naming url, status and
 * // body text otherwise
 */

// Not read from a statics file — the gateway holds no dependency on any caller's own package,
// including its statics folders, so this default is a plain literal local to this function.
const DEFAULT_TIMEOUT_MS = 10_000;

export const fetchJson = async ({
  url,
  method,
  headers,
  body,
  timeoutMs,
}: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
}): Promise<unknown> => {
  const requestHeaders: Record<string, string> = { ...headers };
  const isObjectBody = body !== undefined && typeof body !== 'string';
  const requestBody: RequestInit['body'] =
    body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body);

  if (
    isObjectBody &&
    !Object.keys(requestHeaders).some((key) => key.toLowerCase() === 'content-type')
  ) {
    requestHeaders['content-type'] = 'application/json';
  }

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const response = await globalThis.fetch(url, {
      method: method ?? 'GET',
      headers: requestHeaders,
      ...(requestBody === undefined ? {} : { body: requestBody }),
      signal: controller.signal,
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(
        `${method ?? 'GET'} ${url} failed with status ${String(response.status)}: ${text}`,
      );
    }

    try {
      return JSON.parse(text);
    } catch (parseError) {
      const message = parseError instanceof Error ? parseError.message : String(parseError);
      throw new Error(
        `${method ?? 'GET'} ${url} returned invalid JSON: ${message} (body: ${text})`,
        {
          cause: parseError,
        },
      );
    }
  } finally {
    clearTimeout(timer);
  }
};

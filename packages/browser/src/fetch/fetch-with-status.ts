/**
 * PURPOSE: Performs one HTTP request via the browser's `fetch` and reports `{status, ok, body}`
 * for ANY response — 2xx through 5xx — without throwing; `body` is the raw response text, left
 * unparsed so a JSON-wanting caller parses it itself. Reach for this over `fetchJson` whenever
 * the caller means to branch on status rather than treat non-2xx as an error. Unlike the Node
 * gateway's version, no internal timeout is applied — a caller that wants one composes its own
 * `AbortController` and passes `signal`, matching this package's `fetchJson`.
 *
 * Throws ONLY when no HTTP response arrived at all — a refused connection, a DNS failure, or a
 * caller-supplied `signal` firing. The thrown error's message names `url`; it also carries `code`
 * off the DEEPEST `.cause` under the rejection the browser's `fetch` raised, when one exists.
 *
 * USAGE:
 * const result = await fetchWithStatus({ url: '/api/orchestration/dispatch/play', body: {} });
 * // result = { status, ok, body } — body is the raw response text, never parsed
 */

export const fetchWithStatus = async ({
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
}): Promise<{ status: number; ok: boolean; body: string }> => {
  const requestBody: BodyInit | undefined =
    body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body);

  const response = await (async (): Promise<Response> => {
    try {
      return await globalThis.fetch(url, {
        method: method ?? 'GET',
        ...(headers === undefined ? {} : { headers }),
        ...(requestBody === undefined ? {} : { body: requestBody }),
        ...(signal === undefined ? {} : { signal }),
      });
    } catch (cause) {
      // Walk to the deepest error-shaped `.cause` — see the Node gateway's own `fetch-with-status`
      // header for why this cannot stop at a fixed depth.
      let deepest: unknown = cause;
      while (
        typeof deepest === 'object' &&
        deepest !== null &&
        'cause' in deepest &&
        typeof deepest.cause === 'object' &&
        deepest.cause !== null &&
        'message' in deepest.cause &&
        typeof deepest.cause.message === 'string'
      ) {
        deepest = deepest.cause;
      }
      const reason =
        typeof deepest === 'object' &&
        deepest !== null &&
        'message' in deepest &&
        typeof deepest.message === 'string'
          ? deepest.message
          : String(deepest);
      const code =
        typeof deepest === 'object' &&
        deepest !== null &&
        'code' in deepest &&
        typeof deepest.code === 'string'
          ? deepest.code
          : undefined;
      throw Object.assign(new Error(`${method ?? 'GET'} ${url} failed: ${reason}`, { cause }), {
        url,
        ...(code === undefined ? {} : { code }),
      });
    }
  })();

  const text = await response.text();

  return { status: response.status, ok: response.ok, body: text };
};

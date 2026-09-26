/**
 * PURPOSE: Performs one HTTP request via `globalThis.fetch` and reports `{status, ok, body}` for
 * ANY response — 2xx through 5xx — without throwing; `body` is the raw response text, left
 * unparsed so a JSON-wanting caller parses it itself and a raw-text-wanting caller (a route
 * helper diagnosing a failure) never has the verbatim copy thrown away. Reach for this over
 * `fetchJson` whenever the caller means to branch on status rather than treat non-2xx as an
 * error, and over `fetchOk` whenever the caller needs the body too.
 *
 * Throws ONLY when no HTTP response arrived at all — a refused connection, a DNS failure, or the
 * internal timeout firing. The thrown error's message names `url`; it also carries `code` off the
 * DEEPEST `.cause` under the rejection Node's `fetch` raised, since `TypeError: fetch failed`
 * itself carries no code — only its `.cause` chain does (`connect ECONNREFUSED`,
 * `getaddrinfo ENOTFOUND`, …) — and that chain nests one level for a single refused socket but can
 * nest further for a multi-attempt (Happy Eyeballs) failure.
 *
 * USAGE:
 * const result = await fetchWithStatus({ url: 'http://127.0.0.1:4173/api/guilds' });
 * // result = { status, ok, body } — body is the raw response text, never parsed
 */

// Not read from a statics file — the gateway holds no dependency on any caller's own package,
// including its statics folders, so this default is a plain literal local to this function.
const DEFAULT_TIMEOUT_MS = 10_000;

export const fetchWithStatus = async ({
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
}): Promise<{ status: number; ok: boolean; body: string }> => {
  const requestBody: BodyInit | undefined =
    body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body);

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs ?? DEFAULT_TIMEOUT_MS);

  const response = await (async (): Promise<Response> => {
    try {
      return await globalThis.fetch(url, {
        method: method ?? 'GET',
        ...(headers === undefined ? {} : { headers }),
        ...(requestBody === undefined ? {} : { body: requestBody }),
        signal: controller.signal,
      });
    } catch (cause) {
      // Walk to the deepest error-shaped `.cause` — Node's own `TypeError: fetch failed` nests the
      // real reason one level down for a single refused socket, but a multi-attempt failure can
      // nest an AggregateError there instead, so this does not stop at a fixed depth.
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
    } finally {
      clearTimeout(timer);
    }
  })();

  const text = await response.text();

  return { status: response.status, ok: response.ok, body: text };
};

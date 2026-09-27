/**
 * PURPOSE: A real `Response` instance, built through the real constructor (the same `undici`
 * implementation this package's jsdom test environment polyfills `globalThis.Response` with) — for
 * a caller staging what `#gateway/browser/fetch`'s wrappers actually resolve with, rather than a
 * hand-typed object cast as `Response`. The `ECONNREFUSED` failure case is
 * `#gateway/node/net/connection-refused-error/connection-refused-error.stub`, already reused by
 * this package's own fetch proxies.
 *
 * USAGE:
 * const response = FetchResponseStub({ body: { id: 'g1' } });
 */

export const FetchResponseStub = ({
  body = { ok: true },
  status = 200,
}: { body?: unknown; status?: number } = {}): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

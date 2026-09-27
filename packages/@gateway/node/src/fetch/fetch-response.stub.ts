/**
 * PURPOSE: A real `Response` instance, built through the real constructor (the same `undici`
 * implementation Node's own global `fetch` returns) — for a caller staging what
 * `#gateway/node/fetch`'s wrappers actually resolve with, rather than a hand-typed object cast as
 * `Response`.
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

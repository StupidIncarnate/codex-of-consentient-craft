/**
 * PURPOSE: Probes one URL once and reports whether it answered READY, for `lane-ready-wait-broker`'s
 * poll loop. Ready means a 2xx status — `Response.ok` — and nothing looser: a 3xx never reached the
 * route's own handler (it reached a redirect instead), and a 4xx means the request or the route
 * itself is wrong, neither of which this probe can tell apart from "still booting" by status alone,
 * so both stay "not ready" and let the caller's deadline keep polling rather than reporting a false
 * ready. A 5xx is the same shape as a 4xx here for the same reason, but it is also the specific
 * defect this adapter used to have: a server up but broken — answering 500 on every route — used to
 * read as ready, so `laneBootBroker`'s own boot-failure cleanup never fired and the process leaked
 * past its driver's death. Exactly two failure shapes read as "not ready" and resolve `false` rather
 * than throwing: an abort once `timeoutMs` elapses (`AbortController.abort()` rejects fetch with a
 * `DOMException` named `AbortError`), and a refused connection while the server is still binding its
 * port (`ECONNREFUSED`, surfaced as `error.cause.code` under Node's `TypeError: fetch failed`
 * wrapper, or as the rejection's own message for a caller that raises the network error directly).
 * The DEADLINE the ready-wait broker owns is what turns a persistent refusal into a reported boot
 * failure, not this adapter, so a still-binding server on attempt one looks identical to attempt
 * fifty. Any OTHER rejection — a malformed URL, a coding defect — PROPAGATES rather than reading as
 * "not ready", so a genuine bug surfaces immediately instead of silently burning the caller's whole
 * boot timeout first.
 *
 * USAGE:
 * await fetchProbeAdapter({ url: 'http://dungeonmaster.localhost:34172/api/guilds', timeoutMs: 5000 });
 * // 2xx: true. Any other status, a refused connection, or no answer inside timeoutMs: false.
 * // Any other rejection: throws
 */

import { isNativeError } from 'util/types';

export const fetchProbeAdapter = async ({
  url,
  timeoutMs,
}: {
  url: string;
  timeoutMs: number;
}): Promise<boolean> => {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await globalThis.fetch(url, { signal: controller.signal });
    return response.ok;
  } catch (error: unknown) {
    // `globalThis.fetch` (undici) raises `TypeError: fetch failed` with the real socket error as
    // `.cause`, both built by Node's own internals outside the vm context a Jest test file runs
    // inside — `instanceof Error` reads false against either one even though they genuinely are
    // Errors (registry-lock-acquire-broker.ts's own header documents the identical failure).
    // `isNativeError` (from `util/types`, imported directly since this IS the adapter wrapping a
    // builtin — a sibling adapter would violate the no-adapter-imports-adapter rule) checks the
    // V8-internal error slot instead, answering correctly whichever realm constructed the value.
    if (
      error !== null &&
      typeof error === 'object' &&
      isNativeError(error) &&
      'name' in error &&
      error.name === 'AbortError'
    ) {
      return false;
    }

    const cause =
      error !== null && typeof error === 'object' && 'cause' in error ? error.cause : null;
    const causeIsNativeError = cause !== null && typeof cause === 'object' && isNativeError(cause);
    const causeCode = causeIsNativeError && 'code' in cause ? cause.code : null;
    const causeMessage = causeIsNativeError ? cause.message : '';
    const message =
      error !== null && typeof error === 'object' && isNativeError(error) ? error.message : '';

    if (
      causeCode === 'ECONNREFUSED' ||
      message.includes('ECONNREFUSED') ||
      causeMessage.includes('ECONNREFUSED')
    ) {
      return false;
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
};

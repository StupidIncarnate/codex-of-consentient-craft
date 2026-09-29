/**
 * PURPOSE: Probes one URL once and reports whether it answered ready (a 2xx status). Exactly two
 * failure shapes read as "not ready" and resolve `false` rather than throwing: an abort once
 * `timeoutMs` elapses, and a refused connection while a server is still binding its port. Any
 * OTHER rejection propagates, so a genuine bug (a malformed URL, a coding defect) surfaces
 * immediately instead of silently burning a poll loop's whole deadline.
 *
 * USAGE:
 * await fetchOk({ url: 'http://localhost:4173/api/guilds', timeoutMs: 5000 });
 * // 2xx: true. Any other status, a refused connection, or no answer inside timeoutMs: false.
 */

import { isNativeError } from '../../util__types/util__types';

export const fetchOk = async ({
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
    // Errors. `isNativeError` checks the V8-internal error slot instead, answering correctly
    // whichever realm constructed the value.
    // An aborted fetch rejects with `signal.reason`, a `DOMException` — not a native `Error`, so
    // the abort check reads `.name` alone.
    if (
      error !== null &&
      typeof error === 'object' &&
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

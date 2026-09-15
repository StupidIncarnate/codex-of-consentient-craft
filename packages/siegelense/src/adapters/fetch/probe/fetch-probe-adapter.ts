/**
 * PURPOSE: Probes one URL once and reports whether it answered, for `lane-ready-wait-broker`'s poll
 * loop. Exactly two failure shapes read as "not ready" and resolve `false` rather than throwing: an
 * abort once `timeoutMs` elapses (`AbortController.abort()` rejects fetch with a `DOMException`
 * named `AbortError`), and a refused connection while the server is still binding its port
 * (`ECONNREFUSED`, surfaced as `error.cause.code` under Node's `TypeError: fetch failed` wrapper, or
 * as the rejection's own message for a caller that raises the network error directly). The DEADLINE
 * the ready-wait broker owns is what turns a persistent refusal into a reported boot failure, not
 * this adapter, so a still-binding server on attempt one looks identical to attempt fifty. Any OTHER
 * rejection — a malformed URL, a coding defect — PROPAGATES rather than reading as "not ready", so a
 * genuine bug surfaces immediately instead of silently burning the caller's whole boot timeout first.
 *
 * USAGE:
 * await fetchProbeAdapter({ url: 'http://dungeonmaster.localhost:34172/api/guilds', timeoutMs: 5000 });
 * // Reachable: true. Refused, or no answer inside timeoutMs: false. Any other rejection: throws
 */

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
    await globalThis.fetch(url, { signal: controller.signal });
    return true;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return false;
    }

    const causeCode =
      error instanceof Error && error.cause instanceof Error && 'code' in error.cause
        ? error.cause.code
        : null;
    const message = error instanceof Error ? error.message : '';
    const causeMessage =
      error instanceof Error && error.cause instanceof Error ? error.cause.message : '';

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

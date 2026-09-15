/**
 * PURPOSE: Probes one URL once and reports whether it answered, for `lane-ready-wait-broker`'s poll
 * loop. A refused connection AND a probe that outlives `timeoutMs` both resolve `false` rather than
 * throwing — the DEADLINE the ready-wait broker owns is what turns a persistent refusal into a
 * reported boot failure, not this adapter, so a still-binding server on attempt one looks identical
 * to attempt fifty.
 *
 * USAGE:
 * await fetchProbeAdapter({ url: 'http://dungeonmaster.localhost:34172/api/guilds', timeoutMs: 5000 });
 * // Reachable: true. Refused, or no answer inside timeoutMs: false
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
  } catch {
    // A connection refused while the server is still binding its port, and an abort once
    // timeoutMs elapses, read identically here — see PURPOSE.
    return false;
  } finally {
    clearTimeout(timer);
  }
};

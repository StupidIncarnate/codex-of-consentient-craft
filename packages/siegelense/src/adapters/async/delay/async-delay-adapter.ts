/**
 * PURPOSE: Wraps setTimeout as an awaitable promise so callers can pause for a fixed interval,
 * and proxies can mock or immediately resolve the delay in unit tests.
 *
 * USAGE:
 * await asyncDelayAdapter({ ms: 1500 });
 * // Resolves after 1500ms with { success: true }
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const asyncDelayAdapter = async ({ ms }: { ms: number }): Promise<AdapterResult> =>
  new Promise<AdapterResult>((resolve) => {
    setTimeout(() => {
      resolve({ success: true as const });
    }, ms);
  });

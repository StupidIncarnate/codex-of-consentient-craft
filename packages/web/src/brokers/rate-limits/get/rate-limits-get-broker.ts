/**
 * PURPOSE: Fetches the latest 5h/7d rate-limits snapshot from the API
 *
 * USAGE:
 * const snapshot = await rateLimitsGetBroker();
 * // Returns: RateLimitsSnapshot | null. Null when no statusline-tap has run yet.
 */
import { rateLimitsSnapshotContract } from '@dungeonmaster/shared/contracts';
import type { RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const rateLimitsGetBroker = async (): Promise<RateLimitsSnapshot | null> => {
  const response = await fetchGetAdapter<{ snapshot: unknown }>({
    url: webConfigStatics.api.routes.rateLimits,
  });

  if (response.snapshot === null) {
    return null;
  }

  return rateLimitsSnapshotContract.parse(response.snapshot);
};

/**
 * PURPOSE: Fetches the latest 5h/7d rate-limits snapshot from the API
 *
 * USAGE:
 * const snapshot = await rateLimitsGetBroker();
 * // Returns: RateLimitsSnapshot | null. Null when no statusline-tap has run yet.
 */
import type { RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { rateLimitsGetResultContract } from '../../../contracts/rate-limits-get-result/rate-limits-get-result-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const rateLimitsGetBroker = async (): Promise<RateLimitsSnapshot | null> => {
  const response = await fetchJson({
    url: webConfigStatics.api.routes.rateLimits,
  });

  return rateLimitsGetResultContract.parse(response).snapshot;
};

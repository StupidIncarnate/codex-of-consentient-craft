/**
 * PURPOSE: Returns the latest cached RateLimitsSnapshot from rateLimitsState — used by the HTTP GET /api/rate-limits route
 *
 * USAGE:
 * const snapshot = RateLimitsGetResponder();
 * // Returns: RateLimitsSnapshot | null. Null when no snapshot has been read from disk yet.
 */

import type { RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';

import { rateLimitsState } from '../../../state/rate-limits/rate-limits-state';

export const RateLimitsGetResponder = (): RateLimitsSnapshot | null => rateLimitsState.get();

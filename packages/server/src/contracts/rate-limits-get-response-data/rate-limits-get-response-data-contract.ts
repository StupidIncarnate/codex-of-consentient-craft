/**
 * PURPOSE: Defines the `data` RateLimitsGetResponder returns on success
 *
 * USAGE:
 * const data = rateLimitsGetResponseDataContract.parse(value);
 * // Returns validated RateLimitsGetResponseData
 */

import { z } from '#gateway/npm/zod';
import { rateLimitsSnapshotContract } from '@dungeonmaster/shared/contracts';

export const rateLimitsGetResponseDataContract = z.strictObject({ snapshot: rateLimitsSnapshotContract.nullable() }).brand<'RateLimitsGetResponseData'>();

export type RateLimitsGetResponseData = z.infer<typeof rateLimitsGetResponseDataContract>;

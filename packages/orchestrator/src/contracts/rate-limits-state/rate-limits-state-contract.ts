/**
 * PURPOSE: Defines the data held by `state` in rate-limits-state
 *
 * USAGE:
 * rateLimitsStateContract.parse(value);
 * // Returns validated RateLimitsState
 */
import { z } from '#gateway/npm/zod';
import { rateLimitsSnapshotContract } from '@dungeonmaster/shared/contracts';

export const rateLimitsStateContract = z
  .object({ snapshot: rateLimitsSnapshotContract.nullable() })
  .brand<'RateLimitsState'>();

export type RateLimitsState = z.infer<typeof rateLimitsStateContract>;

/**
 * PURPOSE: Defines the data `useRateLimitsBinding` returns
 *
 * USAGE:
 * useRateLimitsResultContract.parse(value);
 * // Returns validated UseRateLimitsResult
 */
import { z } from '#gateway/npm/zod';
import { rateLimitsSnapshotContract } from '@dungeonmaster/shared/contracts';

export const useRateLimitsResultContract = z
  .object({ snapshot: rateLimitsSnapshotContract.nullable(), isLoading: z.boolean() })
  .brand<'UseRateLimitsResult'>();

export type UseRateLimitsResult = z.infer<typeof useRateLimitsResultContract>;

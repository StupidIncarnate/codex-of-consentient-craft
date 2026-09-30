/**
 * PURPOSE: Builds a valid UseRateLimitsResult for tests
 *
 * USAGE:
 * UseRateLimitsResultStub();
 * // Returns a valid UseRateLimitsResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts/rate-limits-snapshot/rate-limits-snapshot.stub';

import { useRateLimitsResultContract } from './use-rate-limits-result-contract';
import type { UseRateLimitsResult } from './use-rate-limits-result-contract';

export const UseRateLimitsResultStub = ({
  ...props
}: StubArgument<UseRateLimitsResult> = {}): UseRateLimitsResult =>
  useRateLimitsResultContract.parse({
    snapshot: RateLimitsSnapshotStub(),
    isLoading: false,
    ...props,
  });

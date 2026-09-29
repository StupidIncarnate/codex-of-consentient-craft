/**
 * PURPOSE: Builds a valid RateLimitsGetResult for tests, defaulting to a populated snapshot.
 *
 * USAGE:
 * RateLimitsGetResultStub({ snapshot: null });
 * // Returns { snapshot: null }
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';
import { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts/rate-limits-snapshot/rate-limits-snapshot.stub';

import { rateLimitsGetResultContract } from './rate-limits-get-result-contract';
import type { RateLimitsGetResult } from './rate-limits-get-result-contract';

export const RateLimitsGetResultStub = ({
  ...props
}: StubArgument<RateLimitsGetResult> = {}): RateLimitsGetResult =>
  rateLimitsGetResultContract.parse({
    snapshot: RateLimitsSnapshotStub(),
    ...props,
  });

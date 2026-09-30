/**
 * PURPOSE: Builds a valid RateLimitsState for tests
 *
 * USAGE:
 * RateLimitsStateStub();
 * // Returns a valid RateLimitsState
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts/rate-limits-snapshot/rate-limits-snapshot.stub';

import { rateLimitsStateContract } from './rate-limits-state-contract';
import type { RateLimitsState } from './rate-limits-state-contract';

export const RateLimitsStateStub = ({
  ...props
}: StubArgument<RateLimitsState> = {}): RateLimitsState =>
  rateLimitsStateContract.parse({ snapshot: RateLimitsSnapshotStub(), ...props });

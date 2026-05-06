import type { StubArgument } from '@dungeonmaster/shared/@types';

import { RateLimitWindowStub } from '../rate-limit-window/rate-limit-window.stub';
import { rateLimitsSnapshotContract } from './rate-limits-snapshot-contract';
import type { RateLimitsSnapshot } from './rate-limits-snapshot-contract';

export const RateLimitsSnapshotStub = ({
  ...props
}: StubArgument<RateLimitsSnapshot> = {}): RateLimitsSnapshot =>
  rateLimitsSnapshotContract.parse({
    fiveHour: RateLimitWindowStub({ usedPercentage: 42 }),
    sevenDay: RateLimitWindowStub({ usedPercentage: 20 }),
    updatedAt: '2026-05-05T13:00:00.000Z',
    ...props,
  });

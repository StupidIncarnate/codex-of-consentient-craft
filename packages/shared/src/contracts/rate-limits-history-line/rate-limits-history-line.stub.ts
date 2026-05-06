import type { StubArgument } from '@dungeonmaster/shared/@types';

import { RateLimitWindowStub } from '../rate-limit-window/rate-limit-window.stub';
import { rateLimitsHistoryLineContract } from './rate-limits-history-line-contract';
import type { RateLimitsHistoryLine } from './rate-limits-history-line-contract';

export const RateLimitsHistoryLineStub = ({
  ...props
}: StubArgument<RateLimitsHistoryLine> = {}): RateLimitsHistoryLine =>
  rateLimitsHistoryLineContract.parse({
    at: '2026-05-05T13:00:00.000Z',
    fiveHour: RateLimitWindowStub({ usedPercentage: 42 }),
    sevenDay: RateLimitWindowStub({ usedPercentage: 20 }),
    ...props,
  });

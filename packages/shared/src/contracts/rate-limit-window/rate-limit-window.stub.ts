import type { StubArgument } from '@dungeonmaster/shared/@types';

import { rateLimitWindowContract } from './rate-limit-window-contract';
import type { RateLimitWindow } from './rate-limit-window-contract';

export const RateLimitWindowStub = ({
  ...props
}: StubArgument<RateLimitWindow> = {}): RateLimitWindow =>
  rateLimitWindowContract.parse({
    usedPercentage: 42,
    resetsAt: '2026-05-05T15:00:00.000Z',
    ...props,
  });

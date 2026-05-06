import type { StubArgument } from '@dungeonmaster/shared/@types';
import { FileContentsStub } from '@dungeonmaster/shared/contracts';

import { rateLimitsWatchTickResultContract } from './rate-limits-watch-tick-result-contract';
import type { RateLimitsWatchTickResult } from './rate-limits-watch-tick-result-contract';

export const RateLimitsWatchTickResultStub = ({
  ...props
}: StubArgument<RateLimitsWatchTickResult> = {}): RateLimitsWatchTickResult =>
  rateLimitsWatchTickResultContract.parse({
    outcome: 'changed',
    lastJson: FileContentsStub({ value: '{"x":1}' }),
    ...props,
  });

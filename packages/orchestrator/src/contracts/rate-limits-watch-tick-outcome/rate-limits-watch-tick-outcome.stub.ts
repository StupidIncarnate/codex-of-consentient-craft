import { rateLimitsWatchTickOutcomeContract } from './rate-limits-watch-tick-outcome-contract';
import type { RateLimitsWatchTickOutcome } from './rate-limits-watch-tick-outcome-contract';

export const RateLimitsWatchTickOutcomeStub = (
  { value }: { value: string } = { value: 'changed' },
): RateLimitsWatchTickOutcome => rateLimitsWatchTickOutcomeContract.parse(value);

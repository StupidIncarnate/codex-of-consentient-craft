import type { StubArgument } from '@dungeonmaster/shared/@types';

import { rateLimitsWatchHandleContract } from './rate-limits-watch-handle-contract';
import type { RateLimitsWatchHandle } from './rate-limits-watch-handle-contract';

export const RateLimitsWatchHandleStub = ({
  ...props
}: StubArgument<RateLimitsWatchHandle> = {}): RateLimitsWatchHandle => {
  const { stop, ...dataProps } = props;

  return {
    ...rateLimitsWatchHandleContract.parse(dataProps),
    stop: stop ?? ((): void => undefined),
  };
};

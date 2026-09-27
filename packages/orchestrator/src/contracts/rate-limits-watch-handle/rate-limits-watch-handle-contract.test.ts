import { rateLimitsWatchHandleContract } from './rate-limits-watch-handle-contract';
import type { RateLimitsWatchHandle } from './rate-limits-watch-handle-contract';
import { RateLimitsWatchHandleStub } from './rate-limits-watch-handle.stub';

describe('rateLimitsWatchHandleContract', () => {
  it('VALID: stub default => parses and stop is callable', () => {
    const stop = jest.fn();
    const handle = RateLimitsWatchHandleStub({ stop });
    // `.loose()` infers `{[x: string]: unknown}` — `stop` lives outside the schema (see the
    // contract's own header), so this cast asserts what the stub above already typed.
    const parsed = rateLimitsWatchHandleContract.parse(handle) as RateLimitsWatchHandle;
    parsed.stop();

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('VALID: {stop function} => parses with custom stop', () => {
    const stop = jest.fn();

    const handle = RateLimitsWatchHandleStub({ stop });
    handle.stop();

    expect(stop).toHaveBeenCalledTimes(1);
  });
});
